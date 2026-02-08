"use client";
import { motion } from "framer-motion";

export const CellDistribution = ({ cellStats, total }: { cellStats: any, total: number }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="bg-white p-8 rounded-[2rem] border border-stone-100"
    >
      <h3 className="font-bold text-lg text-stone-900 mb-8">Cell Distribution</h3>
      
      <div className="space-y-6">
        {Object.entries(cellStats || {})
          .sort(([,a]: any, [,b]: any) => b - a)
          .map(([cell, count]: any, i) => (
          <div key={cell}>
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-stone-300">0{i+1}</span>
                <span className="text-xs font-black uppercase tracking-wider text-stone-900">{cell}</span>
              </div>
              <span className="text-xs font-bold text-stone-400">{count}</span>
            </div>
            
            {/* The Black Bar */}
            <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(count / total) * 100}%` }}
                transition={{ duration: 1, delay: 0.2 * i }}
                className="h-full bg-black rounded-full" 
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};