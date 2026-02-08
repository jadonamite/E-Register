"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { GrowthChart } from "@/components/exec/GrowthChart"; 
import { ConnectivityEffect } from "@/components/exec/ConnectivityEffect";
import { motion } from "framer-motion";
import { Users, Warning, ShieldCheck, Lightning, UserPlus, TrendUp, Target, CaretRight } from "@phosphor-icons/react";

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

  // Goal Logic
  const currentCount = data?.totalMembers || 0;
  const nextGoal = Math.ceil((currentCount + 0.1) / 50) * 50; // Always looks for next 50
  const progressToGoal = Math.min((currentCount / nextGoal) * 100, 100);

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-8 font-unio max-w-[1600px] mx-auto relative overflow-hidden">
      
      <ConnectivityEffect />

      <div className="relative z-10">
        <header className="flex justify-between items-center mb-8 pl-2">
          <Logo />
          <div className="glass-frosted px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400">
            Feb 2026
          </div>
        </header>

        {/* 4-COLUMN MASONRY GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
          
          {/* 1. CONVERSION RATE (Tall Pink Left) */}
          <div className="lg:row-span-2 bento-card p-0 relative overflow-hidden flex flex-col items-center justify-between text-center group border-none">
             <div className="absolute inset-0 bg-[var(--color-pearl-pink)] opacity-50 z-0" />
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-300 to-transparent z-10" />

             <div className="relative z-10 mt-12 mb-8">
               <div className="relative w-40 h-40">
                 <svg className="transform -rotate-90 w-full h-full drop-shadow-xl">
                   <circle cx="80" cy="80" r="70" stroke="white" strokeWidth="12" fill="transparent" opacity={0.6} />
                   <motion.circle 
                      initial={{ strokeDashoffset: 440 }}
                      animate={{ strokeDashoffset: 440 - (24/100)*440 }}
                      transition={{ duration: 1.5, delay: 0.2 }}
                      cx="80" cy="80" r="70" 
                      stroke="#ec4899" strokeWidth="12" fill="transparent" strokeDasharray={440} strokeLinecap="round" 
                   />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center flex-col">
                   <span className="text-4xl font-black text-rose-950">24%</span>
                 </div>
               </div>
             </div>
             
             <div className="relative z-10 w-full bg-white/40 backdrop-blur-md p-6 border-t border-white/20">
                <h3 className="text-xl font-bold text-rose-950 leading-tight mb-1">Retention Rate</h3>
                <p className="text-[10px] uppercase font-bold text-rose-900/50 tracking-widest">Pipeline Health</p>
             </div>
          </div>


          {/* 2. TOTAL MEMBERSHIP (Wide Top) */}
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


          {/* 3. FIRST TIMERS (Notification Badge) */}
          <div className="bento-card p-6 flex flex-col justify-center relative overflow-hidden group">
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
          </div>


          {/* 4. BLACK BOX (Risk) */}
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


          {/* 5. AVG ATTENDANCE (Sparkline) */}
          <div className="bento-card p-6 relative overflow-hidden flex flex-col justify-between group">
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


          {/* 6. LEADING CELL (Mint) */}
          <div className="bento-card p-8 flex items-center justify-between group bg-[#F0FDFA] border-emerald-100 relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 mb-2">Leading Cell</p>
                <h3 className="text-3xl font-black tracking-tighter text-emerald-900">{topCell}</h3>
                <div className="flex items-center gap-2 mt-2">
                   <ShieldCheck size={16} weight="fill" className="text-emerald-500" />
                   <span className="text-xs font-bold text-emerald-800">{topCellCount} Members</span>
                </div>
             </div>
          </div>


          {/* 7. GROWTH CHART (Wide) */}
          <div className="lg:col-span-2 bg-[#18181b] rounded-[2rem] border border-white/5 overflow-hidden relative min-h-[220px]">
             <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]" />
             <div className="relative z-10 h-full w-full p-4 flex items-end">
                <GrowthChart trend={data?.trend} />
             </div>
          </div>


          {/* 8. NEXT GOAL (The Progress Bar) */}
          <div className="lg:col-span-1 bento-card p-8 flex flex-col justify-center">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                   <Target weight="duotone" size={24} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Next Goal</p>
                   <h3 className="text-2xl font-black text-gray-900">{nextGoal} Members</h3>
                </div>
             </div>
             
             <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }} 
                   animate={{ width: `${progressToGoal}%` }} 
                   transition={{ duration: 1.5 }}
                   className="h-full bg-emerald-500 rounded-full" 
                />
             </div>
             <p className="text-[9px] font-bold text-gray-400 mt-3 text-right">{Math.round(progressToGoal)}% Reached</p>
          </div>


          {/* 9. CELL DISTRIBUTION (Full List) */}
          <div className="lg:col-span-1 bento-card p-8">
             <h3 className="text-xs font-bold text-gray-900 mb-4 uppercase tracking-widest">Cell Distribution</h3>
             <div className="space-y-4">
                {Object.entries(cellStats).sort(([,a]:any, [,b]:any) => b-a).slice(0, 3).map(([cell, count]: any, i) => (
                  <div key={cell}>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-900">{cell}</span>
                      <span className="text-[10px] font-bold text-gray-400">{count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
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


          {/* 10. RETENTION FOCUS (Full List - Bottom Wide) */}
          <div className="lg:col-span-2 bento-card p-8 border-rose-100 bg-rose-50/10">
             <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
               Retention Focus Area
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {data?.riskList?.slice(0, 4).map((m: any) => (
                  <div key={m._id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-rose-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-[10px] font-black text-rose-600">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900 leading-none">{m.name}</p>
                        <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mt-1">{m.cell}</p>
                      </div>
                    </div>
                    <CaretRight className="text-gray-300 group-hover:text-rose-500 transition-colors" />
                  </div>
               ))}
               {(!data?.riskList || data?.riskList.length === 0) && (
                 <div className="col-span-2 text-center py-4 opacity-40 text-xs font-bold uppercase tracking-widest">All Clear! No Risks Detected.</div>
               )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}