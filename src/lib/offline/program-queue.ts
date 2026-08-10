// Durable outbound queue for program attendance writes.
//
// Same design as the member attendance queue: every mark is recorded in
// IndexedDB *before* hitting the network, so a dropped signal, reload, or
// locked phone never loses a check-in. Replaying is safe because the program
// attendance API is idempotent — POST upserts on (programId, phone, day) and
// DELETE removes the same key. A walk-in is just a queued mark carrying its
// own name/invitedBy; the POST doubles as creation, so no temp-id remapping.

import {
  OutboxOp,
  ProgramOutboxItem,
  allProgramOutbox,
  deleteProgramOutbox,
  getProgramOutboxItem,
  putProgramOutbox,
} from "./db";

/** Same normalisation the server applies, so queue keys and the cached roster
 *  dedupe against each other (+234… and 0… are the same person). */
export function normPhone(p: unknown): string {
  if (typeof p !== "string") return "";
  return p.replace(/\s/g, "").replace(/^\+234/, "0");
}

/** Mirrors the server's phone validation. Anything failing this would come
 *  back as a 400 at drain time and be silently dropped — reject it up front. */
export function isValidPhone(p: string): boolean {
  return /^0\d{10}$/.test(normPhone(p));
}

export function programOutboxId(programId: string, phone: string, dateStr: string): string {
  return `${programId}|${normPhone(phone)}|${dateStr}`;
}

export interface ProgramToggleRequest {
  programId: string;
  phone: string;
  dateStr: string;
  dateISO: string;
  desiredOp: OutboxOp;
  name: string;
  source: "member" | "contact" | "walkin";
  memberId?: string;
  contactId?: string;
  invitedBy?: string;
}

/**
 * Record a toggle in the outbox with collapse semantics. A pending item and its
 * opposite cancel out (back to the server's base state); a repeat is a no-op.
 * Returns the resulting item, or null when it collapsed to nothing.
 */
export async function queueProgramToggle(req: ProgramToggleRequest): Promise<ProgramOutboxItem | null> {
  const phone = normPhone(req.phone);
  const id = programOutboxId(req.programId, phone, req.dateStr);
  const existing = await getProgramOutboxItem(id);

  if (existing) {
    if (existing.op === req.desiredOp) return existing; // already queued
    await deleteProgramOutbox(id); // opposite toggle → cancels back to base
    return null;
  }

  const item: ProgramOutboxItem = {
    id,
    op: req.desiredOp,
    programId: req.programId,
    phone,
    dateStr: req.dateStr,
    dateISO: req.dateISO,
    name: req.name,
    source: req.source,
    memberId: req.memberId,
    contactId: req.contactId,
    invitedBy: req.invitedBy,
    createdAt: Date.now(),
  };
  await putProgramOutbox(item);
  return item;
}

async function sendItem(item: ProgramOutboxItem): Promise<Response> {
  return fetch("/api/program-attendance", {
    method: item.op === "mark" ? "POST" : "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      programId: item.programId,
      date: item.dateISO,
      phone: item.phone,
      name: item.name,
      source: item.source,
      memberId: item.memberId,
      contactId: item.contactId,
      invitedBy: item.invitedBy,
    }),
  });
}

export interface ProgramDrainResult {
  synced: number;
  remaining: number;
  authExpired: boolean;
}

/**
 * Replay every queued write in order. Stops early on an expired marker session
 * (401/403 — the program endpoints answer 403 for a non-marker) so nothing is
 * lost. A network failure also stops the drain, leaving the rest queued.
 */
export async function drainProgramOutbox(
  onProgress?: (remaining: number) => void
): Promise<ProgramDrainResult> {
  const items = (await allProgramOutbox()).sort((a, b) => a.createdAt - b.createdAt);
  let synced = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let res: Response;
    try {
      res = await sendItem(item);
    } catch {
      // offline again mid-drain — keep this and the rest
      return { synced, remaining: items.length - synced, authExpired: false };
    }

    if (res.status === 401 || res.status === 403) {
      return { synced, remaining: items.length - synced, authExpired: true };
    }

    // Any other outcome clears the item: ok means it landed, a non-auth 4xx/5xx
    // is permanently bad and must not wedge the queue. Idempotency makes this safe.
    await deleteProgramOutbox(item.id);
    synced++;
    onProgress?.(items.length - synced);
  }

  return { synced, remaining: 0, authExpired: false };
}

export async function programPendingCount(): Promise<number> {
  return (await allProgramOutbox()).length;
}

/**
 * Pending ops for a program day, used to reconcile the present-set on load so a
 * queued-but-unsynced mark still shows after a reload — and to inject offline
 * walk-ins into the roster before they exist on the server.
 */
export async function pendingForProgram(
  programId: string,
  dateStr: string
): Promise<{ mark: Set<string>; unmark: Set<string>; walkins: ProgramOutboxItem[] }> {
  const items = await allProgramOutbox();
  const mark = new Set<string>();
  const unmark = new Set<string>();
  const walkins: ProgramOutboxItem[] = [];
  for (const it of items) {
    if (it.programId !== programId || it.dateStr !== dateStr) continue;
    (it.op === "mark" ? mark : unmark).add(it.phone);
    if (it.op === "mark" && it.source === "walkin") walkins.push(it);
  }
  return { mark, unmark, walkins };
}
