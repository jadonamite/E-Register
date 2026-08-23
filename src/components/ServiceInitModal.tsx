"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { toast } from "sonner";
import { CaretRight, X } from "@phosphor-icons/react";
import { DEFAULT_SUNDAY_TEMPLATE, type SundaySession } from "@/lib/service-schedule";

type TeamRow = { team: "PS" | "BG"; enabled: boolean; start: string; end: string };

function templateToRows(session: SundaySession | null): TeamRow[] {
  const source = session?.mode === "separate" ? session.windows : DEFAULT_SUNDAY_TEMPLATE.windows;
  const byTeam = new Map(source.filter((w) => w.team !== "ALL").map((w) => [w.team, w]));
  return (["PS", "BG"] as const).map((team) => {
    const w = byTeam.get(team);
    return {
      team,
      enabled: !!w,
      start: w?.start ?? (team === "PS" ? "07:30" : "10:00"),
      end: w?.end ?? "",
    };
  });
}

/** A drag-right-to-confirm pill, matching the app's "slide to update" control. */
function SlideToConfirm({
  label,
  busy,
  onConfirm,
}: {
  label: string;
  busy: boolean;
  onConfirm: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [maxX, setMaxX] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const measure = () => {
      if (trackRef.current) setMaxX(trackRef.current.clientWidth - 56);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!busy) {
      setDone(false);
      animate(x, 0, { type: "spring", stiffness: 400, damping: 40 });
    }
  }, [busy, x]);

  return (
    <div
      ref={trackRef}
      className="relative w-full h-16 rounded-full bg-zinc-100 shadow-inner overflow-hidden select-none"
    >
      <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-zinc-500 tracking-tight pointer-events-none">
        {busy ? "Saving…" : label}
      </span>
      <motion.div
        drag={busy ? false : "x"}
        dragConstraints={{ left: 0, right: maxX }}
        dragElastic={0.05}
        style={{ x }}
        onDragEnd={() => {
          if (x.get() > maxX * 0.7) {
            setDone(true);
            animate(x, maxX, { type: "spring", stiffness: 500, damping: 40 });
            onConfirm();
          } else {
            animate(x, 0, { type: "spring", stiffness: 400, damping: 40 });
          }
        }}
        className={`absolute top-1 left-1 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg cursor-grab active:cursor-grabbing transition-colors ${
          done ? "bg-emerald-500" : "bg-zinc-950"
        }`}
      >
        <CaretRight size={22} weight="bold" />
      </motion.div>
    </div>
  );
}

export function ServiceInitModal({
  isoDate,
  existingSession,
  onSaved,
  canInitialize,
  onDismiss,
}: {
  isoDate: string;
  existingSession: SundaySession | null;
  onSaved: (session: SundaySession) => void;
  canInitialize: boolean;
  onDismiss?: () => void;
}) {
  const isEdit = !!existingSession;
  const [mode, setMode] = useState<"combined" | "separate">(existingSession?.mode ?? "separate");
  const [rows, setRows] = useState<TeamRow[]>(() => templateToRows(existingSession));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMode(existingSession?.mode ?? "separate");
    setRows(templateToRows(existingSession));
  }, [isoDate, existingSession]);

  const submit = async () => {
    const windows =
      mode === "combined"
        ? [{ team: "ALL", start: "07:30", end: null }]
        : rows
            .filter((r) => r.enabled)
            .map((r) => ({ team: r.team, start: r.start, end: r.end.trim() || null }));

    if (mode === "separate" && windows.length === 0) {
      toast.error("Enable at least one team");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/service-sessions", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: isoDate, mode, windows }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to save the service setup");
        return;
      }
      onSaved(data.session);
      toast.success(isEdit ? "Service updated" : "Service initialized");
    } catch {
      toast.error("Network error — try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="w-full sm:max-w-[480px] max-h-[88vh] overflow-y-auto bg-[#FDFBFC] rounded-t-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.3)] pb-8"
      >
        <div className="sticky top-0 bg-[#FDFBFC] pt-3 pb-2 rounded-t-[2.5rem]">
          <div className="w-10 h-1.5 bg-zinc-300 rounded-full mx-auto" />
          {isEdit && onDismiss && (
            <button
              onClick={onDismiss}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all"
            >
              <X size={18} weight="bold" className="text-zinc-900" />
            </button>
          )}
        </div>

        <div className="px-8 pt-4">
          <header className="mb-8">
            <h2 className="text-4xl font-black tracking-tighter text-zinc-950">
              {isEdit ? "Edit Sunday Setup" : "Set Up This Sunday"}
            </h2>
            <p className="text-sm font-bold text-zinc-500 mt-2">Combined or separate service</p>
          </header>

          {!canInitialize ? (
            <p className="text-sm font-bold text-zinc-500 text-center py-6">
              Sign in as a marker first to set up this Sunday's service.
            </p>
          ) : (
            <>
              <div className="bg-zinc-100 p-1.5 rounded-xl flex gap-1 mb-6">
                {(["separate", "combined"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      mode === m ? "bg-white text-black shadow-sm" : "text-stone-400 hover:text-stone-600"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {mode === "separate" && (
                <div className="space-y-4 mb-8">
                  {rows.map((row, i) => (
                    <div
                      key={row.team}
                      className={`p-4 rounded-2xl border transition-all ${
                        row.enabled ? "bg-white border-zinc-200" : "bg-zinc-50 border-zinc-100 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-2 text-sm font-black text-zinc-900">
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((r, idx) => (idx === i ? { ...r, enabled: e.target.checked } : r))
                              )
                            }
                          />
                          {row.team === "PS" ? "Pace Setters" : "Boundless Grace"}
                        </label>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                          {row.team}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={row.start}
                          disabled={!row.enabled}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r, idx) => (idx === i ? { ...r, start: e.target.value } : r))
                            )
                          }
                          className="flex-1 h-10 px-3 rounded-xl bg-zinc-50 text-sm font-bold text-zinc-900 shadow-inner outline-none"
                        />
                        <span className="text-xs font-bold text-zinc-400">to</span>
                        <input
                          type="time"
                          value={row.end}
                          disabled={!row.enabled}
                          placeholder="end"
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r, idx) => (idx === i ? { ...r, end: e.target.value } : r))
                            )
                          }
                          className="flex-1 h-10 px-3 rounded-xl bg-zinc-50 text-sm font-bold text-zinc-900 shadow-inner outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <SlideToConfirm
                label={isEdit ? "Slide to save changes" : "Slide to start service"}
                busy={saving}
                onConfirm={submit}
              />

              <p className="text-center text-[10px] font-bold text-zinc-300 uppercase tracking-[0.3em] mt-6">
                {isoDate}
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function ServiceSummaryStrip({
  session,
  onEdit,
}: {
  session: SundaySession;
  onEdit: () => void;
}) {
  const label =
    session.mode === "combined"
      ? "Combined service"
      : session.windows
          .map((w) => `${w.team} ${w.start}–${w.end ?? "end"}`)
          .join(" · ");

  return (
    <div className="mb-6 flex items-center justify-between gap-3 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        <p className="text-xs font-bold text-emerald-800 tracking-tight">{label}</p>
      </div>
      <button
        onClick={onEdit}
        className="text-[10px] font-black uppercase tracking-widest text-emerald-700/70 hover:text-emerald-900 transition-colors"
      >
        Edit
      </button>
    </div>
  );
}
