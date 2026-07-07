"use client";
import { motion } from "framer-motion";

/** Bar chart that fills its parent card — the parent owns the surface and header. */
export const GrowthChart = ({ trend }: { trend: any[] }) => {
  if (!trend || trend.length === 0) {
    return (
      <div className="w-full h-full min-h-[160px] flex items-center justify-center text-white/20 font-black tracking-widest text-[10px]">
        NO ATTENDANCE DATA YET
      </div>
    );
  }

  const maxVal = Math.max(...trend.map((h: any) => h.count));

  return (
    <div className="w-full h-full flex items-end justify-between gap-3 sm:gap-4">
      {trend.map((day: any, i: number) => {
        const heightPercentage = (day.count / maxVal) * 100;
        const label = new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 group cursor-pointer">
            <p className="text-center text-xs font-black text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity">
              {day.count}
            </p>
            <div className="w-full max-w-[72px] h-32 sm:h-36 relative overflow-hidden rounded-lg bg-white/5 group-hover:bg-white/10 transition-all">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPercentage}%` }}
                transition={{ duration: 1, delay: 0.15 + i * 0.08 }}
                className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-emerald-500/70 to-emerald-400"
              />
            </div>
            <p className="text-center text-[10px] font-bold text-white/40">{label}</p>
          </div>
        );
      })}
    </div>
  );
};
