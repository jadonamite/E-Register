"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WarningCircle, Question } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type InputSpec = {
  label?: string;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "numeric";
  defaultValue?: string;
  /** Return an error message to block, or null to allow. */
  validate?: (value: string) => string | null;
};

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "default" | "danger";
  /** When set, the modal collects a value (prompt) and resolves to the string. */
  input?: InputSpec;
};

/** Resolves to `true`/`false` for a confirm, or the string / `null` for a prompt. */
type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean | string | null>;

const ConfirmCtx = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const resolverRef = useRef<((r: boolean | string | null) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((o) => {
    setOpts(o);
    setValue(o.input?.defaultValue ?? "");
    setError(null);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = (result: boolean | string | null) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOpts(null);
  };

  const onConfirm = () => {
    if (opts?.input) {
      const err = opts.input.validate?.(value) ?? null;
      if (err) return setError(err);
      settle(value);
    } else {
      settle(true);
    }
  };

  const onCancel = () => settle(opts?.input ? null : false);

  const danger = opts?.tone === "danger";

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}

      <Dialog open={!!opts} onOpenChange={(o) => { if (!o) onCancel(); }}>
        <DialogContent className="sm:max-w-[420px] rounded-[2rem] p-0 border border-white/50 bg-white/80 backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,0.25)] [&>button]:hidden overflow-hidden">
          <VisuallyHidden.Root>
            <DialogTitle>{opts?.title ?? "Confirm"}</DialogTitle>
          </VisuallyHidden.Root>

          <div className="p-8">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0",
                  danger ? "bg-red-100 text-red-600" : "bg-zinc-900 text-white"
                )}
              >
                {danger ? <WarningCircle size={22} weight="fill" /> : <Question size={22} weight="fill" />}
              </div>
              <div className="flex-1 pt-0.5">
                <h2 className="text-xl font-black tracking-tight text-zinc-950">{opts?.title}</h2>
                {opts?.message && (
                  <p className="text-sm font-medium text-zinc-500 mt-1 leading-relaxed">{opts.message}</p>
                )}
              </div>
            </div>

            {opts?.input && (
              <div className="mt-5 space-y-1.5">
                {opts.input.label && (
                  <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">
                    {opts.input.label}
                  </label>
                )}
                <Input
                  autoFocus
                  type={opts.input.type ?? "text"}
                  inputMode={opts.input.inputMode}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && onConfirm()}
                  placeholder={opts.input.placeholder}
                  className="h-12 rounded-2xl border-zinc-200 bg-white text-sm font-semibold shadow-sm focus-visible:border-zinc-900 focus-visible:ring-4 focus-visible:ring-zinc-100 px-4"
                />
                {error && <p className="text-xs font-bold text-red-500 ml-1">{error}</p>}
              </div>
            )}

            <div className="flex gap-3 mt-7">
              <Button
                onClick={onCancel}
                className="flex-1 h-12 rounded-2xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 text-xs font-black uppercase tracking-widest shadow-none"
              >
                {opts?.cancelText ?? "Cancel"}
              </Button>
              <Button
                onClick={onConfirm}
                className={cn(
                  "flex-1 h-12 rounded-2xl text-xs font-black uppercase tracking-widest text-white",
                  danger ? "bg-red-500 hover:bg-red-600" : "bg-zinc-950 hover:bg-black"
                )}
              >
                {opts?.confirmText ?? "Confirm"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmCtx.Provider>
  );
}
