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
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

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
  if (percentage >= 80) return "bg-emerald-500";
  if (percentage >= 60) return "bg-amber-400";
  return "bg-rose-500";
}

function MovementChip({ movement }: { movement: number | null }) {
  if (movement === null) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-400 text-[9px] font-black uppercase tracking-wider">
        New
      </span>
    );
  }
  if (movement === 0) {
    return (
      <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-zinc-50 text-zinc-400 text-[10px] font-black">
        <Minus size={10} weight="bold" />
      </span>
    );
  }
  const up = movement > 0;
  return (
    <span
      className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
        up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
      }`}
    >
      {up ? <ArrowUp size={10} weight="bold" /> : <ArrowDown size={10} weight="bold" />}
      {Math.abs(movement)}
    </span>
  );
}

function StreakBadge({ weeks }: { weeks: number }) {
  const chronic = weeks >= 3;
  return (
    <span
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
        chronic ? "bg-rose-100 text-rose-700" : "bg-zinc-100 text-zinc-500"
      }`}
    >
      {chronic && <Fire size={10} weight="fill" />}
      {weeks >= 8 ? "8+ wks" : `${weeks} wk${weeks > 1 ? "s" : ""}`}
    </span>
  );
}

export function WeeklyAccountability() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [service, setService] = useState<ServiceValue>("Sunday");
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [expandedSeniorCell, setExpandedSeniorCell] = useState<string | null>(null);

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
  const trend = data?.summary.weekVsLastWeek;
  const trendUp = (trend?.change ?? 0) >= 0;

  const serviceToggle = (
    <div className="bg-zinc-100 p-1.5 rounded-full flex gap-1">
      {SERVICES.map((s) => (
        <button
          key={s.value}
          onClick={() => setService(s.value)}
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
            service === s.value ? "bg-white text-black shadow-sm" : "text-stone-400 hover:text-stone-600"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );

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

        <div className="glass-frosted rounded-full flex items-center p-1.5">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white transition-all"
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
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white transition-all disabled:opacity-20 disabled:hover:bg-transparent"
            aria-label="Next week"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`bento-card h-48 animate-pulse bg-zinc-50 ${i === 0 ? "lg:col-span-2" : ""}`}
            />
          ))}
          <div className="bento-card h-96 animate-pulse bg-zinc-50 lg:col-span-3" />
          <div className="bento-card h-96 animate-pulse bg-zinc-50" />
        </div>
      ) : (
        <>
          {/* HERO STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Attendance hero */}
            <div className="lg:col-span-2 bento-card bg-[#111] border-none text-white p-8 relative overflow-hidden flex flex-col justify-between min-h-[200px]">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative z-10 flex items-start justify-between">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/5">
                  <Pulse size={20} className="text-emerald-400" />
                </div>
                {!noDataYet && trend && trend.lastWeek > 0 && (
                  <div
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1 ${
                      trendUp ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"
                    }`}
                  >
                    {trendUp ? <ArrowUp size={12} weight="bold" /> : <ArrowDown size={12} weight="bold" />}
                    {Math.abs(trend.change)} vs last week
                  </div>
                )}
              </div>
              <div className="relative z-10 mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
                  {serviceLabel} Attendance
                </p>
                {noDataYet ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl sm:text-7xl font-black tracking-tighter text-white/20">—</span>
                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                      Not marked yet
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl sm:text-7xl font-black tracking-tighter">
                      {data.summary.attendanceRate}%
                    </span>
                    <span className="text-sm font-bold text-white/40">
                      {data.summary.totalAttendance} / {data.summary.totalRegistered} members
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* First timers */}
            <div className="bento-card p-6 flex flex-col justify-between relative overflow-hidden group">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <UserPlus size={20} weight="bold" />
                </div>
                <span className="relative flex h-3 w-3 mt-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-5xl font-black tracking-tighter text-gray-900">
                  {data.summary.totalFirstTimers}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">
                  First Timers
                </p>
              </div>
            </div>

            {/* No-shows */}
            <div className="bento-card p-6 flex flex-col justify-between relative overflow-hidden border-rose-100 bg-rose-50/20">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                  <Warning size={20} weight="bold" />
                </div>
                {!noDataYet && chronicCount > 0 && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-wider">
                    <Fire size={10} weight="fill" /> {chronicCount} at 3+ wks
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-5xl font-black tracking-tighter text-gray-900">
                  {noDataYet ? "—" : data.noShows.length}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">
                  No-Shows
                </p>
              </div>
            </div>
          </div>

          {noDataYet ? (
            <div className="bento-card p-12 text-center hover:transform-none">
              <div className="w-14 h-14 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-4 text-zinc-300">
                <CalendarBlank size={26} weight="duotone" />
              </div>
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Leaderboard */}
              <div className="lg:col-span-3 bento-card p-6 sm:p-8 hover:transform-none">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                      <Trophy size={18} weight="duotone" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                        Team Leaderboard
                      </h3>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        {serviceLabel} service · tap a team to drill down
                      </p>
                    </div>
                  </div>
                  {serviceToggle}
                </div>

                <div className="space-y-3">
                  {data.teams.map((team, rank) => (
                    <div
                      key={team.name}
                      className="border border-zinc-100 rounded-3xl overflow-hidden bg-white"
                    >
                      <button
                        onClick={() =>
                          setExpandedTeam(expandedTeam === team.name ? null : team.name)
                        }
                        className="w-full px-5 sm:px-6 py-4 hover:bg-zinc-50/80 transition-colors text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                              rank === 0
                                ? "bg-gray-900 text-white"
                                : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {rank + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-gray-900 truncate">
                                {team.name}
                              </h4>
                              <MovementChip movement={team.movement} />
                            </div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                              {team.attended} of {team.registered} attended
                            </p>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-sm font-black shrink-0 ${performanceText(team.percentage)}`}
                          >
                            {team.percentage}%
                          </div>
                          <CaretDown
                            size={18}
                            className={`text-gray-300 transition-transform shrink-0 ${
                              expandedTeam === team.name ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                        <div className="mt-3 ml-[52px] h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${team.percentage}%` }}
                            transition={{ duration: 0.8, delay: rank * 0.05 }}
                            className={`h-full rounded-full ${performanceBar(team.percentage)}`}
                          />
                        </div>
                      </button>

                      <AnimatePresence>
                        {expandedTeam === team.name && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-zinc-50/60 border-t border-zinc-100 divide-y divide-zinc-100"
                          >
                            {team.seniorCells.map((seniorCell) => {
                              const scKey = `${team.name}::${seniorCell.name}`;
                              return (
                                <div key={scKey}>
                                  <button
                                    onClick={() =>
                                      setExpandedSeniorCell(
                                        expandedSeniorCell === scKey ? null : scKey
                                      )
                                    }
                                    className="w-full pl-10 pr-6 py-3 flex items-center justify-between hover:bg-zinc-100/60 transition-colors text-left"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-xs font-black text-gray-700 truncate">
                                        {seniorCell.name}
                                      </h5>
                                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                        {seniorCell.attended} of {seniorCell.registered}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <div
                                        className={`px-2.5 py-0.5 rounded-full text-xs font-black ${performanceText(seniorCell.percentage)}`}
                                      >
                                        {seniorCell.percentage}%
                                      </div>
                                      <CaretDown
                                        size={14}
                                        className={`text-gray-300 transition-transform ${
                                          expandedSeniorCell === scKey ? "rotate-180" : ""
                                        }`}
                                      />
                                    </div>
                                  </button>

                                  <AnimatePresence>
                                    {expandedSeniorCell === scKey && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-white divide-y divide-zinc-50"
                                      >
                                        {seniorCell.cells.map((cell) => (
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
                                              <div
                                                className={`px-2.5 py-0.5 rounded-full text-xs font-black shrink-0 ${performanceText(cell.percentage)}`}
                                              >
                                                {cell.percentage}%
                                              </div>
                                            </div>
                                            {cell.noShows.length > 0 && (
                                              <div className="mt-2 flex flex-wrap gap-1.5">
                                                {cell.noShows.map((member) => (
                                                  <span
                                                    key={member._id}
                                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-[9px] font-bold"
                                                  >
                                                    {member.name}
                                                    <span className="opacity-50 font-black">
                                                      {member.weeksAbsent >= 8
                                                        ? "8+w"
                                                        : `${member.weeksAbsent}w`}
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
                  ))}
                </div>
              </div>

              {/* Rail: follow-up + data quality */}
              <div className="space-y-6">
                <div className="bento-card p-6 border-rose-100 bg-rose-50/10 hover:transform-none">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Follow-Up Priority
                  </h3>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-4">
                    Longest absence streaks first
                  </p>

                  {data.noShows.length === 0 ? (
                    <div className="text-center py-6 opacity-40">
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        Full attendance — all clear
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.noShows.slice(0, 8).map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-rose-100/60 shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-[10px] font-black text-rose-600 shrink-0">
                              {member.name.charAt(0)}
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
                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest text-center pt-2">
                          +{data.noShows.length - 8} more to follow up
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {data.unassignedTeam && data.unassignedTeam.registered > 0 && (
                  <div className="bento-card p-6 border-amber-100 bg-amber-50/20 hover:transform-none">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <Warning size={16} weight="bold" />
                      </div>
                      <h3 className="text-xs font-black text-amber-900 uppercase tracking-widest">
                        Data Quality
                      </h3>
                    </div>
                    <p className="text-xs font-medium text-amber-800 leading-relaxed">
                      {data._meta?.dataQualityIssues?.unassignedMessage}
                    </p>
                    <p className="text-[9px] font-bold text-amber-600/70 uppercase tracking-wider mt-3">
                      Assign them a team, senior cell & cell to include them in rankings
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
