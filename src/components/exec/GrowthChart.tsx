"use client";
import { motion } from "framer-motion";
import { format } from "date-fns";

export const GrowthChart = ({ trend }: { trend: any[] }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="lg:col-span-8 p-10 bg-stone-900 text-white min-h-[500px] rounded-[2.5rem] relative overflow-hidden flex flex-col"
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

      <div className="flex justify-between items-center mb-10 relative z-10">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">Attendance Growth</h2>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1">Real-time Trend Analysis</p>
        </div>
      </div>
      
      <div className="w-full flex-1 flex items-end justify-between gap-4 border-b border-white/10 pb-4">
        {(!trend || trend.length === 0) ? (
            <div className="w-full h-full flex items-center justify-center text-white/20 font-black tracking-widest text-[10px]">
              NO DATA YET
            </div>
        ) : (
          trend.map((day: any, i: number) => {
            const maxVal = Math.max(...trend.map((h: any) => h.count));
            const heightPercentage = (day.count / maxVal) * 100;
            const dateLabel = new Date(day.date).getDate(); // The "7"
            
            return (
              <div key={i} className="flex-1 flex flex-col justify-end gap-2 group cursor-pointer">
                <div className="w-full bg-white/5 rounded-t-xl relative overflow-hidden group-hover:bg-white/10 transition-all h-48">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercentage}%` }}
                    transition={{ duration: 1, delay: 0.2 + (i * 0.1) }}
                    className="absolute bottom-0 w-full bg-emerald-500/80 rounded-t-xl"
                  />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold opacity-40">{dateLabel}</p> 
                  <p className="text-[10px] font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.count}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};