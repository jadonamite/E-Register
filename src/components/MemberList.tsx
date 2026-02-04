"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "@phosphor-icons/react";

export const MemberList = ({ members, signedInIds, onMarkPresent }: any) => {
  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {members.map((member: any) => (
          <motion.div
            key={member.id}
            layout
            className="flex items-center justify-between p-5 bg-white/60 border border-zinc-100 rounded-[1.5rem] hover:border-pearl-pink hover:bg-white transition-all group"
          >
            <div className="flex flex-col">
              <h3 className="member-name">{member.name}</h3>
          // Inside the map function:
<div className="flex items-center gap-2 mt-1">
  <span className="px-2 py-0.5 bg-pearl-pink/30 rounded-md text-[9px] font-black uppercase tracking-widest text-pink-600">
    {member.cell}
  </span>
  <span className="text-[10px] font-bold opacity-20 uppercase tracking-tighter">
    {/* Pulling schoolDept (e.g. MET) as requested */}
    {member.schoolDept}
  </span>
</div>
            </div>

            <button
              onClick={() => onMarkPresent(member.id)}
              disabled={signedInIds.includes(member.id)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                signedInIds.includes(member.id)
                ? "bg-emerald-500 text-white shadow-lg scale-110"
                : "bg-zinc-100 text-zinc-400 hover:bg-black hover:text-white"
              }`}
            >
              {signedInIds.includes(member.id) ? (
                <Check weight="bold" size={20} />
              ) : (
                <span className="text-[9px] font-black uppercase">Add</span>
              )}
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};