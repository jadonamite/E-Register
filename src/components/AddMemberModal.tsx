"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { ExistingForm, FirstTimerForm } from "./MemberForms";
import { SuccessCheck } from "./SuccessCheck";

export const AddMemberModal = ({ onAdd }: { onAdd: (data: any) => void }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("existing");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = (data: any) => {
    onAdd(data);
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

        {/* Added [&>button]:hidden to remove the default Shadcn X if you want to keep your custom one, 
            OR just let Shadcn handle it. I've removed your custom one below for stability. */}
        <DialogContent className="sm:max-w-[850px] rounded-[3.5rem] p-0 border border-white/40 bg-white/10 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.2)] outline-none overflow-hidden transition-all duration-500">
          
          <VisuallyHidden.Root>
            <DialogTitle>{mode === "existing" ? "Add Member" : "First-Timer Registration"}</DialogTitle>
          </VisuallyHidden.Root>

          <div className="p-10">
            <Tabs defaultValue="existing" onValueChange={setMode} className="w-full">
              <div className="flex justify-between items-center mb-10 pr-6">
                <header>
                  <h2 className="text-4xl font-black tracking-tighter text-zinc-950">
                    {mode === "existing" ? "Add Member" : "First-Timer"}
                  </h2>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-1">Central Registry</p>
                </header>

                <TabsList className="bg-black/10 p-1.5 rounded-[1.5rem] backdrop-blur-xl border border-white/20">
                  <TabsTrigger value="existing" className="rounded-xl px-6 py-2 text-[10px] font-black data-[state=active]:bg-white data-[state=active]:text-black transition-all">EXISTING</TabsTrigger>
                  <TabsTrigger value="new" className="rounded-xl px-6 py-2 text-[10px] font-black data-[state=active]:bg-white data-[state=active]:text-black transition-all">FIRST-TIMER</TabsTrigger>
                </TabsList>
              </div>

              <AnimatePresence mode="wait">
                <motion.div 
                  key={mode}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
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