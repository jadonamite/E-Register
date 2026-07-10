"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, X, UserPlus } from "@phosphor-icons/react";
import type { RosterRow } from "@/hooks/use-program-roster";

const TAG_STYLE: Record<string, string> = {
  Member: "bg-pink-100/60 text-pink-600 border-pink-200/60",
  Invitee: "bg-sky-100 text-sky-700 border-sky-200",
  "Walk-in": "bg-violet-100 text-violet-700 border-violet-200",
};

interface Props {
  rows: RosterRow[];
  canMark: boolean;
  loading: boolean;
  memberNames?: string[];
  onMark: (row: RosterRow) => void;
  onAddWalkin: (name: string, phone: string, invitedBy?: string) => Promise<void>;
}

export function ProgramList({ rows, canMark, loading, memberNames = [], onMark, onAddWalkin }: Props) {
  const [showWalkin, setShowWalkin] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [invitedBy, setInvitedBy] = useState("");
  const [saving, setSaving] = useState(false);

  const submitWalkin = async () => {
    setSaving(true);
    try {
      await onAddWalkin(name.trim(), phone.trim(), invitedBy.trim() || undefined);
      setName("");
      setPhone("");
      setInvitedBy("");
      setShowWalkin(false);
    } catch {
      // toast surfaced by the hook
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {canMark && (
        <div>
          {showWalkin ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-4 bg-white border border-zinc-200 rounded-[1.75rem]">
              <input
                autoFocus
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-w-0 w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-stone-400"
              />
              <input
                placeholder="Phone (0801…)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="min-w-0 w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-stone-400"
              />
              <input
                list="member-invite-names"
                placeholder="Invited by (optional)"
                value={invitedBy}
                onChange={(e) => setInvitedBy(e.target.value)}
                className="min-w-0 w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-stone-400"
              />
              <datalist id="member-invite-names">
                {memberNames.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
              <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                <button
                  onClick={submitWalkin}
                  disabled={saving || name.trim().length < 2 || phone.trim().length < 10}
                  className="flex-1 px-5 py-3 rounded-xl bg-stone-900 text-white text-[11px] font-black uppercase tracking-wider disabled:opacity-40"
                >
                  {saving ? "Adding…" : "Check in"}
                </button>
                <button
                  onClick={() => setShowWalkin(false)}
                  className="w-11 rounded-xl bg-zinc-100 text-zinc-500 flex items-center justify-center shrink-0"
                >
                  <X weight="bold" size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowWalkin(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-black uppercase tracking-wider hover:bg-violet-100 transition-all"
            >
              <UserPlus weight="bold" size={16} /> Add walk-in
            </button>
          )}
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {rows.map((row) => (
          <motion.div
            key={row.phone}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-between gap-3 p-4 sm:p-5 bg-white/60 border border-zinc-100 rounded-[1.75rem] sm:rounded-[2rem] hover:border-zinc-300 hover:bg-white transition-all shadow-sm"
          >
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <h3 className="font-bold text-stone-900 tracking-tight break-words">{row.name}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                    TAG_STYLE[row.tag] || "bg-zinc-100 text-zinc-500 border-zinc-200"
                  }`}
                >
                  {row.tag}
                </span>
                <span className="px-2 py-0.5 bg-zinc-100 rounded-md text-[9px] font-black uppercase tracking-widest text-zinc-500 border border-zinc-200">
                  {row.cell}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 tracking-tight">{row.phone}</span>
                {row.invitedBy && (
                  <span className="text-[10px] font-bold text-zinc-400 tracking-tight">
                    · invited by {row.invitedBy}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => canMark && onMark(row)}
              disabled={!canMark}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm shrink-0 ${
                !canMark
                  ? "bg-zinc-100 text-zinc-300 cursor-not-allowed"
                  : row.present
                  ? "bg-emerald-500 text-white shadow-emerald-100 hover:bg-red-500"
                  : "bg-zinc-100 text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              {row.present ? <Check weight="bold" size={20} /> : <Plus weight="bold" size={18} />}
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {!loading && rows.length === 0 && (
        <div className="text-center py-20 opacity-20">
          <p className="text-sm font-black uppercase tracking-[0.3em]">No one here yet</p>
        </div>
      )}
    </div>
  );
}
