"use client";

import { CloudCheck, CloudSlash, CloudArrowUp, WifiSlash } from "@phosphor-icons/react";

interface SyncPillProps {
  online: boolean;
  pending: number;
  syncing: boolean;
  authExpired: boolean;
  onSync: () => void;
}

// Connectivity + pending-sync indicator for the attendance page. Flat styling
// to match the intelly palette; tap to force a sync when marks are queued.
export function SyncPill({ online, pending, syncing, authExpired, onSync }: SyncPillProps) {
  let tone: string;
  let Icon = CloudCheck;
  let label: string;

  if (authExpired) {
    tone = "bg-rose-50 text-rose-700 border-rose-200";
    Icon = CloudSlash;
    label = "Sign in to sync";
  } else if (!online) {
    tone = "bg-amber-50 text-amber-800 border-amber-200";
    Icon = WifiSlash;
    label = pending > 0 ? `Offline · ${pending} pending` : "Offline";
  } else if (syncing) {
    tone = "bg-sky-50 text-sky-700 border-sky-200";
    Icon = CloudArrowUp;
    label = "Syncing…";
  } else if (pending > 0) {
    tone = "bg-sky-50 text-sky-700 border-sky-200";
    Icon = CloudArrowUp;
    label = `${pending} pending`;
  } else {
    tone = "bg-emerald-50 text-emerald-700 border-emerald-200";
    Icon = CloudCheck;
    label = "Synced";
  }

  const clickable = pending > 0 && online && !syncing;

  return (
    <button
      type="button"
      onClick={clickable ? onSync : undefined}
      disabled={!clickable}
      title={clickable ? "Sync now" : label}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${tone} ${
        clickable ? "cursor-pointer hover:brightness-95" : "cursor-default"
      }`}
    >
      <Icon size={16} weight="fill" className={syncing ? "animate-pulse" : ""} />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
