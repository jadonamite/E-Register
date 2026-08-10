// Minimal, dependency-free IndexedDB wrapper for offline support.
//
// Stores:
//   roster        — a single cached snapshot of the member list (key "members")
//   outbox        — pending attendance writes, keyed by memberId|service|date
//   memberOutbox  — pending member mutations, keyed by memberId
//   programRoster — cached program roster identity (who exists), keyed by programId
//   programDay    — present phones for a program day, keyed programId|dateStr
//   programOutbox — pending program marks, keyed programId|phone|dateStr
//
// Everything is best-effort: on any environment without IndexedDB (SSR,
// private-mode edge cases) the helpers resolve to null / no-op so callers can
// fall straight through to the network.

const DB_NAME = "eregister-offline";
const DB_VERSION = 3;

export const ROSTER_STORE = "roster";
export const OUTBOX_STORE = "outbox";
export const MEMBER_OUTBOX_STORE = "memberOutbox";
export const PROGRAM_ROSTER_STORE = "programRoster";
export const PROGRAM_DAY_STORE = "programDay";
export const PROGRAM_OUTBOX_STORE = "programOutbox";
export const ROSTER_KEY = "members";

export type OutboxOp = "mark" | "unmark";
export type MemberOp = "create" | "update" | "delete";

export interface OutboxItem {
  id: string; // `${memberId}|${serviceType}|${dateStr}`
  op: OutboxOp;
  memberId: string;
  serviceType: string;
  dateStr: string; // toDateString() — the calendar day the mark belongs to
  dateISO: string; // exact ISO sent to the API
  createdAt: number;
}

// A pending member mutation. Keyed by memberId (temp or real) so there is at
// most one queued op per member — updates fold into a pending create, and a
// create+delete cancels out.
export interface MemberOutboxItem {
  id: string; // memberId (temp for offline-created, real otherwise)
  op: MemberOp;
  memberId: string;
  payload: any; // member fields for create/update; ignored for delete
  isTemp: boolean; // true when the member was created offline (needs id remap)
  seq: number; // ordering across members
  createdAt: number;
}

export interface RosterSnapshot {
  key: string;
  members: any[];
  cachedAt: number;
}

// A queued program check-in/undo. Carries the full POST payload so a walk-in
// created offline needs nothing beyond its own queue item to sync.
export interface ProgramOutboxItem {
  id: string; // `${programId}|${phone}|${dateStr}` — phone already normalised
  op: OutboxOp;
  programId: string;
  phone: string;
  dateStr: string; // toDateString() — the calendar day the mark belongs to
  dateISO: string; // exact ISO sent to the API
  name: string;
  source: "member" | "contact" | "walkin";
  memberId?: string;
  contactId?: string;
  invitedBy?: string;
  createdAt: number;
}

// Roster identity for a program — rows stripped of `present`, which is
// per-date and cached separately so switching dates offline still shows
// everyone we know about.
export interface ProgramRosterSnapshot {
  programId: string;
  rows: any[];
  cachedAt: number;
}

export interface ProgramDaySnapshot {
  key: string; // `${programId}|${dateStr}`
  presentPhones: string[];
  cachedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function hasIDB(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(ROSTER_STORE)) {
        db.createObjectStore(ROSTER_STORE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        db.createObjectStore(OUTBOX_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(MEMBER_OUTBOX_STORE)) {
        db.createObjectStore(MEMBER_OUTBOX_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PROGRAM_ROSTER_STORE)) {
        db.createObjectStore(PROGRAM_ROSTER_STORE, { keyPath: "programId" });
      }
      if (!db.objectStoreNames.contains(PROGRAM_DAY_STORE)) {
        db.createObjectStore(PROGRAM_DAY_STORE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(PROGRAM_OUTBOX_STORE)) {
        db.createObjectStore(PROGRAM_OUTBOX_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = run(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

// ---- Roster cache -------------------------------------------------------

export async function saveRoster(members: any[]): Promise<void> {
  if (!hasIDB()) return;
  try {
    const snapshot: RosterSnapshot = { key: ROSTER_KEY, members, cachedAt: Date.now() };
    await tx(ROSTER_STORE, "readwrite", (s) => s.put(snapshot));
  } catch {
    // storage full / unavailable — non-fatal
  }
}

export async function loadRoster(): Promise<RosterSnapshot | null> {
  if (!hasIDB()) return null;
  try {
    const snap = await tx<RosterSnapshot | undefined>(ROSTER_STORE, "readonly", (s) =>
      s.get(ROSTER_KEY)
    );
    return snap ?? null;
  } catch {
    return null;
  }
}

// ---- Outbox -------------------------------------------------------------

export async function putOutbox(item: OutboxItem): Promise<void> {
  if (!hasIDB()) return;
  await tx(OUTBOX_STORE, "readwrite", (s) => s.put(item));
}

export async function getOutboxItem(id: string): Promise<OutboxItem | null> {
  if (!hasIDB()) return null;
  try {
    const item = await tx<OutboxItem | undefined>(OUTBOX_STORE, "readonly", (s) => s.get(id));
    return item ?? null;
  } catch {
    return null;
  }
}

export async function deleteOutbox(id: string): Promise<void> {
  if (!hasIDB()) return;
  await tx(OUTBOX_STORE, "readwrite", (s) => s.delete(id));
}

export async function allOutbox(): Promise<OutboxItem[]> {
  if (!hasIDB()) return [];
  try {
    const items = await tx<OutboxItem[]>(OUTBOX_STORE, "readonly", (s) => s.getAll());
    return items ?? [];
  } catch {
    return [];
  }
}

// ---- Member outbox ------------------------------------------------------

export async function putMemberOutbox(item: MemberOutboxItem): Promise<void> {
  if (!hasIDB()) return;
  await tx(MEMBER_OUTBOX_STORE, "readwrite", (s) => s.put(item));
}

export async function getMemberOutbox(id: string): Promise<MemberOutboxItem | null> {
  if (!hasIDB()) return null;
  try {
    const item = await tx<MemberOutboxItem | undefined>(MEMBER_OUTBOX_STORE, "readonly", (s) =>
      s.get(id)
    );
    return item ?? null;
  } catch {
    return null;
  }
}

export async function deleteMemberOutbox(id: string): Promise<void> {
  if (!hasIDB()) return;
  await tx(MEMBER_OUTBOX_STORE, "readwrite", (s) => s.delete(id));
}

export async function allMemberOutbox(): Promise<MemberOutboxItem[]> {
  if (!hasIDB()) return [];
  try {
    const items = await tx<MemberOutboxItem[]>(MEMBER_OUTBOX_STORE, "readonly", (s) => s.getAll());
    return items ?? [];
  } catch {
    return [];
  }
}

// ---- Program roster cache ------------------------------------------------

export async function saveProgramRoster(programId: string, rows: any[]): Promise<void> {
  if (!hasIDB()) return;
  try {
    const snapshot: ProgramRosterSnapshot = { programId, rows, cachedAt: Date.now() };
    await tx(PROGRAM_ROSTER_STORE, "readwrite", (s) => s.put(snapshot));
  } catch {
    // storage full / unavailable — non-fatal
  }
}

export async function loadProgramRoster(programId: string): Promise<ProgramRosterSnapshot | null> {
  if (!hasIDB()) return null;
  try {
    const snap = await tx<ProgramRosterSnapshot | undefined>(PROGRAM_ROSTER_STORE, "readonly", (s) =>
      s.get(programId)
    );
    return snap ?? null;
  } catch {
    return null;
  }
}

export function programDayKey(programId: string, dateStr: string): string {
  return `${programId}|${dateStr}`;
}

export async function saveProgramDay(
  programId: string,
  dateStr: string,
  presentPhones: string[]
): Promise<void> {
  if (!hasIDB()) return;
  try {
    const snapshot: ProgramDaySnapshot = {
      key: programDayKey(programId, dateStr),
      presentPhones,
      cachedAt: Date.now(),
    };
    await tx(PROGRAM_DAY_STORE, "readwrite", (s) => s.put(snapshot));
  } catch {
    // non-fatal
  }
}

export async function loadProgramDay(
  programId: string,
  dateStr: string
): Promise<ProgramDaySnapshot | null> {
  if (!hasIDB()) return null;
  try {
    const snap = await tx<ProgramDaySnapshot | undefined>(PROGRAM_DAY_STORE, "readonly", (s) =>
      s.get(programDayKey(programId, dateStr))
    );
    return snap ?? null;
  } catch {
    return null;
  }
}

// ---- Program outbox -------------------------------------------------------

export async function putProgramOutbox(item: ProgramOutboxItem): Promise<void> {
  if (!hasIDB()) return;
  await tx(PROGRAM_OUTBOX_STORE, "readwrite", (s) => s.put(item));
}

export async function getProgramOutboxItem(id: string): Promise<ProgramOutboxItem | null> {
  if (!hasIDB()) return null;
  try {
    const item = await tx<ProgramOutboxItem | undefined>(PROGRAM_OUTBOX_STORE, "readonly", (s) =>
      s.get(id)
    );
    return item ?? null;
  } catch {
    return null;
  }
}

export async function deleteProgramOutbox(id: string): Promise<void> {
  if (!hasIDB()) return;
  await tx(PROGRAM_OUTBOX_STORE, "readwrite", (s) => s.delete(id));
}

export async function allProgramOutbox(): Promise<ProgramOutboxItem[]> {
  if (!hasIDB()) return [];
  try {
    const items = await tx<ProgramOutboxItem[]>(PROGRAM_OUTBOX_STORE, "readonly", (s) => s.getAll());
    return items ?? [];
  } catch {
    return [];
  }
}
