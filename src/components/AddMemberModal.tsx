"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, UserGear, Sparkle } from "@phosphor-icons/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const AddMemberModal = ({ onAdd }: { onAdd: (data: any) => void }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("existing");
  const [form, setForm] = useState({
    name: "", cell: "", schoolDept: "", churchDept: "", 
    role: "Base Member", birthday: "", invitedBy: "", address: ""
  });

  const handleSubmit = () => {
    if (form.name && form.cell) {
      onAdd({ ...form, id: Date.now() });
      setForm({ name: "", cell: "", schoolDept: "", churchDept: "", role: "Base Member", birthday: "", invitedBy: "", address: "" });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="fixed bottom-12 right-12 w-20 h-20 rounded-full bg-black text-white flex items-center justify-center shadow-3xl hover:scale-110 hover:rotate-90 transition-all z-50">
          <Plus size={36} weight="bold" />
        </button>
      </DialogTrigger>
      
      <DialogContent className="modal-glass sm:max-w-[600px] rounded-[3rem] p-0 border-none overflow-hidden">
        <div className="p-10">
          <Tabs defaultValue="existing" onValueChange={setMode} className="w-full">
            <div className="flex justify-between items-end mb-8">
              <DialogHeader>
                <DialogTitle className="text-4xl font-black tracking-tighter">
                  {mode === "existing" ? "Add Member" : "New Convert"}
                </DialogTitle>
                <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.3em]">Database Entry</p>
              </DialogHeader>
              
              <TabsList className="bg-black/5 p-1 rounded-2xl h-12">
                <TabsTrigger value="existing" className="rounded-xl px-5 text-[10px] font-black data-[state=active]:bg-white data-[state=active]:shadow-sm">EXISTING</TabsTrigger>
                <TabsTrigger value="new" className="rounded-xl px-5 text-[10px] font-black data-[state=active]:bg-white data-[state=active]:shadow-sm">CONVERT</TabsTrigger>
              </TabsList>
            </div>

            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold opacity-40 uppercase ml-1">Full Legal Name</label>
                  <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-glass h-14" placeholder="e.g. David Olatunji" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold opacity-40 uppercase ml-1">Cell Name</label>
                  <Input value={form.cell} onChange={(e) => setForm({...form, cell: e.target.value})} className="input-glass h-14" placeholder="Zion" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold opacity-40 uppercase ml-1">School Dept (e.g. MET)</label>
                  <Input value={form.schoolDept} onChange={(e) => setForm({...form, schoolDept: e.target.value})} className="input-glass h-14" placeholder="MET" />
                </div>
              </div>

              <TabsContent value="existing" className="m-0 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold opacity-40 uppercase ml-1">Church Dept</label>
                      <Input value={form.churchDept} onChange={(e) => setForm({...form, churchDept: e.target.value})} className="input-glass h-14" placeholder="Technical" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold opacity-40 uppercase ml-1">Role</label>
                      <Input value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="input-glass h-14" placeholder="Base Member" />
                    </div>
                 </div>
              </TabsContent>

              <TabsContent value="new" className="m-0 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold opacity-40 uppercase ml-1">Birthday</label>
                    <Input value={form.birthday} onChange={(e) => setForm({...form, birthday: e.target.value})} className="input-glass h-14" placeholder="DD/MM" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold opacity-40 uppercase ml-1">Invited By</label>
                    <Input value={form.invitedBy} onChange={(e) => setForm({...form, invitedBy: e.target.value})} className="input-glass h-14" placeholder="Member Name" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-bold opacity-40 uppercase ml-1">Address</label>
                    <Input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="input-glass h-14" placeholder="Full Home Address" />
                  </div>
                </div>
              </TabsContent>

              <Button onClick={handleSubmit} className="w-full h-16 rounded-[1.5rem] bg-black text-white hover:bg-zinc-800 text-lg font-black mt-4 shadow-2xl active:scale-[0.98] transition-all">
                {mode === "existing" ? "Add to Database" : "Welcome New Convert"}
              </Button>
            </div>
          </Tabs>
        </div>
    </DialogContent>
    </Dialog>
  );
};