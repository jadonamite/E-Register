"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle } from "@phosphor-icons/react";
import { useState } from "react";

export const MemberList = ({ members, onMarkPresent }: { members: any[], onMarkPresent: () => void }) => {
  const [signedIn, setSignedIn] = useState<number[]>([]);

  const toggleSignIn = (id: number) => {
    if (!signedIn.includes(id)) {
      setSignedIn([...signedIn, id]);
      onMarkPresent();
    }
  };

  return (
    <ScrollArea className="flex-1 pr-4">
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {members.map((member) => (
            <motion.div
              key={member.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/30 rounded-[1.25rem] border border-white/20 transition-all group"
            >
              <div className="flex flex-col gap-1">
                <p className="font-bold text-sm tracking-tight">{member.name}</p>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-pearl-pink/30 text-[9px] font-bold px-2 py-0 border-none">
                    {member.cell}
                  </Badge>
                  <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest mt-0.5">
                    {member.schoolDept}
                  </span>
                </div>
              </div>

              <motion.div whileTap={{ scale: 0.9 }}>
                <Button 
                  onClick={() => toggleSignIn(member.id)}
                  disabled={signedIn.includes(member.id)}
                  className={`rounded-full px-6 transition-all duration-500 ${
                    signedIn.includes(member.id) 
                    ? "bg-emerald-400 text-white shadow-[0_0_15px_rgba(52,211,153,0.4)]" 
                    : "bg-white text-black hover:bg-pearl-gold shadow-sm"
                  }`}
                >
                  {signedIn.includes(member.id) ? (
                    <CheckCircle size={20} weight="fill" />
                  ) : (
                    <span className="text-xs font-black">Present</span>
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