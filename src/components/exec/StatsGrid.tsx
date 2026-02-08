"use client";
import { motion } from "framer-motion";
import { UsersThree, UserPlus, TrendUp, Target } from "@phosphor-icons/react";

export const StatsGrid = ({ data }: { data: any }) => {
  const stats = [
    { 
      label: "First-Timers (30d)", 
      value: data?.firstTimers || 0, 
      growth: "New", 
      icon: UserPlus, 
      color: "text-purple-500", 
      bg: "bg-purple-50",
      watermarkColor: "text-purple-500/10"
    },
    { 
      label: "Avg. Attendance", 
      value: data?.trend?.length 
        ? Math.round(data.trend.reduce((a:any, b:any) => a + b.count, 0) / data.trend.length) 
        : 0, 
      growth: "Stable", 
      icon: TrendUp, 
      color: "text-emerald-500", 
      bg: "bg-emerald-50",
      watermarkColor: "text-emerald-500/10"
    },
    { 
      label: "Conversion Rate", 
      value: "24%", 
      growth: "-2%", 
      icon: Target, 
      color: "text-amber-500", 
      bg: "bg-amber-50",
      watermarkColor: "text-amber-500/10"
    },
  ];

  return (
    <>
      {stats.map((stat, i) => (
        <motion.div 
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + (i * 0.1) }}
          className="p-8 bg-white rounded-[2rem] border border-stone-100 shadow-sm relative overflow-hidden h-64 flex flex-col justify-between group hover:shadow-md transition-all"
        >
          {/* THE HUGE WATERMARK ICON */}
          <div className={`absolute -right-6 -top-6 ${stat.watermarkColor} transition-transform group-hover:scale-110 duration-500`}>
             <stat.icon size={160} weight="fill" />
          </div>

          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} weight="duotone" />
            </div>
            <span className={`text-[10px] font-black ${stat.color}`}>
              {stat.growth}
            </span>
          </div>
          
          <div className="relative z-10">
             <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{stat.label}</h3>
             <p className="text-5xl font-black mt-2 tracking-tighter text-stone-900">{stat.value}</p>
          </div>
        </motion.div>
      ))}
    </>
  );
};