"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { TrendUp, CalendarBlank, ChevronDown } from "@phosphor-icons/react";
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
    if (onTimePct >= 80) return "bg-emerald-50 border-emerald-200 text-emerald-700";
    if (onTimePct >= 60) return "bg-amber-50 border-amber-200 text-amber-700";
    return "bg-red-50 border-red-200 text-red-700";
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
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendUp size={20} className="text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">Attendance Promptness by Hierarchy</h3>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 block">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 block">
              Service
            </label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
            >
              <option>Sunday</option>
              <option>Mid-Week</option>
            </select>
          </div>
        </div>

        <div className="text-[9px] text-gray-500 mt-4 flex gap-4">
          <span>
            <span className="font-bold text-gray-700">Early</span> before {data.earlyThreshold}
          </span>
          <span>
            <span className="font-bold text-gray-700">On-time</span> {data.earlyThreshold}—
            {data.lateThreshold}
          </span>
          <span>
            <span className="font-bold text-gray-700">Late</span> after {data.lateThreshold}
          </span>
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-3">
        {data.teams.map((team) => (
          <div key={team.name} className="border border-zinc-200 rounded-xl overflow-hidden">
            {/* Team Header */}
            <button
              onClick={() => toggleTeam(team.name)}
              className={cn(
                "w-full px-6 py-4 flex items-center justify-between transition-colors border-b",
                getPerformanceColor(team.onTimePct)
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-left">
                  <h4 className="font-bold text-sm">{team.name}</h4>
                  <p className="text-[9px] opacity-60">Total: {team.total}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="flex h-6 rounded-lg overflow-hidden bg-white/50 w-32">
                  {team.early > 0 && (
                    <div
                      style={{ width: `${(team.early / team.total) * 100}%` }}
                      className="bg-blue-500"
                      title={`${team.early} early (${team.earlyPct}%)`}
                    />
                  )}
                  {team.onTime > 0 && (
                    <div
                      style={{ width: `${(team.onTime / team.total) * 100}%` }}
                      className="bg-emerald-500"
                      title={`${team.onTime} on-time (${team.onTimePct}%)`}
                    />
                  )}
                  {team.late > 0 && (
                    <div
                      style={{ width: `${(team.late / team.total) * 100}%` }}
                      className="bg-red-500"
                      title={`${team.late} late (${team.latePct}%)`}
                    />
                  )}
                  {team.absent > 0 && (
                    <div
                      style={{ width: `${(team.absent / team.total) * 100}%` }}
                      className="bg-gray-300"
                      title={`${team.absent} absent (${team.absentPct}%)`}
                    />
                  )}
                </div>

                <div className="text-2xl font-black text-gray-900 w-12 text-right">{team.onTimePct}%</div>
                <ChevronDown
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
                    <div key={seniorCell.name}>
                      <button
                        onClick={() => toggleSeniorCell(seniorCell.name)}
                        className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-xs text-gray-900">{seniorCell.name}</h5>
                          <p className="text-[9px] text-gray-600">
                            {seniorCell.onTime}/{seniorCell.total} on-time
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex h-5 rounded overflow-hidden bg-white/50 w-24">
                            {seniorCell.early > 0 && (
                              <div
                                style={{ width: `${(seniorCell.early / seniorCell.total) * 100}%` }}
                                className="bg-blue-500"
                              />
                            )}
                            {seniorCell.onTime > 0 && (
                              <div
                                style={{ width: `${(seniorCell.onTime / seniorCell.total) * 100}%` }}
                                className="bg-emerald-500"
                              />
                            )}
                            {seniorCell.late > 0 && (
                              <div
                                style={{ width: `${(seniorCell.late / seniorCell.total) * 100}%` }}
                                className="bg-red-500"
                              />
                            )}
                            {seniorCell.absent > 0 && (
                              <div
                                style={{ width: `${(seniorCell.absent / seniorCell.total) * 100}%` }}
                                className="bg-gray-300"
                              />
                            )}
                          </div>

                          <div className="text-lg font-black text-gray-900 w-10 text-right">{seniorCell.onTimePct}%</div>
                          <ChevronDown
                            size={16}
                            className={`text-gray-400 transition-transform ${
                              expandedSeniorCell === seniorCell.name ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {/* Cells (Collapsed) */}
                      <AnimatePresence>
                        {expandedSeniorCell === seniorCell.name && (
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
                                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                                      {cell.early}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                      {cell.onTime}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full bg-red-500" />
                                      {cell.late}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full bg-gray-300" />
                                      {cell.absent}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="flex h-4 rounded overflow-hidden bg-gray-100 w-20">
                                    {cell.early > 0 && (
                                      <div
                                        style={{ width: `${(cell.early / cell.total) * 100}%` }}
                                        className="bg-blue-500"
                                      />
                                    )}
                                    {cell.onTime > 0 && (
                                      <div
                                        style={{ width: `${(cell.onTime / cell.total) * 100}%` }}
                                        className="bg-emerald-500"
                                      />
                                    )}
                                    {cell.late > 0 && (
                                      <div
                                        style={{ width: `${(cell.late / cell.total) * 100}%` }}
                                        className="bg-red-500"
                                      />
                                    )}
                                    {cell.absent > 0 && (
                                      <div
                                        style={{ width: `${(cell.absent / cell.total) * 100}%` }}
                                        className="bg-gray-300"
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
