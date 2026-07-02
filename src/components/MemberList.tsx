"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, PencilSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export const MemberList = ({ members = [], signedInIds = [], onMarkPresent, onEdit, canMark = true }: any) => {
  const getRoleStyle = (role: string) => {
    switch (role) {
      case "Pastor": return "bg-amber-100 text-amber-700 border-amber-200";
      case "Team Lead": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "Cell Leader": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "BST": return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-zinc-100 text-zinc-500 border-zinc-200";
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
                <span className="px-2 py-0.5 bg-pink-100/50 rounded-md text-[9px] font-black uppercase tracking-widest text-pink-600 border border-pink-200/50">
                  {member.cell}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                  {member.level} 
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border transition-all shadow-sm",
                  getRoleStyle(member.role)
                )}>
                  {member.role}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {canMark && (
                <button
                  onClick={() => onEdit(member)}
                  className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:border-zinc-900 transition-all"
                >
                  <PencilSimple weight="bold" size={18} />
                </button>
              )}

              <button
                onClick={() => canMark && onMarkPresent(member._id)}
                disabled={!canMark}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                  !canMark
                  ? "bg-zinc-100 text-zinc-300 cursor-not-allowed"
                  : signedInIds.includes(member._id)
                  ? "bg-emerald-500 text-white shadow-emerald-100 hover:bg-red-500"
                  : "bg-zinc-100 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                {signedInIds.includes(member._id) ? (
                  <Check weight="bold" size={20} />
                ) : (
                  <span className="text-[9px] font-black uppercase">Add</span>
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