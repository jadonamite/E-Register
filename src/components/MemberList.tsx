"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, PencilSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export const MemberList = ({ members = [], signedInIds = [], onMarkPresent, onEdit }: any) => {
  // Dynamic Role Styling Helper
  const getRoleStyle = (role: string) => {
    switch (role) {
      case "Pastor": return "bg-amber-50 text-amber-700 border-amber-200/50 shadow-[0_2px_10px_-3px_rgba(251,191,36,0.3)]";
      case "Team Lead": return "bg-indigo-50 text-indigo-700 border-indigo-200/50 shadow-[0_2px_10px_-3px_rgba(99,102,241,0.3)]";
      case "Senior Cell Leader": return "bg-purple-50 text-purple-700 border-purple-200/50 shadow-[0_2px_10px_-3px_rgba(168,85,247,0.3)]";
      case "Cell Leader": return "bg-emerald-50 text-emerald-700 border-emerald-200/50 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.3)]";
      case "BST": return "bg-rose-50 text-rose-700 border-rose-200/50 shadow-[0_2px_10px_-3px_rgba(244,63,94,0.3)]";
      default: return "bg-zinc-50 text-zinc-500 border-zinc-200 shadow-none";
    }
  };

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {members.map((member: any) => (
          <motion.div
            key={member._id || member.id} 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center justify-between p-5 bg-white/60 border border-zinc-100 rounded-[2rem] hover:border-zinc-300 hover:bg-white transition-all group shadow-sm"
          >
            <div className="flex flex-col gap-1.5">
              <h3 className="font-bold text-stone-900 tracking-tight">{member.name}</h3>
              <div className="flex items-center gap-2">
                {/* Cell Tag */}
                <span className="px-2.5 py-1 bg-zinc-950 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                  {member.cell}
                </span>
                
                {/* Level Tag */}
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                  Lvl {member.level} 
                </span>

                {/* Refined Role Tag */}
                <span className={cn(
                  "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all",
                  getRoleStyle(member.role)
                )}>
                  {member.role}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Edit Action */}
              <button
                onClick={() => onEdit(member)}
                className="w-11 h-11 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-950 hover:border-zinc-950 hover:shadow-md transition-all active:scale-90"
              >
                <PencilSimple weight="bold" size={20} />
              </button>

              {/* Attendance Toggle */}
              <button
                onClick={() => onMarkPresent(member._id)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${
                  signedInIds.includes(member._id)
                  ? "bg-emerald-500 text-white shadow-emerald-200 hover:bg-red-500" 
                  : "bg-zinc-100 text-zinc-400 hover:bg-zinc-950 hover:text-white"
                }`}
              >
                {signedInIds.includes(member._id) ? (
                  <Check weight="bold" size={24} />
                ) : (
                  <span className="text-[10px] font-black uppercase">Add</span>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {members.length === 0 && (
        <div className="text-center py-20 opacity-20">
          <p className="text-sm font-black uppercase tracking-[0.3em]">Registry Empty</p>
        </div>
      )}
    </div>
  );
};