"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { TrendingUp, CalendarBlank } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface Stat {
  groupName: string;
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

interface AnalyticsData {
  service: string;
  date: string;
  earlyThreshold: string;
  lateThreshold: string;
  stats: Stat[];
}

export function PromptnessAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState("Sunday");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await fetch(
          `/api/attendance-analytics?service=${service}&date=${date}&groupBy=cell`
        );
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
    fetch();
  }, [service, date]);

  if (loading) {
    return <div className="text-sm text-gray-400">Loading analytics...</div>;
  }

  if (!data || data.stats.length === 0) {
    return (
      <div className="text-center py-12 opacity-30">
        <p className="text-sm font-bold text-gray-600">No attendance data yet</p>
      </div>
    );
  }

  const getPerformanceColor = (onTimePct: number) => {
    if (onTimePct >= 80) return "bg-emerald-50 border-emerald-200";
    if (onTimePct >= 60) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  const getPercentageColor = (onTimePct: number) => {
    if (onTimePct >= 80) return "text-emerald-700";
    if (onTimePct >= 60) return "text-amber-700";
    return "text-red-700";
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">Cell Promptness Scores</h3>
        </div>

        <div className="flex gap-3 mb-6">
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

        <div className="text-[9px] text-gray-500 mb-4 flex gap-4">
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

      <div className="space-y-3">
        {data.stats.map((stat) => (
          <div
            key={stat.groupName}
            className={cn(
              "p-4 rounded-xl border transition-all",
              getPerformanceColor(stat.onTimePct)
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-bold text-gray-900">{stat.groupName}</h4>
                <p className="text-[10px] text-gray-500">
                  Total: {stat.total} | Present: {stat.total - stat.absent}
                </p>
              </div>
              <div className={cn("text-2xl font-black", getPercentageColor(stat.onTimePct))}>
                {stat.onTimePct}%
              </div>
            </div>

            {/* Stacked bar */}
            <div className="flex h-6 rounded-lg overflow-hidden bg-white/50 mb-3">
              {stat.early > 0 && (
                <div
                  style={{ width: `${(stat.early / (stat.total - stat.absent)) * 100}%` }}
                  className="bg-blue-500"
                  title={`${stat.early} early (${stat.earlyPct}%)`}
                />
              )}
              {stat.onTime > 0 && (
                <div
                  style={{ width: `${(stat.onTime / (stat.total - stat.absent)) * 100}%` }}
                  className="bg-emerald-500"
                  title={`${stat.onTime} on-time (${stat.onTimePct}%)`}
                />
              )}
              {stat.late > 0 && (
                <div
                  style={{ width: `${(stat.late / (stat.total - stat.absent)) * 100}%` }}
                  className="bg-red-500"
                  title={`${stat.late} late (${stat.latePct}%)`}
                />
              )}
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                {stat.early} early
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                {stat.onTime} on-time
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                {stat.late} late
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                {stat.absent} absent
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
