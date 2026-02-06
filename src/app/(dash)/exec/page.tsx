"use client";

import React from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { 
  TrendUp, 
  UsersThree, 
  UserPlus, 
  Target, 
  CaretRight 
} from "@phosphor-icons/react";

// Mock analytics data for the Bento Grid
const stats = [
  { label: "Total Membership", value: "1,240", growth: "+12%", icon: UsersThree, color: "text-blue-500" },
  { label: "First-Timers (MTD)", value: "86", growth: "+5%", icon: UserPlus, color: "text-pearl-pink" },
  { label: "Avg. Attendance", value: "840", growth: "+8%", icon: TrendUp, color: "text-emerald-500" },
  { label: "Conversion Rate", value: "24%", growth: "-2%", icon: Target, color: "text-amber-500" },
];

export default function ExecutiveDashboard() {
  return (
    <div className="min-h-screen bg-[#FDFBFC] p-6 md:p-12 font-unio max-w-[1600px] mx-auto relative">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-16">
        <Logo />
        <div className="glass-frosted px-6 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em]">
          ZONAL COMMAND CENTER • FEB 2026
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
            className="bento-card p-8 bg-white"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-zinc-50 ${stat.color}`}>
                <stat.icon size={24} weight="duotone" />
              </div>
              <span className={`text-[10px] font-black ${stat.growth.includes('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.growth}
              </span>
            </div>
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</h3>
            <p className="text-4xl font-black mt-1 tracking-tighter">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* MAIN ANALYTICS BENTO */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-8 bento-card p-10 bg-zinc-900 text-white min-h-[500px]"
        >
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-black tracking-tighter">Attendance Growth</h2>
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1">Rolling 6-Month Comparison</p>
            </div>
            <button className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-black transition-all">
              DOWNLOAD PDF
            </button>
          </div>
          
          {/* Placeholder for Recharts / Data Viz */}
          <div className="w-full h-64 flex items-center justify-center border-2 border-dashed border-white/10 rounded-[2rem]">
            <p className="text-white/20 font-black tracking-widest text-[10px]">CHART ENGINE LOADING...</p>
          </div>
        </motion.div>

        {/* SIDEBAR PERFORMANCE BENTO */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bento-card p-8 bg-pearl-pink/10 border-pearl-pink/20"
          >
            <h2 className="text-xl font-black tracking-tight mb-6">Top Performing Cells</h2>
            <div className="space-y-6">
              {['Zion', 'Marvelous', 'Harvesters'].map((cell, i) => (
                <div key={cell} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black opacity-20">0{i+1}</span>
                    <span className="font-bold tracking-tight">{cell}</span>
                  </div>
                  <CaretRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              ))}
            </div>
          </motion.div>

          <div className="bento-card p-8 bg-white flex flex-col justify-center items-center text-center">
             <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
               <Target size={32} weight="bold" />
             </div>
             <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Next Goal</p>
             <h3 className="text-2xl font-black tracking-tighter">1,500 Members</h3>
             <div className="w-full bg-zinc-100 h-2 mt-6 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[82%]" />
             </div>
             <p className="text-[9px] font-bold mt-2 opacity-40">82% OF SEMESTER GOAL REACHED</p>
          </div>
        </div>
      </div>
    </div>
  );
}