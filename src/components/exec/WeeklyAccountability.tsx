"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CaretDown, Users, UserPlus, Warning } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface NoShow {
  _id: string;
  name: string;
  role: string;
  cell: string;
  seniorCell: string;
  team: string;
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
  seniorCells: SeniorCellData[];
}

interface WeeklyData {
  weekRange: { start: string; end: string };
  summary: {
    totalAttendance: number;
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
  firstTimers: any[];
  _meta?: {
    dataQualityIssues?: {
      unassignedCount: number;
      unassignedMessage?: string;
    };
  };
}

export function WeeklyAccountability() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [expandedSeniorCell, setExpandedSeniorCell] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "team" | "seniorCell" | "cell">("all");
  const [filterValue, setFilterValue] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/weekly-accountability");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12 opacity-30">
        <p className="text-sm font-bold text-gray-600">Loading accountability data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 opacity-30">
        <p className="text-sm font-bold text-gray-600">No data available</p>
      </div>
    );
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return "text-emerald-700 bg-emerald-50";
    if (percentage >= 60) return "text-amber-700 bg-amber-50";
    return "text-red-700 bg-red-50";
  };

  const getPerformanceBadgeColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const toggleTeam = (teamName: string) => {
    setExpandedTeam(expandedTeam === teamName ? null : teamName);
  };

  const toggleSeniorCell = (seniorCellName: string) => {
    setExpandedSeniorCell(expandedSeniorCell === seniorCellName ? null : seniorCellName);
  };

  const filteredTeams = data.teams.filter((team) => {
    if (filter === "all") return true;
    if (filter === "team") return team.name.toLowerCase().includes(filterValue.toLowerCase());
    return false;
  });

  const { change, percentageChange } = data.summary.weekVsLastWeek;
  const trendUp = change >= 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">Weekly Accountability</h2>
        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
          {data.weekRange.start} to {data.weekRange.end}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Attendance</span>
            <Users size={18} className="text-gray-400" />
          </div>
          <div className="text-4xl font-black text-gray-900">{data.summary.totalAttendance}</div>
          <div className={`text-xs font-bold mt-2 ${trendUp ? "text-emerald-700" : "text-red-700"}`}>
            {trendUp ? "↑" : "↓"} {Math.abs(change)} vs last week ({percentageChange > 0 ? "+" : ""}{percentageChange}%)
          </div>
        </div>

        <div className="bg-white border border-zinc-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">First Timers</span>
            <UserPlus size={18} className="text-emerald-500" />
          </div>
          <div className="text-4xl font-black text-gray-900">{data.summary.totalFirstTimers}</div>
          <div className="text-xs font-bold text-gray-400 mt-2">New visitors this week</div>
        </div>

        <div className="bg-white border border-zinc-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No-Shows</span>
            <AlertCircle size={18} className="text-red-500" />
          </div>
          <div className="text-4xl font-black text-gray-900">{data.noShows.length}</div>
          <div className="text-xs font-bold text-gray-400 mt-2">Follow-up needed</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as any);
            setFilterValue("");
          }}
          className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-bold"
        >
          <option value="all">All Teams</option>
          <option value="team">Filter by Team</option>
        </select>
        {filter !== "all" && (
          <input
            type="text"
            placeholder="Search..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="flex-1 px-4 py-2 border border-zinc-200 rounded-lg text-sm font-bold"
          />
        )}
      </div>

      {/* Hierarchical Leaderboard */}
      <div className="space-y-3">
        {filteredTeams.map((team) => (
          <div key={team.name} className="border border-zinc-100 rounded-2xl overflow-hidden">
            {/* Team Header */}
            <button
              onClick={() => toggleTeam(team.name)}
              className="w-full px-6 py-4 bg-white hover:bg-gray-50 flex items-center justify-between transition-colors border-b border-zinc-50"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex-1">
                  <h3 className="text-sm font-black text-gray-900 text-left">{team.name}</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                    {team.attended} / {team.registered} attended
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className={`px-3 py-1 rounded-full text-sm font-black ${getPerformanceColor(team.percentage)}`}>
                  {team.percentage}%
                </div>
                <CaretDown
                  size={20}
                  className={`text-gray-400 transition-transform ${expandedTeam === team.name ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {/* Senior Cells (Expanded) */}
            <AnimatePresence>
              {expandedTeam === team.name && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50 border-t border-zinc-100 divide-y divide-zinc-100"
                >
                  {team.seniorCells.map((seniorCell) => (
                    <div key={seniorCell.name}>
                      <button
                        onClick={() => toggleSeniorCell(seniorCell.name)}
                        className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-gray-700 ml-4">{seniorCell.name}</h4>
                          <p className="text-[9px] text-gray-500 uppercase ml-4">
                            {seniorCell.attended} / {seniorCell.registered}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className={`px-2 py-0.5 rounded text-xs font-bold ${getPerformanceColor(seniorCell.percentage)}`}>
                            {seniorCell.percentage}%
                          </div>
                          <CaretDown
                            size={16}
                            className={`text-gray-400 transition-transform ${expandedSeniorCell === seniorCell.name ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>

                      {/* Cells (Expanded) */}
                      <AnimatePresence>
                        {expandedSeniorCell === seniorCell.name && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white divide-y divide-zinc-50"
                          >
                            {seniorCell.cells.map((cell) => (
                              <div key={cell.name} className="px-6 py-3 ml-8 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="text-xs font-bold text-gray-900">{cell.name}</h5>
                                    <p className="text-[9px] text-gray-500">
                                      {cell.attended}/{cell.registered} attended {cell.firstTimers > 0 && `• ${cell.firstTimers} first-timer(s)`}
                                    </p>
                                  </div>
                                  <div className={`px-2 py-0.5 rounded text-xs font-bold ${getPerformanceColor(cell.percentage)}`}>
                                    {cell.percentage}%
                                  </div>
                                </div>

                                {cell.noShows.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-zinc-100 space-y-1">
                                    <p className="text-[9px] font-bold text-red-600 uppercase">No-shows:</p>
                                    {cell.noShows.map((member) => (
                                      <div key={member._id} className="text-[9px] text-gray-600">
                                        • {member.name} ({member.role})
                                      </div>
                                    ))}
                                  </div>
                                )}
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

      {/* Data Quality Issues: Unassigned Members */}
      {data.unassignedTeam && data.unassignedTeam.registered > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold">!</div>
            <div>
              <h3 className="font-bold text-amber-900">Data Quality Issue</h3>
              <p className="text-sm text-amber-800 mt-1">{data._meta?.dataQualityIssues?.unassignedMessage}</p>
            </div>
          </div>
          <div className="text-sm text-amber-700">
            <p className="mb-3">These members lack proper organization hierarchy assignment:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.unassignedTeam.seniorCells?.map((sc) =>
                sc.cells?.map((cell) => (
                  <div key={cell.name} className="bg-white rounded p-3 text-xs">
                    <p className="font-bold text-gray-900">{cell.name || "Unassigned Cell"}</p>
                    <p className="text-gray-600">{cell.attended} / {cell.registered} attended</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* No-Shows Summary */}
      {data.noShows.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-red-900 mb-4">Follow-up Needed ({data.noShows.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.noShows.slice(0, 10).map((member) => (
              <div key={member._id} className="bg-white rounded-lg p-3 text-xs">
                <p className="font-bold text-gray-900">{member.name}</p>
                <p className="text-gray-600">{member.cell} • {member.role}</p>
              </div>
            ))}
          </div>
          {data.noShows.length > 10 && (
            <p className="text-[9px] text-red-600 mt-3 text-center">
              ...and {data.noShows.length - 10} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}
