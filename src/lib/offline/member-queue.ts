// Durable queue for member add / edit / delete performed offline.
//
// Keyed by memberId, so there is at most one pending op per member:
//   • edits fold into a pending create (one POST with final data on sync),
//   • create + delete cancel out (the member never reaches the server),
//   • edit-then-delete becomes a delete.
//
// On drain, members are synced before attendance. When an offline-created
// member gets its real server id, any queued attendance for the temporary id is
// rewritten to the real one (see remapMemberId) so marks land on the right row.

import {
  MemberOutboxItem,
  allMemberOutbox,
  deleteMemberOutbox,
  getMemberOutbox,
  putMemberOutbox,
} from "./db";
import { remapMemberId, purgeAttendanceForMember } from "./queue";

let seqCounter = 0;
function nextSeq(): number {
  // Monotonic even within the same millisecond.
  return Date.now() * 1000 + (seqCounter++ % 1000);
}

// Strip client-only bookkeeping the API must never receive.
function cleanPayload(payload: any): any {
  const rest = { ...(payload ?? {}) };
  for (const k of ["_id", "_pending", "attendance", "createdAt", "__v"]) delete rest[k];
  return rest;
}

export async function queueCreate(tempId: string, member: any): Promise<void> {
  const item: MemberOutboxItem = {
    id: tempId,
    op: "create",
    memberId: tempId,
    payload: member,
    isTemp: true,
    seq: nextSeq(),
    createdAt: Date.now(),
  };
  await putMemberOutbox(item);
}

export async function queueUpdate(memberId: string, changes: any): Promise<void> {
  const existing = await getMemberOutbox(memberId);
  if (existing && (existing.op === "create" || existing.op === "update")) {
    // Fold into the pending op so we still send just one request.
    existing.payload = { ...existing.payload, ...changes };
    await putMemberOutbox(existing);
    return;
  }
  const item: MemberOutboxItem = {
    id: memberId,
    op: "update",
    memberId,
    payload: changes,
    isTemp: false,
    seq: nextSeq(),
    createdAt: Date.now(),
  };
  await putMemberOutbox(item);
}

/**
 * Queue a delete. Returns "cancelled" when the member only ever existed
 * offline (a pending create) — the caller can drop it locally with no server
 * round-trip; its queued attendance is purged too.
 */
export async function queueDelete(memberId: string): Promise<"cancelled" | "queued"> {
  const existing = await getMemberOutbox(memberId);
  if (existing && existing.op === "create") {
    await deleteMemberOutbox(memberId);
    await purgeAttendanceForMember(memberId);
    return "cancelled";
  }
  const item: MemberOutboxItem = {
    id: memberId,
    op: "delete",
    memberId,
    payload: null,
    isTemp: false,
    seq: nextSeq(),
    createdAt: Date.now(),
  };
  await putMemberOutbox(item);
  return "queued";
}

export async function memberPendingCount(): Promise<number> {
  return (await allMemberOutbox()).length;
}

async function sendCreate(payload: any): Promise<Response> {
  return fetch("/api/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanPayload(payload)),
  });
}

async function sendUpdate(memberId: string, payload: any): Promise<Response> {
  return fetch("/api/members", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ _id: memberId, ...cleanPayload(payload) }),
  });
}

async function sendDelete(memberId: string): Promise<Response> {
  return fetch("/api/members", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ _id: memberId }),
  });
}

// Resolve the real id of a member the server says already exists (409 on a
// replayed create), by matching phone against a fresh roster fetch.
async function findRealIdByPhone(phone: string): Promise<string | null> {
  try {
    const res = await fetch("/api/members");
    if (!res.ok) return null;
    const list = await res.json();
    const match = list.find((m: any) => (m.phone || "") === (phone || ""));
    return match?._id ?? null;
  } catch {
    return null;
  }
}

export interface MemberDrainResult {
  synced: number;
  remaining: number;
  authExpired: boolean;
  idMap: Record<string, string>; // tempId → realId, for the caller's cache
}

export async function drainMemberOutbox(): Promise<MemberDrainResult> {
  const items = (await allMemberOutbox()).sort((a, b) => a.seq - b.seq);
  const idMap: Record<string, string> = {};
  let synced = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let res: Response;
    try {
      if (item.op === "create") res = await sendCreate(item.payload);
      else if (item.op === "update") res = await sendUpdate(item.memberId, item.payload);
      else res = await sendDelete(item.memberId);
    } catch {
      return { synced, remaining: items.length - synced, authExpired: false, idMap };
    }

    if (res.status === 401) {
      return { synced, remaining: items.length - synced, authExpired: true, idMap };
    }

    if (item.op === "create") {
      if (res.ok) {
        const saved = await res.json().catch(() => null);
        const realId = saved?._id;
        if (realId) {
          idMap[item.memberId] = realId;
          await remapMemberId(item.memberId, realId);
        }
      } else if (res.status === 409) {
        // Duplicate phone — the member already exists server-side. Reconcile to
        // the existing id so queued attendance still lands on the right person.
        const realId = await findRealIdByPhone(item.payload?.phone);
        if (realId) {
          idMap[item.memberId] = realId;
          await remapMemberId(item.memberId, realId);
        } else {
          await purgeAttendanceForMember(item.memberId);
        }
      }
      // Any non-2xx that isn't auth: drop the create so it can't wedge the
      // queue; idempotency/reconcile above already covered the recoverable case.
    }

    await deleteMemberOutbox(item.id);
    synced++;
  }

  return { synced, remaining: 0, authExpired: false, idMap };
}
