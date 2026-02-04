"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "@phosphor-icons/react";

export const AddMemberModal = ({ onAdd }: { onAdd: (data: any) => void }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    name: "", cell: "", level: "", phone: "", gender: "" 
  });

  const handleSubmit = () => {
    if (form.name && form.cell) {
      onAdd({ ...form, id: Date.now() });
      setForm({ name: "", cell: "", level: "", phone: "", gender: "" });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* FAB: Minimalist Circle Plus */}
        <button className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group">
          <Plus size={32} weight="bold" className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </DialogTrigger>
      
      <DialogContent className="glass-frosted sm:max-w-[550px] rounded-[2.5rem] p-10 border-none">
        <DialogHeader className="text-left mb-8">
          <DialogTitle className="text-3xl font-bold tracking-tight">New Member Profile</DialogTitle>
          <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em]">Comprehensive Database Entry</p>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold opacity-40 uppercase ml-1">Full Legal Name</label>
            <Input 
              value={form.name} 
              onChange={(e) => setForm({...form, name: e.target.value})} 
              className="input-premium h-14 px-5 font-medium" 
              placeholder="e.g. Daniel Chinyere Kenechukwu" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold opacity-40 uppercase ml-1">Cell</label>
              <Input 
                value={form.cell} 
                onChange={(e) => setForm({...form, cell: e.target.value})} 
                className="input-premium h-14 px-5" 
                placeholder="Marvelous" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold opacity-40 uppercase ml-1">Level</label>
              <Input 
                value={form.level} 
                onChange={(e) => setForm({...form, level: e.target.value})} 
                className="input-premium h-14 px-5" 
                placeholder="400L" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold opacity-40 uppercase ml-1">Phone Number</label>
              <Input 
                value={form.phone} 
                onChange={(e) => setForm({...form, phone: e.target.value})} 
                className="input-premium h-14 px-5" 
                placeholder="080..." 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold opacity-40 uppercase ml-1">Gender</label>
              <Input 
                value={form.gender} 
                onChange={(e) => setForm({...form, gender: e.target.value})} 
                className="input-premium h-14 px-5" 
                placeholder="Male / Female" 
              />
            </div>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full h-16 rounded-2xl bg-black text-white hover:bg-zinc-800 text-lg font-bold mt-4 shadow-xl active:scale-[0.98] transition-all"
          >
            Create Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};