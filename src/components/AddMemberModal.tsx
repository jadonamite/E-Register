"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus } from "@phosphor-icons/react";

export const AddMemberModal = ({ onAdd }: { onAdd: (data: any) => void }) => {
  const [formData, setFormData] = useState({ name: "", cell: "", school: "" });
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    if (formData.name && formData.cell) {
      onAdd(formData);
      setFormData({ name: "", cell: "", school: "" });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="bento-card p-8 flex items-center justify-between group hover:bg-black hover:text-white w-full">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-pearl-gold flex items-center justify-center text-black group-hover:rotate-90 transition-transform duration-500">
              <UserPlus size={28} weight="bold" />
            </div>
            <div className="text-left">
              <p className="text-lg font-black tracking-tight uppercase">Add New Member</p>
              <p className="text-[10px] font-bold opacity-50">MANUAL DATABASE INJECTION</p>
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-12 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-4xl font-black tracking-tighter mb-2">New Member</DialogTitle>
          <p className="text-xs font-bold opacity-30 uppercase tracking-[0.2em]">Enter Full Details</p>
        </DialogHeader>
        <div className="space-y-6 mt-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase opacity-40 ml-1">Full Identity</label>
            <Input 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              className="input-premium h-16 px-6 text-lg font-bold" 
              placeholder="e.g. Daniel Kenechukwu" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase opacity-40 ml-1">Cell Name</label>
              <Input 
                value={formData.cell} 
                onChange={(e) => setFormData({...formData, cell: e.target.value})} 
                className="input-premium h-14 px-5 font-bold" 
                placeholder="Marvelous" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase opacity-40 ml-1">Department</label>
              <Input 
                value={formData.school} 
                onChange={(e) => setFormData({...formData, school: e.target.value})} 
                className="input-premium h-14 px-5 font-bold" 
                placeholder="MCS" 
              />
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full h-16 rounded-2xl bg-black text-white hover:bg-zinc-800 text-lg font-black mt-4 transition-all active:scale-95">
            Add to Database
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};