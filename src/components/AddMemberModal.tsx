"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExistingForm, FirstTimerForm } from "@/components/MemberForms";
import { SuccessCheck } from "@/components/SuccessCheck";

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

        <DialogContent className="sm:max-w-[850px] rounded-[3.5rem] p-0 border border-white/40 bg-white/20 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.2)] outline-none overflow-hidden">
          {/* Custom Close Button - Properly Placed */}
          <button 
            onClick={() => setOpen(false)}
            className="absolute top-8 right-8 p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors z-[60]"
          >
            <X size={20} weight="bold" />
          </button>

          <div className="p-10">
            <Tabs defaultValue="existing" onValueChange={setMode} className="w-full">
              <div className="flex justify-between items-center mb-10 pr-12">
                <header>
                  <h2 className="text-4xl font-black tracking-tighter text-zinc-900">
                    {mode === "existing" ? "Add Member" : "First-Timer"}
                  </h2>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Central Registry</p>
                </header>

                <TabsList className="bg-black/10 p-1.5 rounded-[1.5rem] backdrop-blur-xl border border-white/20">
                  <TabsTrigger value="existing" className="rounded-xl px-6 py-2 text-[10px] font-black data-[state=active]:bg-white data-[state=active]:shadow-xl transition-all">EXISTING</TabsTrigger>
                  <TabsTrigger value="new" className="rounded-xl px-6 py-2 text-[10px] font-black data-[state=active]:bg-white data-[state=active]:shadow-xl transition-all">FIRST-TIMER</TabsTrigger>
                </TabsList>
              </div>

              {/* Animated Content Wrapper */}
              <motion.div 
                layout 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {mode === "existing" ? (
                  <ExistingForm onSubmit={handleSuccess} />
                ) : (
                  <FirstTimerForm onSubmit={handleSuccess} />
                )}
              </motion.div>
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