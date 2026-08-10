"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  ShieldCheck,
  Eye,
  LockKey,
  CaretDown,
  Check,
  SignOut,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Identity = { kind: "marker"; name: string } | { kind: "exec" } | { kind: null };
type MarkerOption = { _id: string; name: string; active: boolean };

// Last identity the server confirmed. The session lives in an httpOnly cookie
// the client can't read, so this is how the app knows who you are while
// offline — without it a cold offline boot downgrades a signed-in marker to
// view-only and no attendance can be taken. Only an explicit signed-out answer
// from the server (or signing out) clears it; a network failure never does.
const IDENTITY_KEY = "eregister-identity";

function loadCachedIdentity(): Identity | null {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (!raw) return null;
    const id = JSON.parse(raw);
    return id?.kind ? (id as Identity) : null;
  } catch {
    return null;
  }
}

function saveCachedIdentity(identity: Identity): void {
  try {
    if (identity.kind) localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
    else localStorage.removeItem(IDENTITY_KEY);
  } catch {
    // storage unavailable — non-fatal
  }
}

export function MarkerBar({
  onIdentityChange,
}: {
  onIdentityChange: (canMark: boolean, name: string | null) => void;
}) {
  const [me, setMe] = useState<Identity>({ kind: null });
  const [markers, setMarkers] = useState<MarkerOption[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<MarkerOption | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const report = (identity: Identity) => {
    setMe(identity);
    onIdentityChange(identity.kind === "marker", identity.kind === "marker" ? identity.name : null);
  };

  useEffect(() => {
    // Cached identity first so a marker stays a marker on an offline boot;
    // the server answer then confirms or revokes it.
    const cached = loadCachedIdentity();
    if (cached) report(cached);

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: Identity) => {
        report(data);
        saveCachedIdentity(data);
      })
      .catch(() => {
        // Network unreachable — keep the cached identity; queued marks are
        // still auth-checked server-side when the outbox drains.
        if (!cached) report({ kind: null });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openSignIn = async () => {
    try {
      const res = await fetch("/api/markers");
      const data: MarkerOption[] = await res.json();
      setMarkers(data.filter((m) => m.active));
      setSelected(null);
      setPin("");
      setOpen(true);
    } catch {
      toast.error(
        navigator.onLine === false
          ? "You're offline — signing in needs a connection"
          : "Could not load markers"
      );
    }
  };

  const submit = async () => {
    if (!selected) return toast.error("Select your name");
    if (!/^\d{4,6}$/.test(pin)) return toast.error("Enter your 4–6 digit PIN");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/marker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markerId: selected._id, pin }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        toast.error(error || "Incorrect PIN");
        return;
      }
      const { name } = await res.json();
      report({ kind: "marker", name });
      saveCachedIdentity({ kind: "marker", name });
      toast.success(`Signed in — marking as ${name}`);
      setOpen(false);
    } catch {
      toast.error("Network error — try again");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      report({ kind: null });
      saveCachedIdentity({ kind: null });
      toast.info("Signed out — view only");
    }
  };

  const isMarker = me.kind === "marker";

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-between gap-4 px-5 py-4 rounded-3xl border shadow-sm transition-colors",
          isMarker
            ? "bg-emerald-50/70 border-emerald-200"
            : "bg-amber-50/70 border-amber-200"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center",
              isMarker ? "bg-emerald-500 text-white" : "bg-amber-400/90 text-white"
            )}
          >
            {isMarker ? <ShieldCheck size={22} weight="fill" /> : <Eye size={22} weight="duotone" />}
          </div>
          <div className="flex flex-col">
            <span
              className={cn(
                "text-[9px] font-black uppercase tracking-[0.35em]",
                isMarker ? "text-emerald-600" : "text-amber-600"
              )}
            >
              {isMarker ? "Marking as" : "View only"}
            </span>
            <span className="text-sm font-black tracking-tight text-stone-900">
              {isMarker ? me.name : "Guest — sign in to mark attendance"}
            </span>
          </div>
        </div>

        {isMarker ? (
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-700/70 hover:text-emerald-900 transition-colors"
          >
            <SignOut size={15} weight="bold" />
            Sign out
          </button>
        ) : (
          <button
            onClick={openSignIn}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-stone-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-black active:scale-95 transition-all shadow-lg"
          >
            <LockKey size={16} weight="bold" />
            Sign in to mark
          </button>
        )}
      </div>

      {/* Sign-in modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-[2.5rem] p-0 border border-white/50 bg-white/30 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.25)] outline-none overflow-visible [&>button]:hidden">
          <VisuallyHidden.Root>
            <DialogTitle>Marker Sign-in</DialogTitle>
          </VisuallyHidden.Root>

          <button
            onClick={() => setOpen(false)}
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all z-[60]"
          >
            <X size={18} weight="bold" className="text-zinc-900" />
          </button>

          <div className="p-9">
            <header className="mb-8">
              <h2 className="text-3xl font-black tracking-tighter text-zinc-950">Marker Sign-in</h2>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-1">
                Protocol Staff
              </p>
            </header>

            {/* Name picker */}
            <div className="space-y-1.5 relative mb-5">
              <label className="text-[11px] font-black text-zinc-950 uppercase ml-2 tracking-widest">
                Your Name
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPickerOpen((v) => !v)}
                  className="w-full h-12 px-5 rounded-2xl bg-white/50 text-left text-sm font-bold text-zinc-950 flex items-center justify-between shadow-inner"
                >
                  {selected ? selected.name : <span className="text-zinc-400">Select your name…</span>}
                  <CaretDown size={16} className="text-zinc-400" />
                </button>

                <AnimatePresence>
                  {pickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-2xl shadow-2xl z-[100] border border-zinc-100 py-2 max-h-[220px] overflow-y-auto"
                    >
                      {markers.length === 0 && (
                        <p className="px-5 py-3 text-xs font-bold text-zinc-400">
                          No markers registered yet
                        </p>
                      )}
                      {markers.map((m) => (
                        <button
                          key={m._id}
                          onClick={() => {
                            setSelected(m);
                            setPickerOpen(false);
                          }}
                          className="w-full px-5 py-3 text-left text-sm font-bold text-zinc-700 hover:bg-zinc-50 flex items-center justify-between"
                        >
                          {m.name}
                          {selected?._id === m._id && <Check weight="bold" className="text-emerald-500" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* PIN */}
            <div className="space-y-1.5 mb-8">
              <label className="text-[11px] font-black text-zinc-950 uppercase ml-2 tracking-widest">
                PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="••••"
                className="w-full h-12 px-5 rounded-2xl bg-white/50 text-center text-lg tracking-[0.5em] font-black text-zinc-950 shadow-inner outline-none focus:bg-white/80 transition-all placeholder:tracking-normal"
              />
            </div>

            <button
              onClick={submit}
              disabled={loading}
              className="w-full h-14 rounded-full bg-zinc-950 text-white hover:bg-black text-base font-black shadow-2xl transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Verifying…" : "Unlock Marking"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
