"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "@phosphor-icons/react";

export const MemberList = ({ members, signedInIds, onMarkPresent }: any) => {
  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {members.map((member: any) => (
          <motion.div
            key={member.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] hover:border-black transition-all group"
          >
            <div className="flex flex-col">
              <h3 className="text-2xl font-black tracking-tight leading-none mb-2">{member.name}</h3>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-pearl-pink rounded-full text-[10px] font-black uppercase tracking-widest text-pink-700">
                  {member.cell}
                </span>
                <span className="text-[10px] font-bold opacity-30 uppercase">{member.schoolDept}</span>
              </div>
            </div>

            <button
              onClick={() => onMarkPresent(member.id)}
              disabled={signedInIds.includes(member.id)}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                signedInIds.includes(member.id)
                ? "bg-unio-emerald text-white scale-110 shadow-lg"
                : "bg-gray-100 text-black hover:bg-black hover:text-white"
              }`}
            >
              {signedInIds.includes(member.id) ? (
                <Check weight="bold" size={28} />
              ) : (
                <span className="text-[10px] font-black uppercase tracking-tighter">Present</span>
              )}
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};