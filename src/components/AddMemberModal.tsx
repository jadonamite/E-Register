"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Plus, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { ExistingForm, FirstTimerForm } from "./MemberForms";
import { SuccessCheck } from "./SuccessCheck";

export const AddMemberModal = ({ onAdd }: { onAdd: (data: any) => void }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("existing");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = (formData: any) => {
    // FIX: Provide empty string defaults so .toLowerCase() doesn't crash your hook
    const safeData = {
      name: "",
      cell: "",
      role: "Member",
      ...formData,
      id: Date.now(),
    };
    
    onAdd(safeData);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setOpen(false);
    }, 1500);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="fixed bottom-12 right-12 w-20 h-20 rounded-full bg-black text-white flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-90 transition-all z-50">
            <Plus size={36} weight="bold" />
          </button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[850px] rounded-[3rem] p-0 border border-white/50 bg-white/25 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.25)] outline-none overflow-hidden [&>button]:hidden">
          
          <VisuallyHidden.Root>
            <DialogTitle>{mode === "existing" ? "Add Member" : "First-Timer Registration"}</DialogTitle>
          </VisuallyHidden.Root>

          {/* CUSTOM X BUTTON - BACK AND STYLED */}
          <button 
            onClick={() => setOpen(false)}
            className="absolute top-8 right-8 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all z-[60]"
          >
            <X size={20} weight="bold" className="text-zinc-900" />
          </button>

          <div className="p-12">
            <Tabs defaultValue="existing" onValueChange={setMode} className="w-full">
              <div className="flex justify-between items-center mb-10 pr-10">
                <header>
                  <h2 className="text-4xl font-black tracking-tighter text-zinc-950">
                    {mode === "existing" ? "Add Member" : "First-Timer"}
                  </h2>
                  <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em] mt-1">Central Registry</p>
                </header>

                <TabsList className="bg-black/10 p-1.5 rounded-[1.5rem] backdrop-blur-xl border border-white/20">
                  <TabsTrigger value="existing" className="rounded-xl px-6 py-2 text-[10px] font-black data-[state=active]:bg-white data-[state=active]:text-black">EXISTING</TabsTrigger>
                  <TabsTrigger value="new" className="rounded-xl px-6 py-2 text-[10px] font-black data-[state=active]:bg-white data-[state=active]:text-black">FIRST-TIMER</TabsTrigger>
                </TabsList>
              </div>

              <AnimatePresence mode="wait">
                <motion.div 
                  key={mode}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  {mode === "existing" ? (
                    <ExistingForm onSubmit={handleSuccess} />
                  ) : (
                    <FirstTimerForm onSubmit={handleSuccess} />
                  )}
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {showSuccess && <SuccessCheck />}
      </AnimatePresence>
    </>
  );
};