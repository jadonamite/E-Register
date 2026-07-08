"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CaretDown,
  CaretLeft,
  CaretRight,
  UserPlus,
  Warning,
  ArrowUp,
  ArrowDown,
  Minus,
  Trophy,
  Pulse,
  Fire,
  CalendarBlank,
  UsersThree,
  Lightning,
  ChartLineUp,
  HeartBreak,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { CountUp } from "./CountUp";
import { TrendCurve } from "./TrendCurve";
import { AvatarStack } from "./AvatarStack";

interface NoShow {
  _id: string;
  name: string;
  role: string;
  cell: string;
  seniorCell: string;
  team: string;
  weeksAbsent: number;
}

interface CellData {
  name: string;
  registered: number;
  attended: number;
  percentage: number;
  noShows: NoShow[];
  firstTimers: number;
}

interface SeniorCellData {
  name: string;
  registered: number;
  attended: number;
  percentage: number;
  cells: CellData[];
}

interface TeamData {
  name: string;
  registered: number;
  attended: number;
  percentage: number;
  movement: number | null;
  seniorCells: SeniorCellData[];
}

interface FirstTimer {
  _id: string;
  name: string;
  cell?: string;
  invitedBy?: string;
}

interface WeeklyData {
  weekRange: { start: string; end: string };
  summary: {
    totalAttendance: number;
    attendanceRate: number;
    totalRegistered: number;
    totalFirstTimers: number;
    weekVsLastWeek: {
      thisWeek: number;
      lastWeek: number;
      change: number;
      percentageChange: number;
    };
  };
  teams: TeamData[];
  unassignedTeam?: TeamData | null;
  noShows: NoShow[];
  firstTimers: FirstTimer[];
  _meta?: {
    dataQualityIssues?: {
      unassignedCount: number;
      unassignedMessage?: string;
    };
  };
}

// The church tracks two services; metrics are always per service so
// percentages stay meaningful.
const SERVICES = [
  { label: "Sunday", value: "Sunday" },
  { label: "Wednesday", value: "Mid-Week" },
] as const;
type ServiceValue = (typeof SERVICES)[number]["value"];

// Leaderboard slides.
type SlideMode = "strength" | "attendance";
const SLIDES: { mode: SlideMode; title: string; hint: string }[] = [
  { mode: "strength", title: "Membership Strength", hint: "% of registered members present" },
  { mode: "attendance", title: "Total Attendance", hint: "raw head count per team" },
];

/** Sunday–Saturday of the week `offset` weeks away — the week opens with the Sunday service. */
function weekRange(offset: number): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + offset * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function performanceText(percentage: number) {
  if (percentage >= 80) return "text-emerald-700 bg-emerald-50";
  if (percentage >= 60) return "text-amber-700 bg-amber-50";
  return "text-rose-700 bg-rose-50";
}

function performanceBar(percentage: number) {
  if (percentage >= 80) return "bg-gradient-to-r from-emerald-400 to-emerald-500";
  if (percentage >= 60) return "bg-gradient-to-r from-amber-300 to-amber-400";
  return "bg-gradient-to-r from-rose-400 to-rose-500";
}

/** Gold, silver, bronze medals for the podium; neutral below. */
function rankBadge(rank: number) {
  if (rank === 0)
    return "bg-gradient-to-br from-amber-300 to-amber-500 text-white ring-4 ring-amber-200/70";
  if (rank === 1)
    return "bg-gradient-to-br from-zinc-300 to-zinc-400 text-white ring-4 ring-zinc-200/70";
  if (rank === 2)
    return "bg-gradient-to-br from-orange-300 to-orange-400 text-white ring-4 ring-orange-200/70";
  return "bg-white text-zinc-500";
}

// Deterministic hue per team/cell name so monograms stay consistent everywhere.
const MONOGRAM_HUES = [
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];
export function monogramHue(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return MONOGRAM_HUES[h % MONOGRAM_HUES.length];
}

function MovementChip({ movement }: { movement: number | null }) {
  if (movement === null) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-white text-zinc-400 text-[9px] font-black uppercase tracking-wider shadow-sm">
        New
      </span>
    );
  }
  if (movement === 0) {
    return (
      <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white text-zinc-400 text-[10px] font-black shadow-sm">
        <Minus size={10} weight="bold" />
      </span>
    );
  }
  const up = movement > 0;
  return (
    <span
      className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm ${
        up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
      }`}
    >
      {up ? <ArrowUp size={10} weight="fill" /> : <ArrowDown size={10} weight="fill" />}
      {Math.abs(movement)}
    </span>
  );
}

function StreakBadge({ weeks }: { weeks: number }) {
  const chronic = weeks >= 3;
  return (
    <span
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 shadow-sm ${
        chronic ? "bg-white text-rose-600" : "bg-white/70 text-zinc-500"
      }`}
    >
      {chronic && <Fire size={11} weight="fill" className="text-rose-500" />}
      {weeks >= 8 ? "8+ wks" : `${weeks} wk${weeks > 1 ? "s" : ""}`}
    </span>
  );
}

/** Fat pill progress bar with a white end-cap dot. */
function PillBar({ percentage, barClass, track = "bg-white" }: { percentage: number; barClass: string; track?: string }) {
  return (
    <div className={`h-3 ${track} rounded-full overflow-hidden`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(percentage, 3)}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`relative h-full rounded-full ${barClass}`}
      >
        <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/90" />
      </motion.div>
    </div>
  );
}

export function WeeklyAccountability({ trend }: { trend?: { date: string; count: number }[] }) {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [service, setService] = useState<ServiceValue>("Sunday");
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [expandedSeniorCell, setExpandedSeniorCell] = useState<string | null>(null);
  // Leaderboard slides: 0 = membership strength (%), 1 = total attendance (head count).
  const [slide, setSlide] = useState(0);

  const range = useMemo(() => weekRange(weekOffset), [weekOffset]);
  const serviceLabel = SERVICES.find((s) => s.value === service)!.label;

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          startDate: format(range.start, "yyyy-MM-dd"),
          endDate: format(range.end, "yyyy-MM-dd"),
          serviceType: service,
        });
        const res = await fetch(`/api/weekly-accountability?${params}`, {
          signal: controller.signal,
        });
        if (res.ok) setData(await res.json());
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) console.error(e);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [range, service]);

  const weekLabel =
    weekOffset === 0 ? "This Week" : weekOffset === -1 ? "Last Week" : `Week of ${format(range.start, "MMM d")}`;

  // No check-ins for this service+week yet: the service likely hasn't held,
  // so 0% / everyone-a-no-show would be misleading noise.
  const noDataYet = !!data && data.summary.totalAttendance === 0;

  const chronicCount = data?.noShows.filter((n) => n.weeksAbsent >= 3).length ?? 0;
  const trendWoW = data?.summary.weekVsLastWeek;
  const trendUp = (trendWoW?.change ?? 0) >= 0;

  const serviceToggle = (
    <div className="bg-white p-1.5 rounded-full flex gap-1">
      {SERVICES.map((s) => (
        <button
          key={s.value}
          onClick={() => setService(s.value)}
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
            service === s.value ? "bg-gray-900 text-white shadow-md" : "text-stone-400 hover:text-stone-600"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );

  const renderTeamList = (mode: SlideMode) => {
    if (!data) return null;
    const teams =
      mode === "strength" ? data.teams : [...data.teams].sort((a, b) => b.attended - a.attended);
    const maxAttended = Math.max(1, ...teams.map((t) => t.attended));

    const metricBadge = (attended: number, percentage: number, size: "sm" | "md" = "md") =>
      mode === "strength" ? (
        <div
          className={`rounded-full font-black shrink-0 ${performanceText(percentage)} ${
            size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs"
          }`}
        >
          {percentage}%
        </div>
      ) : (
        <div
          className={`rounded-full font-black shrink-0 bg-gray-900 text-white ${
            size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs"
          }`}
        >
          {attended}
        </div>
      );

    return (
      <div className="space-y-3">
        {teams.map((team, rank) => {
          const sortedSCs =
            mode === "strength"
              ? team.seniorCells
              : [...team.seniorCells].sort((a, b) => b.attended - a.attended);
          return (
            <div key={team.name} className="bg-[#F3EEE3] rounded-3xl overflow-hidden">
              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={() => setExpandedTeam(expandedTeam === team.name ? null : team.name)}
                className="w-full px-5 sm:px-6 py-4 text-left"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${rankBadge(rank)}`}
                  >
                    {rank + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-gray-900 truncate">{team.name}</h4>
                      {mode === "strength" && <MovementChip movement={team.movement} />}
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                      {mode === "strength"
                        ? `${team.attended} of ${team.registered} attended`
                        : `${team.percentage}% of ${team.registered} members`}
                    </p>
                  </div>
                  {metricBadge(team.attended, team.percentage)}
                  <CaretDown
                    size={18}
                    weight="bold"
                    className={`text-gray-300 transition-transform shrink-0 ${
                      expandedTeam === team.name ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <div className="mt-3 ml-[56px]">
                  <PillBar
                    percentage={mode === "strength" ? team.percentage : (team.attended / maxAttended) * 100}
                    barClass={
                      mode === "strength"
                        ? performanceBar(team.percentage)
                        : "bg-gradient-to-r from-gray-700 to-gray-900"
                    }
                  />
                </div>
              </motion.button>

              <AnimatePresence>
                {expandedTeam === team.name && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white"
                  >
                    {sortedSCs.map((seniorCell) => {
                      const scKey = `${team.name}::${seniorCell.name}`;
                      const sortedCells =
                        mode === "strength"
                          ? seniorCell.cells
                          : [...seniorCell.cells].sort((a, b) => b.attended - a.attended);
                      return (
                        <div key={scKey}>
                          <motion.button
                            whileTap={{ scale: 0.99 }}
                            onClick={() =>
                              setExpandedSeniorCell(expandedSeniorCell === scKey ? null : scKey)
                            }
                            className="w-full pl-8 pr-6 py-3 flex items-center justify-between hover:bg-[#FAF7F0] transition-colors text-left"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${monogramHue(seniorCell.name)}`}
                              >
                                {seniorCell.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-black text-gray-800 truncate">
                                  {seniorCell.name}
                                </h5>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                  {seniorCell.attended} of {seniorCell.registered}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {metricBadge(seniorCell.attended, seniorCell.percentage, "sm")}
                              <CaretDown
                                size={14}
                                weight="bold"
                                className={`text-gray-300 transition-transform ${
                                  expandedSeniorCell === scKey ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </motion.button>

                          <AnimatePresence>
                            {expandedSeniorCell === scKey && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-[#FAF7F0]"
                              >
                                {sortedCells.map((cell) => (
                                  <div key={cell.name} className="pl-14 pr-6 py-3">
                                    <div className="flex items-center justify-between">
                                      <div className="min-w-0">
                                        <h6 className="text-xs font-black text-gray-900 truncate">
                                          {cell.name}
                                        </h6>
                                        <p className="text-[9px] font-bold text-gray-400">
                                          {cell.attended} of {cell.registered} attended
                                          {cell.firstTimers > 0 &&
                                            ` · ${cell.firstTimers} first-timer${cell.firstTimers > 1 ? "s" : ""}`}
                                        </p>
                                      </div>
                                      {metricBadge(cell.attended, cell.percentage, "sm")}
                                    </div>
                                    {cell.noShows.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1.5">
                                        {cell.noShows.map((member) => (
                                          <span
                                            key={member._id}
                                            className="flex items-center gap-1.5 px-2.5 py-1 bg-white text-rose-600 rounded-full text-[9px] font-bold shadow-sm"
                                          >
                                            {member.name}
                                            <span className="opacity-50 font-black">
                                              {member.weeksAbsent >= 8 ? "8+w" : `${member.weeksAbsent}w`}
                                            </span>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-gray-900">
            Weekly Accountability
          </h2>
          <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.3em] mt-1">
            {serviceLabel} service · {format(range.start, "EEE MMM d")} — {format(range.end, "EEE MMM d")}
          </p>
        </div>

        <div className="bg-white rounded-full flex items-center p-1.5">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-zinc-50 transition-all"
            aria-label="Previous week"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <span className="px-3 min-w-[110px] text-center text-[10px] font-black uppercase tracking-widest text-gray-700">
            {weekLabel}
          </span>
          <button
            onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}
            disabled={weekOffset === 0}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-zinc-50 transition-all disabled:opacity-20"
            aria-label="Next week"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:auto-rows-[190px]">
          <div className="candy-card lg:col-span-2 lg:row-span-2 animate-pulse bg-zinc-100" />
          <div className="candy-card animate-pulse bg-zinc-100" />
          <div className="candy-card animate-pulse bg-zinc-100" />
          <div className="candy-card lg:col-span-2 animate-pulse bg-zinc-100" />
          <div className="candy-card lg:col-span-4 h-64 animate-pulse bg-zinc-100" />
        </div>
      ) : (
        <>
          {/* BENTO MOSAIC */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:auto-rows-[minmax(190px,auto)]"
          >
            {/* GLOW HERO 2×2 */}
            <div className="lg:col-span-2 lg:row-span-2 glow-tile text-white p-8 relative overflow-hidden flex flex-col justify-between">
              {/* rotated edge micro-text — signature detail from the reference */}
              <span className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 origin-center text-[9px] font-black uppercase tracking-[0.4em] text-white/25 whitespace-nowrap pointer-events-none">
                {serviceLabel} · {format(range.start, "MMM d")} · {data.summary.totalAttendance} souls
              </span>

              <div className="flex items-start justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35 mt-1">
                  Live Attendance
                </p>
                {!noDataYet && trendWoW && trendWoW.lastWeek > 0 && (
                  <div
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1 ${
                      trendUp ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"
                    }`}
                  >
                    {trendUp ? <ArrowUp size={12} weight="fill" /> : <ArrowDown size={12} weight="fill" />}
                    {Math.abs(trendWoW.change)} vs last week
                  </div>
                )}
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
                  {serviceLabel} Attendance
                </p>
                {noDataYet ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-7xl font-black tracking-tighter text-white/20">—</span>
                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                      Not marked yet
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-3">
                    <span className="text-7xl sm:text-8xl font-black tracking-tighter">
                      <CountUp value={data.summary.attendanceRate} />%
                    </span>
                    <span className="text-sm font-bold text-white/40">
                      {data.summary.totalAttendance} / {data.summary.totalRegistered}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 pr-8">
                {trend && trend.length > 1 && <TrendCurve data={trend.slice(-5)} compact />}
              </div>
            </div>

            {/* BUTTER — first timers with faces */}
            <div className="candy-card p-6 flex flex-col justify-between relative overflow-hidden bg-[var(--color-butter)] min-h-[190px]">
              <UserPlus
                size={140}
                weight="fill"
                className="absolute -right-5 -top-6 text-[#D3A53B] -rotate-12 pointer-events-none"
              />
              <div className="relative z-10 flex items-start justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#3D2E00]/60">
                  New Faces
                </p>
              </div>
              <div className="relative z-10">
                <p className="text-6xl font-black tracking-tighter text-[#2E2200]">
                  <CountUp value={data.summary.totalFirstTimers} />
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#3D2E00]/50 mt-1 mb-3">
                  First Timers
                </p>
                <AvatarStack
                  names={data.firstTimers.map((f) => f.name)}
                  ringColor="#EFC75E"
                  inkClass="text-amber-800"
                />
              </div>
            </div>

            {/* BUBBLEGUM — no-shows with faces */}
            <div className="candy-card p-6 flex flex-col justify-between relative overflow-hidden bg-[var(--color-bubblegum)]">
              <HeartBreak
                size={140}
                weight="fill"
                className="absolute -right-5 -top-6 text-[#E495BC] rotate-6 pointer-events-none"
              />
              <div className="relative z-10 flex items-start justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#4A0E22]/50">
                  Missed Us
                </p>
                {!noDataYet && chronicCount > 0 && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-rose-600 text-[9px] font-black uppercase tracking-wider shadow-sm">
                    <Fire size={11} weight="fill" className="text-rose-500" /> {chronicCount} at 3+ wks
                  </span>
                )}
              </div>
              <div className="relative z-10">
                <p className="text-6xl font-black tracking-tighter text-[#4A0E22]">
                  {noDataYet ? "—" : <CountUp value={data.noShows.length} />}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#4A0E22]/50 mt-1 mb-3">
                  No-Shows
                </p>
                {!noDataYet && (
                  <AvatarStack
                    names={data.noShows.map((n) => n.name)}
                    ringColor="#F5C4DA"
                    inkClass="text-rose-800"
                  />
                )}
              </div>
            </div>

            {/* MATCHA — total database (wide) */}
            <div className="candy-card lg:col-span-2 p-6 sm:p-7 relative overflow-hidden bg-[var(--color-matcha)] flex items-center gap-6">
              <UsersThree
                size={170}
                weight="fill"
                className="absolute -right-6 -bottom-9 text-[#A9B573] pointer-events-none"
              />
              <div className="relative z-10 shrink-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#26300F]/50 mb-3">
                  Congregation
                </p>
                <p className="text-6xl font-black tracking-tighter text-[#26300F]">
                  <CountUp value={data.summary.totalRegistered} />
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#26300F]/50 mt-1">
                  Total Database
                </p>
              </div>
              <div className="relative z-10 flex-1 min-w-0">
                <div className="flex justify-end mb-3">
                  <span className="px-3 py-1 bg-[#26300F] text-white rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
                    <Lightning weight="fill" size={12} /> Active
                  </span>
                </div>
                <div className="flex h-2.5 rounded-full overflow-hidden bg-white/70">
                  <div
                    className="bg-[#26300F] rounded-full"
                    style={{
                      width: `${
                        (data.summary.totalRegistered /
                          (data.summary.totalRegistered + Math.max(data.summary.totalFirstTimers, 1))) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#26300F]/60">
                    {data.summary.totalRegistered} members
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-700/70">
                    {data.summary.totalFirstTimers} first-timers this week
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* TREND BAND */}
          {trend && trend.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="glow-tile relative overflow-hidden p-6 sm:p-8"
            >
              <span className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 origin-center text-[9px] font-black uppercase tracking-[0.4em] text-white/25 whitespace-nowrap pointer-events-none">
                Last {trend.length} services
              </span>
              <div className="flex items-center gap-3 mb-4">
                <ChartLineUp size={26} weight="fill" className="text-emerald-300" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
                    Attendance Trend
                  </p>
                  <p className="text-[9px] font-bold text-white/25 uppercase tracking-wider">
                    Every service, head count
                  </p>
                </div>
              </div>
              <div className="pr-10">
                <TrendCurve data={trend} />
              </div>
            </motion.div>
          )}

          {noDataYet ? (
            <div className="candy-card bg-white p-12 text-center">
              <CalendarBlank size={32} weight="fill" className="text-zinc-300 mx-auto mb-4" />
              <p className="text-sm font-black text-gray-900 uppercase tracking-widest">
                No {serviceLabel} attendance this week yet
              </p>
              <p className="text-xs font-bold text-gray-400 mt-2 max-w-md mx-auto">
                Rankings and follow-ups appear here once marking starts. Use the week arrows above to
                review a previous week, or switch service below.
              </p>
              <div className="flex justify-center mt-6">{serviceToggle}</div>
            </div>
          ) : (
            /* LEADERBOARD + FOLLOW-UP RAIL */
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start"
            >
              {/* Leaderboard carousel */}
              <div className="lg:col-span-3 candy-card bg-white p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    {slide === 0 ? (
                      <Trophy size={26} weight="fill" className="text-gray-900" />
                    ) : (
                      <UsersThree size={26} weight="fill" className="text-gray-900" />
                    )}
                    <div>
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                        {SLIDES[slide].title}
                      </h3>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        {serviceLabel} service · {SLIDES[slide].hint}
                      </p>
                    </div>
                  </div>
                  {serviceToggle}
                </div>

                <div className="overflow-hidden">
                  <motion.div
                    className="flex cursor-grab active:cursor-grabbing"
                    animate={{ x: `-${slide * 100}%` }}
                    transition={{ type: "spring", stiffness: 320, damping: 34 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.12}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -60) setSlide(1);
                      else if (info.offset.x > 60) setSlide(0);
                    }}
                  >
                    <div className="w-full shrink-0 pr-1">{renderTeamList("strength")}</div>
                    <div className="w-full shrink-0 pl-1">{renderTeamList("attendance")}</div>
                  </motion.div>
                </div>

                {/* Slide indicators */}
                <div className="flex items-center justify-center gap-2 mt-6">
                  {SLIDES.map((s, i) => (
                    <button
                      key={s.mode}
                      onClick={() => setSlide(i)}
                      aria-label={s.title}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        slide === i ? "w-8 bg-gray-900" : "w-4 bg-zinc-200 hover:bg-zinc-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Rail: follow-up + data quality */}
              <div className="space-y-6">
                <div className="candy-card p-6 bg-[#F9DEEA]">
                  <h3 className="text-xs font-black text-[#4A0E22] uppercase tracking-widest mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Follow-Up Priority
                  </h3>
                  <p className="text-[9px] font-bold text-[#4A0E22]/40 uppercase tracking-wider mb-4">
                    Longest absence streaks first
                  </p>

                  {data.noShows.length === 0 ? (
                    <div className="text-center py-6 opacity-40">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#4A0E22]">
                        Full attendance — all clear
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.noShows.slice(0, 8).map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center justify-between gap-2 p-3 bg-white rounded-2xl"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${monogramHue(member.name)}`}
                            >
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-gray-900 truncate leading-none">
                                {member.name}
                              </p>
                              <p className="text-[8px] uppercase font-bold text-gray-400 tracking-wider mt-1 truncate">
                                {member.cell}
                              </p>
                            </div>
                          </div>
                          <StreakBadge weeks={member.weeksAbsent} />
                        </div>
                      ))}
                      {data.noShows.length > 8 && (
                        <p className="text-[9px] font-black text-rose-500/70 uppercase tracking-widest text-center pt-2">
                          +{data.noShows.length - 8} more to follow up
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {data.unassignedTeam && data.unassignedTeam.registered > 0 && (
                  <div className="candy-card p-6 bg-[var(--color-butter)]">
                    <div className="flex items-center gap-3 mb-3">
                      <Warning size={22} weight="fill" className="text-[#3D2E00]" />
                      <h3 className="text-xs font-black text-[#3D2E00] uppercase tracking-widest">
                        Data Quality
                      </h3>
                    </div>
                    <p className="text-xs font-medium text-[#3D2E00]/80 leading-relaxed">
                      {data._meta?.dataQualityIssues?.unassignedMessage}
                    </p>
                    <p className="text-[9px] font-bold text-[#3D2E00]/40 uppercase tracking-wider mt-3">
                      Assign them a team, senior cell & cell to include them in rankings
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
