"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle } from "@phosphor-icons/react";

interface MemberListProps {
  members: any[];
  signedInIds: number[];
  onMarkPresent: (id: number) => void;
}

export const MemberList = ({ members, signedInIds, onMarkPresent }: MemberListProps) => {
  return (
    <ScrollArea className="flex-1 pr-4">
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {members.map((member) => (
            <motion.div
              key={member.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-5 bg-white/30 hover:bg-white/60 rounded-[1.5rem] border border-white/40 transition-all group"
            >
              <div className="flex flex-col gap-1">
                <p className="font-bold text-sm tracking-tight">{member.name}</p>
                <div className="flex gap-2">
                  <Badge className="bg-pearl-pink/40 text-black text-[9px] px-2 py-0">
                    {member.cell}
                  </Badge>
                  <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest mt-0.5">
                    {member.schoolDept}
                  </span>
                </div>
              </div>

              <motion.div whileTap={{ scale: 0.9 }}>
                <Button 
                  onClick={() => onMarkPresent(member.id)}
                  disabled={signedInIds.includes(member.id)}
                  className={`rounded-full h-11 px-8 transition-all duration-500 ${
                    signedInIds.includes(member.id) 
                    ? "bg-emerald-400 text-white shadow-[0_0_20px_rgba(52,211,153,0.5)] border-none" 
                    : "bg-white text-black hover:bg-pearl-gold border border-black/5"
                  }`}
                >
                  {signedInIds.includes(member.id) ? (
                    <CheckCircle size={22} weight="fill" />
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest">Present</span>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
};