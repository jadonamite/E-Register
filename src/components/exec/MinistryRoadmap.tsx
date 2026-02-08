"use client";
import { motion } from "framer-motion";
import { Check, Circle } from "@phosphor-icons/react";

export const MinistryRoadmap = ({ totalMembers }: { totalMembers: number }) => {
  const steps = [
    { label: "Semester Start", target: 0, completed: true },
    { label: "First 50 Members", target: 50, completed: totalMembers >= 50 },
    { label: "Growth Phase", target: 100, completed: totalMembers >= 100 },
    { label: "Expansion", target: 150, completed: totalMembers >= 150 },
    { label: "Semester Goal", target: 200, completed: totalMembers >= 200 },
  ];

  return (
    <div className="bg-white p-8 rounded-[2.5rem] h-full border border-stone-100 flex flex-col relative overflow-hidden">
      <h3 className="font-black text-xl mb-8 tracking-tight">Ministry Roadmap</h3>
      
      <div className="relative flex-1 pl-4">
        {/* The Vertical Line (Animated) */}
        <div className="absolute left-[1.65rem] top-2 bottom-10 w-0.5 bg-stone-100">
          <motion.div 
            initial={{ height: "0%" }}
            animate={{ height: `${Math.min((totalMembers / 200) * 100, 100)}%` }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="w-full bg-stone-900"
          />
        </div>

        <div className="space-y-8 relative z-10">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-6">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center border-[3px] transition-all duration-500
                ${step.completed ? 'bg-stone-900 border-stone-900 text-white' : 'bg-white border-stone-200 text-stone-300'}
              `}>
                {step.completed ? <Check weight="bold" /> : <Circle weight="fill" size={8} />}
              </div>
              <div>
                <p className={`font-bold text-sm ${step.completed ? 'text-stone-900' : 'text-stone-400'}`}>
                  {step.label}
                </p>
                <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">{step.target} Members</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3D Abstract Decor */}
      <div className="absolute -bottom-10 -right-10 opacity-5">
         <div className="w-40 h-40 border-[20px] border-stone-900 rounded-full" />
      </div>
    </div>
  );
};