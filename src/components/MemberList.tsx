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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] hover:shadow-xl hover:shadow-black/5 transition-all group"
          >
            <div className="flex flex-col">
              {/* Softened weight but kept readable size */}
              <h3 className="text-2xl font-medium tracking-tight text-zinc-900 mb-2">
                {member.name}
              </h3>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-pearl-pink/50 rounded-full text-[10px] font-black uppercase tracking-widest text-pink-700">
                  {member.cell}
                </span>
                {/* Now displaying Level/100L/200L etc */}
                <span className="text-[11px] font-bold opacity-30 uppercase tracking-widest">
                  {member.level || "100L"}
                </span>
              </div>
            </div>

            <button
              onClick={() => onMarkPresent(member.id)}
              disabled={signedInIds.includes(member.id)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${
                signedInIds.includes(member.id)
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                : "bg-zinc-100 text-black hover:bg-black hover:text-white"
              }`}
            >
              {signedInIds.includes(member.id) ? (
                <Check weight="bold" size={24} />
              ) : (
                <span className="text-[10px] font-black uppercase">Add</span>
              )}
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};