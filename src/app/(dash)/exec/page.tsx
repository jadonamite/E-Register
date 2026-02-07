"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { StatsGrid } from "@/components/exec/StatsGrid";
import { GrowthChart } from "@/components/exec/GrowthChart";
import { SidebarStats } from "@/components/exec/SidebarStats";

export default function ExecutiveDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBFC]">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Logo />
        <p className="text-[10px] font-black tracking-widest opacity-30 uppercase">Fetching Live Data...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBFC] p-6 md:p-12 font-sans max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-16">
        <Logo />
        <div className="bg-white/50 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] shadow-sm uppercase">
          ZONAL COMMAND CENTER • {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </div>
      </header>

      {/* 1. Top Cards (With First Timer Logic) */}
      <StatsGrid data={data} />

      {/* 2. Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <GrowthChart trend={data?.trend} />
        <SidebarStats cellStats={data?.cellStats} totalMembers={data?.totalMembers} />
      </div>
    </div>
  );
}