"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Alarm, CalendarBlank, CaretDown } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { monogramHue } from "./WeeklyAccountability";

interface CellStats {
  name: string;
  total: number;
  early: number;
  onTime: number;
  late: number;
  absent: number;
  earlyPct: number;
  onTimePct: number;
  latePct: number;
  absentPct: number;
}

interface SeniorCellStats extends CellStats {
  cells: CellStats[];
}

interface TeamStats extends CellStats {
  seniorCells: SeniorCellStats[];
}

interface AnalyticsData {
  service: string;
  date: string;
  earlyThreshold: string;
  lateThreshold: string;
  teams: TeamStats[];
}

function onTimeChip(pct: number) {
  if (pct >= 80) return "bg-emerald-50 text-emerald-700";
  if (pct >= 60) return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}

/** Quiet count chip: one colored dot + a number — never a rainbow bar. */
function DotChip({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-[9px] font-black uppercase tracking-wider text-gray-500 shadow-sm"
      title={`${value} ${label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      {value}
    </span>
  );
}

/** Single-hue punctuality bar: on-time share only, everything else stays quiet. */
function OnTimeBar({ pct, className = "" }: { pct: number; className?: string }) {
  return (
    <div className={`h-3 bg-white rounded-full overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(pct, 3)}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
      >
        <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/90" />
      </motion.div>
    </div>
  );
}

export function PromptnessHierarchy() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState("Sunday");
  // Default to the most recent Sunday — "today" is usually a weekday with no service.
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return format(d, "yyyy-MM-dd");
  });
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [expandedSeniorCell, setExpandedSeniorCell] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/promptness-hierarchy?service=${service}&date=${date}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchAnalytics();
  }, [service, date]);

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <Alarm size={24} weight="duotone" className="text-emerald-500" />
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Promptness</h3>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
            On-time arrivals per team
            {data ? ` · early < ${data.earlyThreshold} · late > ${data.lateThreshold}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <CalendarBlank
            size={18}
            weight="duotone"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="pl-11 pr-4 py-2.5 bg-zinc-50 rounded-full text-xs font-bold text-stone-700 focus:ring-2 focus:ring-stone-900 outline-none transition-all uppercase tracking-wider cursor-pointer"
          />
        </div>
        <div className="bg-zinc-100 p-1.5 rounded-full flex gap-1">
          {["Sunday", "Mid-Week"].map((s) => (
            <button
              key={s}
              onClick={() => setService(s)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                service === s ? "bg-gray-900 text-white shadow-md" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              {s === "Mid-Week" ? "Wednesday" : s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-3xl bg-zinc-50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.teams.length === 0) {
    return (
      <div className="space-y-6">
        {header}
        <div className="text-center py-12 opacity-30">
          <p className="text-sm font-bold text-gray-600">No attendance data for this date</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <div className="space-y-3">
        {data.teams.map((team) => (
          <div key={team.name} className="bg-[#F7F6F3] rounded-3xl overflow-hidden">
            <motion.button
              whileTap={{ scale: 0.985 }}
              onClick={() => setExpandedTeam(expandedTeam === team.name ? null : team.name)}
              className="w-full px-5 sm:px-6 py-4 text-left"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${monogramHue(team.name)}`}
                >
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-gray-900 truncate">{team.name}</h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                    {team.onTime + team.early} punctual of {team.total}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  <DotChip color="bg-sky-400" label="early" value={team.early} />
                  <DotChip color="bg-rose-400" label="late" value={team.late} />
                  <DotChip color="bg-zinc-300" label="absent" value={team.absent} />
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-black shrink-0 ${onTimeChip(team.onTimePct)}`}
                >
                  {team.onTimePct}%
                </div>
                <CaretDown
                  size={18}
                  weight="bold"
                  className={`text-gray-300 transition-transform shrink-0 ${
                    expandedTeam === team.name ? "rotate-180" : ""
                  }`}
                />
              </div>
              <OnTimeBar pct={team.onTimePct} className="mt-3 ml-[56px]" />
            </motion.button>

            <AnimatePresence>
              {expandedTeam === team.name && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white"
                >
                  {team.seniorCells.map((seniorCell) => {
                    const scKey = `${team.name}::${seniorCell.name}`;
                    return (
                      <div key={scKey}>
                        <motion.button
                          whileTap={{ scale: 0.99 }}
                          onClick={() =>
                            setExpandedSeniorCell(expandedSeniorCell === scKey ? null : scKey)
                          }
                          className="w-full pl-8 pr-6 py-3 flex items-center justify-between hover:bg-[#FCFBF9] transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${monogramHue(seniorCell.name)}`}
                            >
                              {seniorCell.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-black text-gray-800 truncate">{seniorCell.name}</h5>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                {seniorCell.onTime} on time of {seniorCell.total}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-24 hidden sm:block">
                              <OnTimeBar pct={seniorCell.onTimePct} className="!h-2 !bg-zinc-100" />
                            </div>
                            <div
                              className={`px-2.5 py-0.5 rounded-full text-xs font-black ${onTimeChip(seniorCell.onTimePct)}`}
                            >
                              {seniorCell.onTimePct}%
                            </div>
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
                              className="bg-[#FCFBF9]"
                            >
                              {seniorCell.cells.map((cell) => (
                                <div key={cell.name} className="pl-14 pr-6 py-3 flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <h6 className="text-xs font-black text-gray-900 truncate">{cell.name}</h6>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <DotChip color="bg-sky-400" label="early" value={cell.early} />
                                      <DotChip color="bg-emerald-400" label="on time" value={cell.onTime} />
                                      <DotChip color="bg-rose-400" label="late" value={cell.late} />
                                      <DotChip color="bg-zinc-300" label="absent" value={cell.absent} />
                                    </div>
                                  </div>
                                  <div
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-black shrink-0 ${onTimeChip(cell.onTimePct)}`}
                                  >
                                    {cell.onTimePct}%
                                  </div>
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
  );
}
