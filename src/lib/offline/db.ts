// Minimal, dependency-free IndexedDB wrapper for offline support.
//
// Two stores:
//   roster  — a single cached snapshot of the member list (key "members")
//   outbox  — pending attendance writes, keyed by memberId|service|date
//
// Everything is best-effort: on any environment without IndexedDB (SSR,
// private-mode edge cases) the helpers resolve to null / no-op so callers can
// fall straight through to the network.

const DB_NAME = "eregister-offline";
const DB_VERSION = 1;

export const ROSTER_STORE = "roster";
export const OUTBOX_STORE = "outbox";
export const ROSTER_KEY = "members";

export type OutboxOp = "mark" | "unmark";

export interface OutboxItem {
  id: string; // `${memberId}|${serviceType}|${dateStr}`
  op: OutboxOp;
  memberId: string;
  serviceType: string;
  dateStr: string; // toDateString() — the calendar day the mark belongs to
  dateISO: string; // exact ISO sent to the API
  createdAt: number;
}

export interface RosterSnapshot {
  key: string;
  members: any[];
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
