"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { StatsGrid } from "@/components/exec/StatsGrid";
import { GrowthChart } from "@/components/exec/GrowthChart";
import { SidebarStats } from "@/components/exec/SidebarStats";
import { HeroGrid } from "@/components/exec/HeroGrid";            // NEW
import { CellDistribution } from "@/components/exec/CellDistribution"; // NEW
import { RetentionList } from "@/components/exec/RetentionList";       // NEW

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
        <p className="text-[10px] font-black tracking-widest opacity-30 uppercase">Fetching Command Data...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBFC] p-6 md:p-12 font-sans max-w-[1600px] mx-auto">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12">
        <Logo />
        <div className="bg-white border border-stone-100 px-6 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] shadow-sm uppercase text-stone-400">
          ZONAL COMMAND CENTER • {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </div>
      </header>
      
      <div className="space-y-8">
        {/* SECTION 1: THE HEROES (Total, Risk, Leading) */}
        <HeroGrid data={data} />

        {/* SECTION 2: THE KPI DETAILS (Old Grid) */}
        <div>
          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6 ml-2">KPI Metrics</h4>
          <StatsGrid data={data} />
        </div>

        {/* SECTION 3: GROWTH & DISTRIBUTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
             <GrowthChart trend={data?.trend} />
          </div>
          <div className="lg:col-span-4">
            {/* The Black Bar Chart */}
            <CellDistribution cellStats={data?.cellStats} total={data?.totalMembers} />
          </div>
        </div>

        {/* SECTION 4: ACTION ITEMS & GOALS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8">
             <RetentionList riskList={data?.riskList} />
           </div>
           <div className="lg:col-span-4">
             {/* Re-using SidebarStats for the Target Goal Card, passing empty cellStats so it hides the duplicate list */}
             <SidebarStats cellStats={{}} totalMembers={data?.totalMembers} />
           </div>
        </div>
      </div>
    </div>
  );
}