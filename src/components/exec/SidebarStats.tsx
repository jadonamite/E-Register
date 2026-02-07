"use client";
import { motion } from "framer-motion";
import { Target, CaretRight } from "@phosphor-icons/react";

export const SidebarStats = ({ cellStats, totalMembers }: any) => {
  // Logic to determine next milestone (e.g. if you have 14 members, goal is 50. If 60, goal is 100)
  const nextGoal = Math.ceil((totalMembers + 1) / 50) * 50;
  const progress = Math.min((totalMembers / nextGoal) * 100, 100);

  return (
    <div className="lg:col-span-4 flex flex-col gap-8">
      {/* 1. Top Performing Cells (Restored Original Design) */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="p-8 bg-pink-50/30 border border-pink-100 rounded-[2rem]"
      >
        <h2 className="text-xl font-black tracking-tight mb-6 text-stone-900">Top Performing Cells</h2>
        <div className="space-y-6">
          {Object.entries(cellStats || {})
            .sort(([,a]: any, [,b]: any) => b - a) // Sort by count
            .slice(0, 3) // Top 3 only
            .map(([cell, count]: any, i) => (
            <div key={cell} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black opacity-20 w-4">0{i+1}</span>
                <span className="font-bold tracking-tight text-stone-900">{cell}</span>
              </div>
              <CaretRight size={16} className="opacity-0 group-hover:opacity-100 transition-all text-pink-400" />
            </div>
          ))}
          {/* Fallback if no data */}
          {Object.keys(cellStats || {}).length === 0 && (
            <p className="text-xs opacity-40 italic">No attendance data yet.</p>
          )}
        </div>
      </motion.div>

      {/* 2. Next Goal Tracker (Restored Original Design) */}
      <div className="p-8 bg-white rounded-[2rem] border border-stone-100 flex flex-col justify-center items-center text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
            <Target size={32} weight="bold" />
          </div>
          <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Next Goal</p>
          <h3 className="text-2xl font-black tracking-tighter text-stone-900">{nextGoal} Members</h3>
          
          <div className="w-full bg-zinc-100 h-2 mt-6 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5 }}
              className="bg-emerald-500 h-full rounded-full" 
            />
          </div>
          <p className="text-[9px] font-bold mt-2 opacity-40">
            {Math.round(progress)}% OF SEMESTER GOAL REACHED
          </p>
      </div>
    </div>
  );
};