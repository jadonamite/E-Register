"use client";
import { motion } from "framer-motion";
import { Users, Warning, ShieldCheck } from "@phosphor-icons/react";

export const HeroGrid = ({ data }: { data: any }) => {
  const cellStats = data?.cellStats || {};
  const topCell = Object.keys(cellStats).reduce((a, b) => cellStats[a] > cellStats[b] ? a : b, "N/A");
  const topCellCount = cellStats[topCell] || 0;

  return (
    <> 
      {/* 1. TOTAL */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm relative overflow-hidden h-64 flex flex-col justify-between"
      >
        <div className="absolute -right-6 -top-6 text-stone-50">
          <Users size={180} weight="fill" />
        </div>
        <div className="bg-stone-50 w-12 h-12 rounded-full flex items-center justify-center relative z-10">
          <Users size={24} className="text-stone-900" />
        </div>
        <div className="relative z-10">
          <span className="text-6xl font-black tracking-tighter text-stone-900 block">{data?.totalMembers || 0}</span>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mt-2">Total Database</p>
        </div>
      </motion.div>

      {/* 2. RISK */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-[#1a1a1a] p-8 rounded-[2rem] shadow-xl relative overflow-hidden h-64 flex flex-col justify-between"
      >
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-white/5 rotate-12">
          <Warning size={200} weight="duotone" />
        </div>
        <div className="bg-white/10 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border border-white/5 relative z-10">
          <Warning size={24} className="text-red-400" />
        </div>
        <div className="relative z-10">
          <span className="text-6xl font-black tracking-tighter text-white block">{data?.riskCount || 0}</span>
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mt-2">At Risk</p>
        </div>
      </motion.div>

      {/* 3. LEADING CELL */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-[#F0FDFA] p-8 rounded-[2rem] border border-emerald-100/50 relative overflow-hidden h-64 flex flex-col justify-between"
      >
        <div className="absolute -right-8 -bottom-8 text-emerald-500/10">
           <ShieldCheck size={200} weight="fill" />
        </div>
        <div className="flex justify-between items-start relative z-10">
           <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm">
             <ShieldCheck size={24} className="text-emerald-600" />
           </div>
        </div>
        <div className="relative z-10">
          <h3 className="text-4xl font-black tracking-tighter text-emerald-900 leading-tight">{topCell}</h3>
          <p className="text-emerald-600/70 font-bold text-xs uppercase tracking-wider mt-2">Highest Count ({topCellCount})</p>
        </div>
      </motion.div>
    </>
  );
};