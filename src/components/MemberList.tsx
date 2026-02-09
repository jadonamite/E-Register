"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, PencilSimple } from "@phosphor-icons/react";

export const MemberList = ({ members = [], signedInIds = [], onMarkPresent, onEdit }: any) => {
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
            className="flex items-center justify-between p-5 bg-white/60 border border-zinc-100 rounded-[1.5rem] hover:border-pearl-pink hover:bg-white transition-all group shadow-sm"
          >
            <div className="flex flex-col">
              <h3 className="font-bold text-stone-900">{member.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-pink-100/50 rounded-md text-[9px] font-black uppercase tracking-widest text-pink-600 border border-pink-200/50">
                  {member.cell}
                </span>
                <span className="text-[10px] font-bold opacity-30 uppercase tracking-tighter">
                  {member.level} 
                </span>
                {member.role !== "Member" && (
                  <span className="px-2 py-0.5 bg-zinc-900 rounded-md text-[9px] font-black uppercase tracking-widest text-white">
                    {member.role}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Edit Button */}
              <button
                onClick={() => onEdit(member)}
                className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:border-zinc-900 transition-all"
              >
                <PencilSimple weight="bold" size={18} />
              </button>

              {/* Attendance Toggle */}
              <button
                onClick={() => onMarkPresent(member._id)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  signedInIds.includes(member._id)
                  ? "bg-emerald-500 text-white shadow-lg scale-110 ring-4 ring-emerald-100 hover:bg-red-500 hover:ring-red-100" 
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
        <div className="text-center p-10 opacity-40">
          <p className="text-xs font-bold uppercase tracking-widest">No members found</p>
        </div>
      )}
    </div>
  );
};