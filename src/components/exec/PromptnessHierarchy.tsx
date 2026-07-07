"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { TrendUp, CalendarBlank, CaretDown } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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

export function PromptnessHierarchy() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState("Sunday");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
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

  if (loading) {
    return <div className="text-sm text-gray-400">Loading analytics...</div>;
  }

  if (!data || data.teams.length === 0) {
    return (
      <div className="text-center py-12 opacity-30">
        <p className="text-sm font-bold text-gray-600">No attendance data yet</p>
      </div>
    );
  }

  const getPerformanceColor = (onTimePct: number) => {
    if (onTimePct >= 80) return "bg-emerald-50 text-emerald-700";
    if (onTimePct >= 60) return "bg-amber-50 text-amber-700";
    return "bg-rose-50 text-rose-700";
  };

  const getBarColor = (value: number, total: number) => {
    const pct = (value / total) * 100;
    if (value === 0) return "bg-gray-200";
    if (pct < 50) return "bg-red-500";
    if (pct < 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const toggleTeam = (teamName: string) => {
    setExpandedTeam(expandedTeam === teamName ? null : teamName);
  };

  const toggleSeniorCell = (seniorCellName: string) => {
    setExpandedSeniorCell(expandedSeniorCell === seniorCellName ? null : seniorCellName);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <TrendUp size={18} weight="duotone" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Promptness</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                Who arrives early, on time, late
              </p>
            </div>
          </div>
          <div className="text-[9px] text-gray-400 mt-3 flex flex-wrap gap-x-4 gap-y-1 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" /> Early · before {data.earlyThreshold}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> On-time · {data.earlyThreshold}—{data.lateThreshold}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> Late · after {data.lateThreshold}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-200" /> Absent
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <CalendarBlank size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-11 pr-4 py-2.5 bg-white border border-zinc-200 rounded-full text-xs font-bold text-stone-700 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none hover:border-stone-300 transition-all uppercase tracking-wider cursor-pointer"
            />
          </div>
          <div className="bg-zinc-100 p-1.5 rounded-full flex gap-1">
            {["Sunday", "Mid-Week"].map((s) => (
              <button
                key={s}
                onClick={() => setService(s)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                  service === s ? "bg-white text-black shadow-sm" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-3">
        {data.teams.map((team) => (
          <div key={team.name} className="border border-zinc-100 rounded-3xl overflow-hidden bg-white">
            {/* Team Header */}
            <button
              onClick={() => toggleTeam(team.name)}
              className="w-full px-6 py-4 flex items-center justify-between transition-colors hover:bg-zinc-50/80"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-left">
                  <h4 className="font-bold text-sm">{team.name}</h4>
                  <p className="text-[9px] opacity-60">Total: {team.total}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="flex h-6 rounded-full overflow-hidden bg-zinc-100 w-32">
                  {team.early > 0 && (
                    <div
                      style={{ width: `${(team.early / team.total) * 100}%` }}
                      className="bg-sky-400"
                      title={`${team.early} early (${team.earlyPct}%)`}
                    />
                  )}
                  {team.onTime > 0 && (
                    <div
                      style={{ width: `${(team.onTime / team.total) * 100}%` }}
                      className="bg-emerald-400"
                      title={`${team.onTime} on-time (${team.onTimePct}%)`}
                    />
                  )}
                  {team.late > 0 && (
                    <div
                      style={{ width: `${(team.late / team.total) * 100}%` }}
                      className="bg-rose-400"
                      title={`${team.late} late (${team.latePct}%)`}
                    />
                  )}
                  {team.absent > 0 && (
                    <div
                      style={{ width: `${(team.absent / team.total) * 100}%` }}
                      className="bg-zinc-200"
                      title={`${team.absent} absent (${team.absentPct}%)`}
                    />
                  )}
                </div>

                <div className={cn("px-3 py-1 rounded-full text-sm font-black", getPerformanceColor(team.onTimePct))}>{team.onTimePct}%</div>
                <CaretDown
                  size={20}
                  className={`text-gray-400 transition-transform ${expandedTeam === team.name ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {/* Senior Cells (Collapsed) */}
            <AnimatePresence>
              {expandedTeam === team.name && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50 divide-y"
                >
                  {team.seniorCells.map((seniorCell) => (
                    <div key={`${team.name}::${seniorCell.name}`}>
                      <button
                        onClick={() => toggleSeniorCell(`${team.name}::${seniorCell.name}`)}
                        className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-xs text-gray-900">{seniorCell.name}</h5>
                          <p className="text-[9px] text-gray-600">
                            {seniorCell.onTime}/{seniorCell.total} on-time
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex h-5 rounded-full overflow-hidden bg-zinc-100 w-24">
                            {seniorCell.early > 0 && (
                              <div
                                style={{ width: `${(seniorCell.early / seniorCell.total) * 100}%` }}
                                className="bg-sky-400"
                              />
                            )}
                            {seniorCell.onTime > 0 && (
                              <div
                                style={{ width: `${(seniorCell.onTime / seniorCell.total) * 100}%` }}
                                className="bg-emerald-400"
                              />
                            )}
                            {seniorCell.late > 0 && (
                              <div
                                style={{ width: `${(seniorCell.late / seniorCell.total) * 100}%` }}
                                className="bg-rose-400"
                              />
                            )}
                            {seniorCell.absent > 0 && (
                              <div
                                style={{ width: `${(seniorCell.absent / seniorCell.total) * 100}%` }}
                                className="bg-zinc-200"
                              />
                            )}
                          </div>

                          <div className="text-lg font-black text-gray-900 w-10 text-right">{seniorCell.onTimePct}%</div>
                          <CaretDown
                            size={16}
                            className={`text-gray-400 transition-transform ${
                              expandedSeniorCell === `${team.name}::${seniorCell.name}` ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {/* Cells (Collapsed) */}
                      <AnimatePresence>
                        {expandedSeniorCell === `${team.name}::${seniorCell.name}` && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white divide-y"
                          >
                            {seniorCell.cells.map((cell) => (
                              <div key={cell.name} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex-1 min-w-0">
                                  <h6 className="font-bold text-xs text-gray-900">{cell.name}</h6>
                                  <div className="text-[9px] text-gray-600 flex gap-2 mt-1">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                                      {cell.early}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                      {cell.onTime}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                                      {cell.late}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full bg-zinc-200" />
                                      {cell.absent}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="flex h-4 rounded-full overflow-hidden bg-zinc-100 w-20">
                                    {cell.early > 0 && (
                                      <div
                                        style={{ width: `${(cell.early / cell.total) * 100}%` }}
                                        className="bg-sky-400"
                                      />
                                    )}
                                    {cell.onTime > 0 && (
                                      <div
                                        style={{ width: `${(cell.onTime / cell.total) * 100}%` }}
                                        className="bg-emerald-400"
                                      />
                                    )}
                                    {cell.late > 0 && (
                                      <div
                                        style={{ width: `${(cell.late / cell.total) * 100}%` }}
                                        className="bg-rose-400"
                                      />
                                    )}
                                    {cell.absent > 0 && (
                                      <div
                                        style={{ width: `${(cell.absent / cell.total) * 100}%` }}
                                        className="bg-zinc-200"
                                      />
                                    )}
                                  </div>
                                  <div className="text-sm font-black text-gray-900 w-8 text-right">{cell.onTimePct}%</div>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
