"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, UserPlus, Users } from "@phosphor-icons/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const AddMemberModal = ({ onAdd }: { onAdd: (data: any) => void }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("existing");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="fixed bottom-12 right-12 w-20 h-20 rounded-full bg-black text-white flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-90 transition-all z-50">
          <Plus size={36} weight="bold" />
        </button>
      </DialogTrigger>
      
      {/* VIBRANT GLASS CONFIG:
          - bg-white/20: Much more transparent
          - backdrop-blur-3xl: Maximum frost effect
          - border-white/40: Brighter "edge" light
      */}
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto rounded-[3.5rem] p-0 border border-white/40 bg-white/20 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.2)] outline-none scrollbar-hide">
        <div className="p-10">
          <Tabs defaultValue="existing" onValueChange={setMode} className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <header>
                <div className="flex items-center gap-3 mb-1">
                  {mode === "existing" ? <Users size={24} weight="duotone" /> : <UserPlus size={24} weight="duotone" className="text-blue-600" />}
                  <DialogTitle className="text-4xl font-black tracking-tighter text-zinc-900">
                    {mode === "existing" ? "Add Member" : "First-Timer"}
                  </DialogTitle>
                </div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] ml-1">Central Registry</p>
              </header>
              
              <TabsList className="bg-black/10 p-1.5 rounded-[1.5rem] backdrop-blur-xl">
                <TabsTrigger value="existing" className="rounded-xl px-8 py-2.5 text-[10px] font-black data-[state=active]:bg-white data-[state=active]:text-black transition-all">EXISTING</TabsTrigger>
                <TabsTrigger value="new" className="rounded-xl px-8 py-2.5 text-[10px] font-black data-[state=active]:bg-white data-[state=active]:text-black transition-all">FIRST-TIMER</TabsTrigger>
              </TabsList>
            </div>

            <div className="space-y-8">
              {/* SHARED FIELDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-full">
                  <label className="text-[11px] font-black text-zinc-500 uppercase ml-2 tracking-widest">Full Names</label>
                  <Input className="h-16 px-6 rounded-2xl border-none bg-white/40 focus:bg-white/70 transition-all text-lg ring-0 focus-visible:ring-2 focus-visible:ring-white/50" placeholder="Daniel Chinyere..." />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-zinc-500 uppercase ml-2">Sex</label>
                  <Input className="h-14 px-6 rounded-2xl border-none bg-white/40 focus:bg-white/70 transition-all ring-0 focus-visible:ring-2 focus-visible:ring-white/50" placeholder="Male / Female" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-zinc-500 uppercase ml-2">Mobile Number</label>
                  <Input className="h-14 px-6 rounded-2xl border-none bg-white/40 focus:bg-white/70 transition-all ring-0 focus-visible:ring-2 focus-visible:ring-white/50" placeholder="+234..." />
                </div>
              </div>

              {/* DYNAMIC CONTENT */}
              <TabsContent value="existing" className="m-0 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-zinc-500 uppercase ml-2">School Dept</label>
                    <Input className="h-14 px-6 rounded-2xl border-none bg-white/40" placeholder="e.g. MET" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-zinc-500 uppercase ml-2">Level</label>
                    <Input className="h-14 px-6 rounded-2xl border-none bg-white/40" placeholder="500L" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="new" className="m-0 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-zinc-500 uppercase ml-2">Birthday</label>
                    <Input className="h-14 px-6 rounded-2xl border-none bg-white/40" placeholder="DD/MM" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-zinc-500 uppercase ml-2">Email Address</label>
                    <Input className="h-14 px-6 rounded-2xl border-none bg-white/40" placeholder="name@mail.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-zinc-500 uppercase ml-2">Invited By</label>
                    <Input className="h-14 px-6 rounded-2xl border-none bg-white/40" placeholder="Who brought you?" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-zinc-500 uppercase ml-2">Join a Dept?</label>
                    <Input className="h-14 px-6 rounded-2xl border-none bg-white/40" placeholder="Which one?" />
                  </div>
                  <div className="space-y-2 col-span-full">
                    <label className="text-[11px] font-black text-zinc-500 uppercase ml-2">Address in School</label>
                    <Input className="h-14 px-6 rounded-2xl border-none bg-white/40" placeholder="Hostel or Area name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-zinc-500 uppercase ml-2 tracking-tighter">Become a Member?</label>
                    <Input className="h-14 px-6 rounded-2xl border-none bg-white/40" placeholder="Yes / No / Maybe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-zinc-500 uppercase ml-2 tracking-tighter">Visitation Date</label>
                    <Input className="h-14 px-6 rounded-2xl border-none bg-white/40" placeholder="When can we come?" />
                  </div>
                </div>
              </TabsContent>

              <Button className="w-full h-20 rounded-[2rem] bg-black text-white hover:bg-zinc-900 text-xl font-black mt-6 shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-[0.96] transition-all flex gap-3">
                {mode === "existing" ? "Add to Database" : "Welcome First-Timer"}
              </Button>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};