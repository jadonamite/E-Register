"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { GrowthChart } from "@/components/exec/GrowthChart"; 
import { ConnectivityEffect } from "@/components/exec/ConnectivityEffect";
import { motion } from "framer-motion";
import { Users, Warning, ShieldCheck, Lightning, UserPlus, TrendUp, Target } from "@phosphor-icons/react";

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

  // --- DERIVED DATA ---
  const cellStats = data?.cellStats || {};
  const topCell = Object.keys(cellStats).reduce((a, b) => cellStats[a] > cellStats[b] ? a : b, "N/A");
  const topCellCount = cellStats[topCell] || 0;
  
  const avgAtt = data?.trend?.length 
    ? Math.round(data.trend.reduce((a:any, b:any) => a + b.count, 0) / data.trend.length) 
    : 0;

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-8 font-unio max-w-[1600px] mx-auto relative overflow-hidden">
      
      {/* 1. BACKGROUND EFFECT (Subtle Tech Grid) */}
      <ConnectivityEffect />

      <div className="relative z-10">
        <header className="flex justify-between items-center mb-8 pl-2">
          <Logo />
          <div className="glass-frosted px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400">
            Feb 2026
          </div>
        </header>

        {/* 2. THE MASONRY LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
          
          {/* --- COL 1: TALL PINK CARD (Conversion Rate) --- 
              Style: Uses --color-pearl-pink, Geometric Ring, Tall Vertical
          */}
          <div className="lg:row-span-2 bento-card p-0 relative overflow-hidden flex flex-col items-center justify-between text-center group border-none">
             {/* Background Color from your theme */}
             <div className="absolute inset-0 bg-[var(--color-pearl-pink)] opacity-50 z-0" />
             
             {/* Decorative Gradient Line */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-300 to-transparent z-10" />

             <div className="relative z-10 mt-12 mb-8">
               {/* THE DONUT CHART */}
               <div className="relative w-40 h-40">
                 <svg className="transform -rotate-90 w-full h-full drop-shadow-xl">
                   {/* Track */}
                   <circle cx="80" cy="80" r="70" stroke="white" strokeWidth="12" fill="transparent" opacity={0.6} />
                   {/* Indicator (Pink) */}
                   <motion.circle 
                      initial={{ strokeDashoffset: 440 }}
                      animate={{ strokeDashoffset: 440 - (24/100)*440 }}
                      transition={{ duration: 1.5, delay: 0.2 }}
                      cx="80" cy="80" r="70" 
                      stroke="#ec4899" 
                      strokeWidth="12" 
                      fill="transparent" 
                      strokeDasharray={440} 
                      strokeLinecap="round" 
                   />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center flex-col">
                   <span className="text-4xl font-black text-rose-950">24%</span>
                 </div>
               </div>
             </div>
             
             <div className="relative z-10 w-full bg-white/40 backdrop-blur-md p-6 border-t border-white/20">
                <h3 className="text-xl font-bold text-rose-950 leading-tight mb-1">Retention Rate</h3>
                <p className="text-[10px] uppercase font-bold text-rose-900/50 tracking-widest">First-Timer Pipeline</p>
             </div>
          </div>


          {/* --- COL 2 & 3: TOTAL DATABASE (Wide Hero) --- */}
          <div className="lg:col-span-2 bento-card p-8 relative overflow-hidden flex flex-col justify-between group">
             <div className="absolute -right-8 -top-8 text-gray-50 transition-transform group-hover:scale-110 duration-700">
               <Users size={180} weight="fill" />
             </div>
             
             <div className="relative z-10 flex justify-between items-start">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                   <Users size={20} weight="bold" />
                </div>
                <div className="px-3 py-1 bg-[var(--color-unio-emerald)]/10 text-[var(--color-unio-emerald)] rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
                  <Lightning weight="fill" /> Active
                </div>
             </div>
             
             <div className="relative z-10 mt-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Database</h3>
                <span className="text-7xl font-black tracking-tighter text-gray-900">{data?.totalMembers || 0}</span>
             </div>
          </div>


          {/* --- COL 4: FIRST TIMERS (Notification Badge Style) --- 
              Style: Minimalist, "New" Badge, Massive Number
          */}
          <div className="bento-card p-6 flex flex-col justify-center relative overflow-hidden group">
             {/* The "New" Dot */}
             <div className="absolute top-6 right-6 flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-300 group-hover:text-[var(--color-unio-emerald)] transition-colors">Growth</span>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-unio-emerald)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-unio-emerald)]"></span>
                </span>
             </div>

             <div className="mt-4">
               <p className="text-5xl font-black tracking-tighter text-gray-900">{data?.firstTimers || 0}</p>
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">New Profiles</p>
             </div>
             
             {/* Subtle Decor */}
             <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-unio-emerald)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>


          {/* --- ROW 2: BLACK BOX (At Risk) --- */}
          <div className="bento-card bg-[#111] border-none text-white p-8 relative overflow-hidden flex flex-col justify-between group">
             <div className="absolute -right-6 -bottom-6 text-white/5 transition-transform group-hover:rotate-12 duration-500">
               <Warning size={140} weight="fill" />
             </div>
             
             <div className="relative z-10">
               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/5">
                 <Warning size={20} className="text-red-400" />
               </div>
             </div>
             
             <div className="relative z-10">
               <span className="text-6xl font-black tracking-tighter">{data?.riskCount || 0}</span>
               <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-2">Retention Risk</p>
             </div>
          </div>


          {/* --- ROW 2: GROWTH CHART (Wide) --- */}
          <div className="lg:col-span-2 bg-[#18181b] rounded-[2rem] border border-white/5 overflow-hidden relative">
             <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]" />
             <div className="relative z-10 h-full w-full p-4 flex items-end">
                <GrowthChart trend={data?.trend} />
             </div>
          </div>


          {/* --- ROW 2: AVG ATTENDANCE (Sparkline Card) --- 
              Style: Clean White, SVG Wave Background
          */}
          <div className="bento-card p-6 relative overflow-hidden flex flex-col justify-between group">
             {/* THE SPARKLINE WAVE (Decorative SVG) */}
             <div className="absolute bottom-0 left-0 right-0 h-24 opacity-10 text-[var(--color-unio-emerald)] pointer-events-none">
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="h-full w-full fill-current">
                  <path d="M0.00,49.98 C149.99,150.00 349.20,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" />
                </svg>
             </div>

             <div className="flex justify-between items-start z-10">
                <div className="p-2 bg-gray-50 rounded-lg">
                   <TrendUp size={20} className="text-gray-400" />
                </div>
                <span className="text-[9px] font-bold text-[var(--color-unio-emerald)] bg-[var(--color-unio-emerald)]/5 px-2 py-1 rounded-md">Stable</span>
             </div>

             <div className="z-10 mt-4">
                <p className="text-4xl font-black tracking-tighter text-gray-900">{avgAtt}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Avg. Attendance</p>
             </div>
          </div>


          {/* --- ROW 3: BOTTOM LEADERBOARDS --- */}

          {/* Leading Cell */}
          <div className="lg:col-span-2 bento-card p-8 flex items-center justify-between group bg-[#fff8e1] border-none relative overflow-hidden">
             {/* Pearl Gold Background from your CSS */}
             <div className="absolute inset-0 bg-[var(--color-pearl-gold)] opacity-50" />
             
             <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700/50 mb-2">Leading Cell</p>
                <h3 className="text-3xl font-black tracking-tighter text-amber-900">{topCell}</h3>
                <div className="flex items-center gap-2 mt-2">
                   <ShieldCheck size={16} weight="fill" className="text-amber-500" />
                   <span className="text-xs font-bold text-amber-800">{topCellCount} Members</span>
                </div>
             </div>
             
             <div className="relative z-10 opacity-10 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <Target size={100} className="text-amber-900" weight="duotone" />
             </div>
          </div>

          {/* Distribution List */}
          <div className="lg:col-span-2 bento-card p-8">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-900">Cell Distribution</h3>
             </div>
             
             <div className="space-y-4">
                {Object.entries(cellStats).sort(([,a]:any, [,b]:any) => b-a).slice(0, 2).map(([cell, count]: any, i) => (
                  <div key={cell}>
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-gray-300">0{i+1}</span>
                        <span className="text-xs font-black uppercase tracking-wider text-gray-900">{cell}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-400">{count}</span>
                    </div>
                    {/* The Black Bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / (data?.totalMembers || 1)) * 100}%` }}
                        transition={{ duration: 1, delay: 0.2 * i }}
                        className="h-full bg-gray-900 rounded-full" 
                      />
                    </div>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}