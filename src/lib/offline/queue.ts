// Durable outbound queue for attendance writes.
//
// Writes are recorded in IndexedDB *before* hitting the network, so a dropped
// signal, reload, or locked phone never loses a mark. Replaying is safe because
// the attendance API is idempotent (POST dedups on date+serviceType, DELETE
// uses $pull), so a queued item can be sent any number of times.

import {
  OutboxItem,
  OutboxOp,
  allOutbox,
  deleteOutbox,
  getOutboxItem,
  putOutbox,
} from "./db";

/**
 * Rewrite queued attendance items from a temporary (offline-created) member id
 * to the real id the server assigned, so their marks land on the right person.
 * The outbox key embeds the memberId, so the row is re-keyed too.
 */
export async function remapMemberId(tempId: string, realId: string): Promise<void> {
  const items = await allOutbox();
  for (const it of items) {
    if (it.memberId !== tempId) continue;
    await deleteOutbox(it.id);
    const next: OutboxItem = {
      ...it,
      memberId: realId,
      id: outboxId(realId, it.serviceType, it.dateStr),
    };
    await putOutbox(next);
  }
}

export function outboxId(memberId: string, serviceType: string, dateStr: string): string {
  return `${memberId}|${serviceType}|${dateStr}`;
}

export interface ToggleRequest {
  memberId: string;
  serviceType: string;
  dateStr: string;
  dateISO: string;
  desiredOp: OutboxOp; // the state the user just asked for
}

/**
 * Record a toggle in the outbox with collapse semantics. A pending item and its
 * opposite cancel out (back to the server's base state); a repeat is a no-op.
 * Returns the resulting item, or null when it collapsed to nothing.
 */
export async function queueToggle(req: ToggleRequest): Promise<OutboxItem | null> {
  const id = outboxId(req.memberId, req.serviceType, req.dateStr);
  const existing = await getOutboxItem(id);

  if (existing) {
    if (existing.op === req.desiredOp) return existing; // already queued
    await deleteOutbox(id); // opposite toggle → cancels back to base
    return null;
  }

  const item: OutboxItem = {
    id,
    op: req.desiredOp,
    memberId: req.memberId,
    serviceType: req.serviceType,
    dateStr: req.dateStr,
    dateISO: req.dateISO,
    createdAt: Date.now(),
  };
  await putOutbox(item);
  return item;
}

/** Drop any queued attendance for a member (used when an offline-created member
 * is deleted before ever syncing, so nothing is sent for a person who never
 * reached the server). */
export async function purgeAttendanceForMember(memberId: string): Promise<void> {
  const items = await allOutbox();
  for (const it of items) {
    if (it.memberId === memberId) await deleteOutbox(it.id);
  }
}

async function sendItem(item: OutboxItem): Promise<Response> {
  return fetch("/api/attendance", {
    method: item.op === "mark" ? "POST" : "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      memberId: item.memberId,
      serviceType: item.serviceType,
      date: item.dateISO,
    }),
  });
}

export interface DrainResult {
  synced: number;
  remaining: number;
  authExpired: boolean;
}

/**
 * Replay every queued write in order. Stops early on an expired marker session
 * (401) so nothing is lost — the queue survives for a retry after re-login. A
 * network failure also stops the drain, leaving the rest queued.
 */
export async function drainOutbox(onProgress?: (remaining: number) => void): Promise<DrainResult> {
  const items = (await allOutbox()).sort((a, b) => a.createdAt - b.createdAt);
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

    if (res.ok) {
      await deleteOutbox(item.id);
      synced++;
      onProgress?.(items.length - synced);
    } else {
      // 4xx/5xx that isn't auth — drop it so a permanently-bad item can't wedge
      // the queue (e.g. a since-deleted member). Idempotent API makes this safe.
      await deleteOutbox(item.id);
      synced++;
      onProgress?.(items.length - synced);
    }
  }

  return { synced, remaining: 0, authExpired: false };
}

export async function pendingCount(): Promise<number> {
  return (await allOutbox()).length;
}

/**
 * Pending ops for a given service+day, used to reconcile the "already marked"
 * set on load so a queued-but-unsynced mark still shows as present after reload.
 */
export async function pendingForDate(
  serviceType: string,
  dateStr: string
): Promise<{ mark: Set<string>; unmark: Set<string> }> {
  const items = await allOutbox();
  const mark = new Set<string>();
  const unmark = new Set<string>();
  for (const it of items) {
    if (it.serviceType !== serviceType || it.dateStr !== dateStr) continue;
    (it.op === "mark" ? mark : unmark).add(it.memberId);
  }
  return { mark, unmark };
}
