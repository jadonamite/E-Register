"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { GrowthChart } from "@/components/exec/GrowthChart";
import { ConnectivityEffect } from "@/components/exec/ConnectivityEffect";
import { WeeklyAccountability } from "@/components/exec/WeeklyAccountability";
import { PromptnessHierarchy } from "@/components/exec/PromptnessHierarchy";
import { Users, Lightning, GearSix, TrendUp } from "@phosphor-icons/react";
import Link from "next/link";
import { format } from "date-fns";
import { LogoutButton } from "@/components/LogoutButton";
import { CountUp } from "@/components/exec/CountUp";

export default function ExecutiveDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) setData(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchStats();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Logo />
        <p className="text-[10px] font-black tracking-widest opacity-30 uppercase font-unio">Loading Command Center...</p>
      </div>
    </div>
  );

  const avgAtt = data?.trend?.length
    ? Math.round(data.trend.reduce((a: any, b: any) => a + b.count, 0) / data.trend.length)
    : 0;

  return (
    <div className="min-h-screen p-4 md:p-8 font-unio max-w-[1360px] mx-auto relative overflow-hidden">

      <div className="atmosphere">
        <div className="blob w-[480px] h-[480px] bg-pink-200 -top-40 -left-40" />
        <div className="blob w-[420px] h-[420px] bg-amber-100 top-1/3 -right-32" style={{ animationDelay: "-7s" }} />
        <div className="blob w-[440px] h-[440px] bg-emerald-100 bottom-0 left-1/4" style={{ animationDelay: "-13s" }} />
      </div>

      <ConnectivityEffect />

      <div className="relative z-10">
        <header className="flex justify-between items-center mb-10 pl-2">
          <Logo />
          <div className="flex items-center gap-3">
            <div className="glass-frosted px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 hidden sm:block">
              {format(new Date(), "MMM yyyy")}
            </div>
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
            >
              <GearSix size={16} weight="bold" /> Admin
            </Link>
            <LogoutButton />
          </div>
        </header>

        {/* PRIMARY: WEEKLY ACCOUNTABILITY */}
        <WeeklyAccountability />

        {/* SECONDARY: GROWTH + DATABASE */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">

          <div className="lg:col-span-3 glow-tile overflow-hidden relative p-6 sm:p-8 flex flex-col gap-6">
            <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <TrendUp size={16} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Attendance Trend</p>
                <p className="text-[9px] font-bold text-white/25 uppercase tracking-wider">Avg {avgAtt} per service</p>
              </div>
            </div>
            <div className="relative z-10 flex-1">
              <GrowthChart trend={data?.trend} />
            </div>
          </div>

          <div className="bento-card p-8 relative overflow-hidden flex flex-col justify-between group bg-[#F0FDFA] border-emerald-100/70">
            <div className="absolute -right-10 -bottom-10 text-emerald-900/5 transition-transform group-hover:scale-110 duration-700 pointer-events-none">
              <Users size={160} weight="fill" />
            </div>
            <div className="relative z-10 flex justify-between items-start">
              <div className="w-10 h-10 rounded-full bg-white/70 backdrop-blur flex items-center justify-center text-emerald-500 shadow-sm">
                <Users size={20} weight="bold" />
              </div>
              <div className="px-3 py-1 bg-[var(--color-unio-emerald)]/10 text-[var(--color-unio-emerald)] rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
                <Lightning weight="fill" /> Active
              </div>
            </div>
            <div className="relative z-10 mt-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40 mb-1">Total Database</h3>
              <span className="text-7xl font-black tracking-tighter text-emerald-950 block">
                <CountUp value={data?.totalMembers || 0} />
              </span>
            </div>
            <div className="relative z-10 mt-6">
              <div className="flex h-2 rounded-full overflow-hidden bg-white/60">
                <div
                  className="bg-emerald-400"
                  style={{ width: `${data?.totalMembers ? (data.totalMembers / (data.totalMembers + (data?.firstTimers || 0))) * 100 : 0}%` }}
                />
                <div className="bg-amber-300 flex-1" />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-900/50">
                  {data?.totalMembers || 0} members
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-600/70">
                  {data?.firstTimers || 0} first-timers
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PROMPTNESS */}
        <div className="mt-6">
          <div className="bento-card p-6 sm:p-8 hover:transform-none">
            <PromptnessHierarchy />
          </div>
        </div>
      </div>
    </div>
  );
}
