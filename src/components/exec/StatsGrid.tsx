"use client";
import { motion } from "framer-motion";
import { UsersThree, UserPlus, TrendUp, Target } from "@phosphor-icons/react";

export const StatsGrid = ({ data }: { data: any }) => {
  const stats = [
    { 
      label: "Total Membership", 
      value: data?.totalMembers || 0, 
      growth: "+100%", // You can calculate real growth later if needed
      icon: UsersThree, 
      color: "text-blue-500", 
      bg: "bg-blue-50" 
    },
    { 
      label: "First-Timers (30d)", 
      value: data?.firstTimers || 0, // Real Data from API
      growth: "New", 
      icon: UserPlus, // Restored the UserPlus icon
      color: "text-pink-500", 
      bg: "bg-pink-50" 
    },
    { 
      label: "Avg. Attendance", 
      value: data?.trend?.length 
        ? Math.round(data.trend.reduce((a:any, b:any) => a + b.count, 0) / data.trend.length) 
        : 0, 
      growth: "Stable", 
      icon: TrendUp, 
      color: "text-emerald-500", 
      bg: "bg-emerald-50" 
    },
    { 
      label: "Conversion Rate", // Kept your original label preference
      value: "24%", // Placeholder until we track salvations
      growth: "-2%", 
      icon: Target, 
      color: "text-amber-500", 
      bg: "bg-amber-50" 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {stats.map((stat, i) => (
        <motion.div 
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="p-8 bg-white rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-all"
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
  );
};