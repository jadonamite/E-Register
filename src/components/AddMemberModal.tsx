"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "@phosphor-icons/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const AddMemberModal = ({ onAdd }: { onAdd: (data: any) => void }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("existing");
  const [form, setForm] = useState({
    name: "", cell: "", schoolDept: "", churchDept: "", level: "",
    role: "Base Member", birthday: "", invitedBy: "", address: ""
  });

  const handleSubmit = () => {
    if (form.name && form.cell) {
      onAdd({ ...form, id: Date.now() });
      setForm({ name: "", cell: "", schoolDept: "", churchDept: "", level: "", role: "Base Member", birthday: "", invitedBy: "", address: "" });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="fixed bottom-12 right-12 w-20 h-20 rounded-full bg-black text-white flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-90 transition-all z-50">
          <Plus size={36} weight="bold" />
        </button>
      </DialogTrigger>
      
      {/* GLASSMORPHISM CONFIGURATION:
          - bg-white/40: Subtle white tint
          - backdrop-blur-2xl: The "Frosted" effect
          - border-white/20: Soft highlight edge
      */}
      <DialogContent className="sm:max-w-[600px] rounded-[3rem] p-0 border border-white/20 bg-white/40 backdrop-blur-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] overflow-hidden outline-none">
        <div className="p-10">
          <Tabs defaultValue="existing" onValueChange={setMode} className="w-full">
            <div className="flex justify-between items-center mb-8">
              <header>
                <DialogTitle className="text-3xl font-black tracking-tight text-zinc-900">
                  {mode === "existing" ? "Add Member" : "New Convert"}
                </DialogTitle>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-1">Database Entry</p>
              </header>
              
              <TabsList className="bg-black/5 p-1 rounded-2xl backdrop-blur-md">
                <TabsTrigger value="existing" className="rounded-xl px-5 py-2 text-[10px] font-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all">EXISTING</TabsTrigger>
                <TabsTrigger value="new" className="rounded-xl px-5 py-2 text-[10px] font-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all">CONVERT</TabsTrigger>
              </TabsList>
            </div>

            <div className="space-y-6">
              {/* CORE IDENTITY BLOCK */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase ml-2 tracking-widest">Legal Identity</label>
                <Input 
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})} 
                  className="h-14 px-6 rounded-2xl border-none bg-white/50 focus:bg-white/80 transition-all text-base ring-offset-transparent focus-visible:ring-1 focus-visible:ring-black/10" 
                  placeholder="e.g. David Olatunji" 
                />
              </div>

              {/* DYNAMIC FORM GRID */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Cell Name</label>
                  <Input value={form.cell} onChange={(e) => setForm({...form, cell: e.target.value})} className="h-12 px-5 rounded-xl border-none bg-white/50 focus:bg-white/80 transition-all ring-offset-transparent focus-visible:ring-1 focus-visible:ring-black/10" placeholder="Zion" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Academic Level</label>
                  <Input value={form.level} onChange={(e) => setForm({...form, level: e.target.value})} className="h-12 px-5 rounded-xl border-none bg-white/50 focus:bg-white/80 transition-all ring-offset-transparent focus-visible:ring-1 focus-visible:ring-black/10" placeholder="500L" />
                </div>

                <TabsContent value="existing" className="m-0 col-span-2 grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Church Dept</label>
                    <Input value={form.churchDept} onChange={(e) => setForm({...form, churchDept: e.target.value})} className="h-12 px-5 rounded-xl border-none bg-white/50 focus:bg-white/80 transition-all ring-offset-transparent focus-visible:ring-1 focus-visible:ring-black/10" placeholder="Technical" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">School Dept</label>
                    <Input value={form.schoolDept} onChange={(e) => setForm({...form, schoolDept: e.target.value})} className="h-12 px-5 rounded-xl border-none bg-white/50 focus:bg-white/80 transition-all ring-offset-transparent focus-visible:ring-1 focus-visible:ring-black/10" placeholder="MET" />
                  </div>
                </TabsContent>

                <TabsContent value="new" className="m-0 col-span-2 grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Invited By</label>
                    <Input value={form.invitedBy} onChange={(e) => setForm({...form, invitedBy: e.target.value})} className="h-12 px-5 rounded-xl border-none bg-white/50 focus:bg-white/80 transition-all ring-offset-transparent focus-visible:ring-1 focus-visible:ring-black/10" placeholder="Member Name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Birthday</label>
                    <Input value={form.birthday} onChange={(e) => setForm({...form, birthday: e.target.value})} className="h-12 px-5 rounded-xl border-none bg-white/50 focus:bg-white/80 transition-all ring-offset-transparent focus-visible:ring-1 focus-visible:ring-black/10" placeholder="DD/MM" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Home Address</label>
                    <Input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="h-12 px-5 rounded-xl border-none bg-white/50 focus:bg-white/80 transition-all ring-offset-transparent focus-visible:ring-1 focus-visible:ring-black/10" placeholder="Full Location" />
                  </div>
                </TabsContent>
              </div>

              <Button onClick={handleSubmit} className="w-full h-16 rounded-[1.5rem] bg-black text-white hover:bg-zinc-800 text-lg font-black mt-4 shadow-xl active:scale-[0.97] transition-all border-none">
                {mode === "existing" ? "Confirm Entry" : "Register Convert"}
              </Button>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};