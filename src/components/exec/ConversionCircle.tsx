"use client";
import { motion } from "framer-motion";

export const ConversionCircle = ({ percentage }: { percentage: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-[#FFE4E6] p-8 rounded-[2.5rem] h-full flex flex-col items-center justify-center text-center relative overflow-hidden text-rose-950">
      <h3 className="font-bold text-sm mb-6">Retention Rate</h3>
      
      {/* SVG Circle Chart */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="transform -rotate-90 w-32 h-32">
          <circle
            cx="64" cy="64" r={radius}
            stroke="white" strokeWidth="8" fill="transparent" opacity={0.5}
          />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, delay: 0.2 }}
            cx="64" cy="64" r={radius}
            stroke="#BE123C" strokeWidth="8" fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-2xl font-black">{percentage}%</span>
      </div>

      <div className="mt-6">
        <p className="text-3xl font-black tracking-tighter mb-1">Stable</p>
        <p className="text-[10px] uppercase font-bold opacity-50 tracking-widest">Since last month</p>
      </div>
    </div>
  );
};