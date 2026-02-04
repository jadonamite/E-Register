"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export const AddMemberDrawer = ({ onAdd }: { onAdd: (name: string, cell: string) => void }) => {
  const [name, setName] = useState("");
  const [cell, setCell] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    if (name && cell) {
      onAdd(name, cell);
      setName("");
      setCell("");
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <motion.button whileTap={{ scale: 0.95 }} className="glass-tile p-6 bg-white shadow-xl flex items-center justify-between group w-full">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pearl-gold/30 flex items-center justify-center group-hover:rotate-90 transition-transform">
              <UserPlus size={24} weight="bold" />
            </div>
            <span className="font-black text-sm uppercase tracking-tight text-left">New Convert</span>
          </div>
        </motion.button>
      </SheetTrigger>
      <SheetContent side="right" className="glass-tile border-none rounded-l-[3rem] p-10 w-full sm:max-w-[450px]">
        <SheetHeader className="mb-10 text-left">
          <SheetTitle className="text-3xl font-black tracking-tighter text-left">Add Convert</SheetTitle>
          <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.3em] text-left">Direct Cell Injection</p>
        </SheetHeader>
        <div className="space-y-6">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-14 bg-black/5 border-none rounded-2xl px-5" placeholder="Full Name" />
          <Input value={cell} onChange={(e) => setCell(e.target.value)} className="h-14 bg-black/5 border-none rounded-2xl px-5" placeholder="Assigned Cell" />
          <Button onClick={handleSubmit} className="w-full h-14 rounded-2xl bg-gradient-to-r from-pearl-pink to-pearl-gold text-black font-black shadow-lg">
            Confirm Member
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};