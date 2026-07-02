"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { ExistingForm, FirstTimerForm } from "./MemberForms";
import { SuccessCheck } from "./SuccessCheck";

interface AddMemberModalProps {
  onAdd: (data: any) => Promise<void> | void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
}

export const AddMemberModal = ({
  onAdd,
  isOpen,
  onOpenChange,
  initialData
}: AddMemberModalProps) => {
  const [mode, setMode] = useState("existing");
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  // Reported by the active form: true when it holds unsaved input.
  const [isDirty, setIsDirty] = useState(false);

  // Always land on the "existing" tab when (re)opening.
  useEffect(() => {
    setMode("existing");
  }, [initialData, isOpen]);

  // Explicit close (X). A half-filled form is only discarded on confirmation,
  // so a mis-tap can never wipe data. Outside-click / Esc are blocked below.
  const requestClose = () => {
    if (saving) return;
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
    onOpenChange(false);
  };

  const handleSuccess = async (formData: any) => {
    if (saving) return;
    setSaving(true);
    try {
      // Await the real save. The hook rejects on failure (and toasts the
      // reason), so the success animation only runs when the record persisted.
      await onAdd(formData);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onOpenChange(false);
      }, 1500);
    } catch {
      // Save failed — keep the modal open with the user's input intact.
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) requestClose(); }}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="w-[calc(100%-1.5rem)] sm:max-w-[850px] max-h-[92dvh] flex flex-col rounded-[2rem] sm:rounded-[3rem] p-0 border border-white/50 bg-white/25 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.25)] outline-none overflow-hidden [&>button]:hidden"
        >
          <VisuallyHidden.Root>
            <DialogTitle>
              {initialData ? "Edit Member" : mode === "existing" ? "Add Member" : "First-Timer Registration"}
            </DialogTitle>
          </VisuallyHidden.Root>

          <button
            onClick={requestClose}
            aria-label="Close"
            className="absolute top-5 right-5 sm:top-8 sm:right-8 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all z-[60]"
          >
            <X size={20} weight="bold" className="text-zinc-900" />
          </button>

          {/* Scrollable body so the submit button is always reachable on short viewports */}
          <div className="overflow-y-auto overscroll-contain p-6 sm:p-10 md:p-12">
            <Tabs value={mode} onValueChange={setMode} className="w-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 sm:mb-10 pr-12">
                <header>
                  <h2 className="text-2xl sm:text-4xl font-black tracking-tighter text-zinc-950">
                    {initialData ? "Update Info" : mode === "existing" ? "Add Member" : "First-Timer"}
                  </h2>
                  <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em] mt-1">
                    {initialData ? `Editing: ${initialData.name}` : "Central Registry"}
                  </p>
                </header>

                {!initialData && (
                  <TabsList className="bg-black/10 p-1.5 rounded-[1.5rem] backdrop-blur-xl border border-white/20 self-start sm:self-auto">
                    <TabsTrigger value="existing" className="rounded-xl px-4 sm:px-6 py-2 text-[10px] font-black data-[state=active]:bg-white data-[state=active]:text-black">EXISTING</TabsTrigger>
                    <TabsTrigger value="new" className="rounded-xl px-4 sm:px-6 py-2 text-[10px] font-black data-[state=active]:bg-white data-[state=active]:text-black">FIRST-TIMER</TabsTrigger>
                  </TabsList>
                )}
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
                    <ExistingForm onSubmit={handleSuccess} initialData={initialData} saving={saving} onDirtyChange={setIsDirty} />
                  ) : (
                    <FirstTimerForm onSubmit={handleSuccess} saving={saving} onDirtyChange={setIsDirty} />
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