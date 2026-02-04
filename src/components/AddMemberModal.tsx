"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, UserPlus, Sparkle } from "@phosphor-icons/react";
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
      
      <DialogContent className="modal-glass sm:max-w-[650px] rounded-[3.5rem] p-0 border-none overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.2)]">
        <div className="p-12">
          <Tabs defaultValue="existing" onValueChange={setMode} className="w-full">
            <div className="flex justify-between items-center mb-10">
              <header>
                <DialogTitle className="text-4xl font-black tracking-tighter">
                  {mode === "existing" ? "Add Member" : "New Convert"}
                </DialogTitle>
                <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.4em]">Database Entry</p>
              </header>
              
              <TabsList className="bg-black/5 p-1.5 rounded-[1.25rem]">
                <TabsTrigger value="existing" className="rounded-xl px-6 py-2 text-[10px] font-black data-[state=active]:bg-white data-[state=active]:shadow-sm">EXISTING</TabsTrigger>
                <TabsTrigger value="new" className="rounded-xl px-6 py-2 text-[10px] font-black data-[state=active]:bg-white data-[state=active]:shadow-sm">CONVERT</TabsTrigger>
              </TabsList>
            </div>

            <div className="space-y-8 mt-4">
              {/* CORE IDENTITY BLOCK */}
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-40 uppercase ml-2 tracking-widest">Legal Identity</label>
                  <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-glass h-16 px-6 text-lg" placeholder="e.g. David Olatunji" />
                </div>
              </div>

              {/* DYNAMIC FORM GRID */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-40 uppercase ml-2">Cell Name</label>
                  <Input value={form.cell} onChange={(e) => setForm({...form, cell: e.target.value})} className="input-glass h-14 px-6" placeholder="Zion" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-40 uppercase ml-2">Academic Level</label>
                  <Input value={form.level} onChange={(e) => setForm({...form, level: e.target.value})} className="input-glass h-14 px-6" placeholder="500L" />
                </div>

                <TabsContent value="existing" className="m-0 col-span-2 grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black opacity-40 uppercase ml-2">Church Dept</label>
                    <Input value={form.churchDept} onChange={(e) => setForm({...form, churchDept: e.target.value})} className="input-glass h-14 px-6" placeholder="Technical" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black opacity-40 uppercase ml-2">School Dept (e.g. MET)</label>
                    <Input value={form.schoolDept} onChange={(e) => setForm({...form, schoolDept: e.target.value})} className="input-glass h-14 px-6" placeholder="MET" />
                  </div>
                </TabsContent>

                <TabsContent value="new" className="m-0 col-span-2 grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black opacity-40 uppercase ml-2">Invited By</label>
                    <Input value={form.invitedBy} onChange={(e) => setForm({...form, invitedBy: e.target.value})} className="input-glass h-14 px-6" placeholder="Member Name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black opacity-40 uppercase ml-2">Birthday</label>
                    <Input value={form.birthday} onChange={(e) => setForm({...form, birthday: e.target.value})} className="input-glass h-14 px-6" placeholder="DD/MM" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black opacity-40 uppercase ml-2">Home Address</label>
                    <Input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="input-glass h-14 px-6" placeholder="Full Location" />
                  </div>
                </TabsContent>
              </div>

              <Button onClick={handleSubmit} className="w-full h-18 rounded-[2rem] bg-black text-white hover:bg-zinc-800 text-xl font-black mt-4 shadow-2xl active:scale-[0.98] transition-all">
                {mode === "existing" ? "Confirm Entry" : "Register Convert"}
              </Button>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};