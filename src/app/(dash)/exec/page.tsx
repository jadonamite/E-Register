"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { 
  TrendUp, 
  UsersThree, 
  Warning, // Changed UserPlus to Warning for Risk Metric
  Target, 
  CaretRight,
  ShieldCheck
} from "@phosphor-icons/react";

export default function ExecutiveDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Real Data
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // 2. Calculate Derived Stats (Safe defaults if data is null)
  const totalMembers = data?.totalMembers || 0;
  const riskCount = data?.riskCount || 0;
  
  // Calculate Average Attendance from the trend history
  const history = data?.trend || [];
  const avgAttendance = history.length > 0 
    ? Math.round(history.reduce((acc: any, curr: any) => acc + curr.count, 0) / history.length) 
    : 0;

  // Find Top Cell
  const cellStats = data?.cellStats || {};
  const topCell = Object.keys(cellStats).reduce((a, b) => cellStats[a] > cellStats[b] ? a : b, "N/A");
  const topCellCount = cellStats[topCell] || 0;

  // 3. Dynamic Stats Array for the Top Row
  const stats = [
    { 
      label: "Total Membership", 
      value: totalMembers.toLocaleString(), 
      growth: "+100%", // You can calculate real growth later
      icon: UsersThree, 
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    { 
      label: "Retention Risk", // Swapped First-Timers for Risk (Real Data)
      value: riskCount.toString(), 
      growth: `${((riskCount/totalMembers)*100).toFixed(1)}%`, // % of church at risk
      icon: Warning, 
      color: "text-rose-500", // Red for danger
      bg: "bg-rose-50"
    },
    { 
      label: "Avg. Attendance", 
      value: avgAttendance.toString(), 
      growth: "+Stable", 
      icon: TrendUp, 
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    { 
      label: "Top Cell Strength", 
      value: topCellCount.toString(), 
      growth: topCell, // Showing the name of the cell here
      icon: ShieldCheck, 
      color: "text-amber-500",
      bg: "bg-amber-50"
    },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBFC]">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Logo />
        <p className="text-[10px] font-black tracking-widest opacity-30 uppercase">Syncing Live Data...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBFC] p-6 md:p-12 font-sans max-w-[1600px] mx-auto relative">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-16">
        <Logo />
        <div className="bg-white/50 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] shadow-sm uppercase">
          ZONAL COMMAND CENTER • {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </div>
      </header>

      {/* TOP KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-white rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} weight="duotone" />
              </div>
              <span className={`text-[10px] font-black ${stat.color === 'text-rose-500' ? 'text-rose-500' : 'text-emerald-500'}`}>
                {stat.growth}
              </span>
            </div>
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{stat.label}</h3>
            <p className="text-4xl font-black mt-1 tracking-tighter text-stone-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* MAIN ANALYTICS BENTO */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-8 p-10 bg-stone-900 text-white min-h-[500px] rounded-[2.5rem] relative overflow-hidden flex flex-col"
        >
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="flex justify-between items-center mb-10 relative z-10">
            <div>
              <h2 className="text-3xl font-black tracking-tighter">Attendance Growth</h2>
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1">Real-time Trend Analysis</p>
            </div>
            <button className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-black transition-all border border-white/5">
              EXPORT DATA
            </button>
          </div>
          
          {/* THE CHART ENGINE (Real Data Viz) */}
          <div className="w-full flex-1 flex items-end justify-between gap-4 border-b border-white/10 pb-4">
            {history.length === 0 ? (
               <div className="w-full h-full flex items-center justify-center text-white/20 font-black tracking-widest text-[10px]">
                 NO ATTENDANCE DATA YET
               </div>
            ) : (
              history.map((day: any, i: number) => {
                const maxVal = Math.max(...history.map((h: any) => h.count));
                const heightPercentage = (day.count / maxVal) * 100;
                
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end gap-2 group cursor-pointer">
                    <div className="w-full bg-white/5 rounded-t-xl relative overflow-hidden group-hover:bg-white/10 transition-all h-48">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercentage}%` }}
                        transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                        className="absolute bottom-0 w-full bg-emerald-500/80 rounded-t-xl"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold opacity-40">{new Date(day.date).getDate()}</p>
                      <p className="text-[10px] font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">{day.count}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* SIDEBAR PERFORMANCE BENTO */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <motion.div 
            whileHover={{ y: -5 }}
            className="p-8 bg-pink-50/50 border border-pink-100 rounded-[2rem]"
          >
            <h2 className="text-xl font-black tracking-tight mb-6 text-stone-900">Cell Performance</h2>
            <div className="space-y-4">
              {/* Map Real Cell Stats */}
              {Object.entries(cellStats)
                .sort(([,a]: any, [,b]: any) => b - a) // Sort Highest first
                .slice(0, 5) // Top 5
                .map(([cell, count]: any, i) => (
                <div key={cell} className="flex items-center justify-between group cursor-pointer p-3 hover:bg-white rounded-xl transition-all">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black opacity-20 w-4">0{i+1}</span>
                    <div>
                      <span className="font-bold tracking-tight text-stone-900 block">{cell}</span>
                      <span className="text-[9px] font-bold text-pink-400 uppercase tracking-wider">{count} Members</span>
                    </div>
                  </div>
                  <CaretRight size={16} className="opacity-0 group-hover:opacity-100 transition-all text-pink-400" />
                </div>
              ))}
              {Object.keys(cellStats).length === 0 && (
                <p className="text-xs opacity-40">No cell data available.</p>
              )}
            </div>
          </motion.div>

          <div className="p-8 bg-white rounded-[2rem] border border-stone-100 flex flex-col justify-center items-center text-center shadow-sm">
             <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
               <Target size={32} weight="bold" />
             </div>
             <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Next Goal</p>
             <h3 className="text-2xl font-black tracking-tighter text-stone-900">200 Members</h3>
             <div className="w-full bg-zinc-100 h-2 mt-6 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totalMembers / 200) * 100, 100)}%` }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="bg-emerald-500 h-full rounded-full" 
                />
             </div>
             <p className="text-[9px] font-bold mt-2 opacity-40">
               {Math.round((totalMembers / 200) * 100)}% OF SEMESTER GOAL REACHED
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
