"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { StatsGrid } from "@/components/exec/StatsGrid";
import { GrowthChart } from "@/components/exec/GrowthChart";
import { SidebarStats } from "@/components/exec/SidebarStats";
import { HeroGrid } from "@/components/exec/HeroGrid"; 
import { CellDistribution } from "@/components/exec/CellDistribution"; 
import { RetentionList } from "@/components/exec/RetentionList"; 

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
      
      {/* MASTER BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* ROW 1 & 2: THE STATS MASONRY (6 Cards Total) */}
        {/* We drop the HeroGrid wrapper content directly here visually by nesting or using Fragments if we wanted, 
            but keeping them as components is cleaner. 
            HeroGrid returns 3 cols. StatsGrid returns 3 cols. 
            We will render them side-by-side in code flow.
        */}
        
        {/* The 3 Big Hero Cards */}
        <HeroGrid data={data} />
        
        {/* The 3 Smaller KPI Cards (Now matching the style) */}
        <StatsGrid data={data} />
        
        {/* ROW 3: CHARTING (Spans 2 cols) & DISTRIBUTION (Spans 1 col) */}
        <div className="lg:col-span-2">
           <GrowthChart trend={data?.trend} />
        </div>
        <div className="lg:col-span-1 h-full">
           <CellDistribution cellStats={data?.cellStats} total={data?.totalMembers} />
        </div>

        {/* ROW 4: LISTS & GOALS */}
        <div className="lg:col-span-2">
           <RetentionList riskList={data?.riskList} />
        </div>
        <div className="lg:col-span-1">
           <SidebarStats cellStats={{}} totalMembers={data?.totalMembers} />
        </div>

      </div>
    </div>
  );
}