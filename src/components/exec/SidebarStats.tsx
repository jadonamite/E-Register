"use client";
import { motion } from "framer-motion";
import { Target, CaretRight } from "@phosphor-icons/react";

export const SidebarStats = ({ cellStats, totalMembers }: any) => {
  return (
    <div className="lg:col-span-4 flex flex-col gap-8">
      {/* 1. Cell Performance */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="p-8 bg-pink-50/50 border border-pink-100 rounded-[2rem]"
      >
        <h2 className="text-xl font-black tracking-tight mb-6 text-stone-900">Cell Performance</h2>
        <div className="space-y-4">
          {Object.entries(cellStats || {})
            .sort(([,a]: any, [,b]: any) => b - a)
            .slice(0, 5)
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
        </div>
      </motion.div>

      {/* 2. Goal Tracker */}
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
              transition={{ duration: 1.5 }}
              className="bg-emerald-500 h-full rounded-full" 
            />
          </div>
          <p className="text-[9px] font-bold mt-2 opacity-40">
            {Math.round((totalMembers / 200) * 100)}% OF SEMESTER GOAL REACHED
          </p>
      </div>
    </div>
  );
};