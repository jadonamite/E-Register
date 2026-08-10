import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ProgramOutboxItem,
  loadProgramDay,
  loadProgramRoster,
  saveProgramDay,
  saveProgramRoster,
} from "@/lib/offline/db";
import {
  drainProgramOutbox,
  isValidPhone,
  normPhone,
  pendingForProgram,
  programPendingCount,
  queueProgramToggle,
} from "@/lib/offline/program-queue";
import { useOnline } from "@/hooks/use-online";

export interface RosterRow {
  source: "member" | "contact" | "walkin";
  id: string;
  memberId?: string;
  contactId?: string;
  name: string;
  phone: string;
  cell: string;
  role?: string;
  tag: string;
  invitedBy?: string;
  present: boolean;
}

// Reconcile the present-set: server-persisted check-ins for the day, plus
// optimistic queued marks, minus queued unmarks — so a queued-but-unsynced
// mark survives a reload, exactly like the member attendance path.
function reconcilePresent(
  base: Iterable<string>,
  pending: { mark: Set<string>; unmark: Set<string> }
): Set<string> {
  const phones = new Set(base);
  for (const p of pending.mark) phones.add(p);
  for (const p of pending.unmark) phones.delete(p);
  return phones;
}

// Live program roster: members ∪ invitees ∪ walk-ins, marked against the
// program's own attendance store (never Member.attendance). The full roster is
// fetched once and cached in IndexedDB — search runs client-side, and marks go
// through a durable outbox so the page works fully offline after one warm load.
export function useProgramRoster(programId: string | null, date: Date) {
  const [baseRows, setBaseRows] = useState<RosterRow[]>([]); // identity only; `present` ignored
  const [presentPhones, setPresentPhones] = useState<Set<string>>(new Set());
  const [pendingWalkins, setPendingWalkins] = useState<ProgramOutboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [authExpired, setAuthExpired] = useState(false);

  const online = useOnline();
  const draining = useRef(false);

  const dateStr = date.toDateString();
  const dateISO = date.toISOString();

  const refreshPending = useCallback(async () => {
    setPending(await programPendingCount());
  }, []);

  // Pull the canonical roster from the server, split it into identity rows and
  // the day's present-set, overlay pending offline marks, and refresh both
  // caches. Returns false (keeping whatever is cached) when offline.
  const refreshFromServer = useCallback(async (): Promise<boolean> => {
    if (!programId) return false;
    try {
      const res = await fetch(`/api/programs/${programId}/roster?full=1&date=${encodeURIComponent(dateISO)}`);
      if (res.status === 401 || res.status === 403) {
        setBaseRows([]);
        toast.error("Sign in as a marker to view the program roster");
        return true; // reached the server — just not authorised
      }
      if (!res.ok) return false;
      const data = await res.json();
      const rows: RosterRow[] = data.rows;
      const serverPresent = rows.filter((r) => r.present).map((r) => normPhone(r.phone));
      const identity = rows.map((r) => ({ ...r, present: false }));
      const pend = await pendingForProgram(programId, dateStr);

      setBaseRows(identity);
      setPresentPhones(reconcilePresent(serverPresent, pend));
      setPendingWalkins(pend.walkins);
      saveProgramRoster(programId, identity);
      saveProgramDay(programId, dateStr, serverPresent);
      return true;
    } catch {
      return false;
    }
  }, [programId, dateStr, dateISO]);

  // Drain the program outbox; on success re-pull so offline walk-ins come back
  // as real roster rows. Guarded against overlapping drains.
  const syncNow = useCallback(async () => {
    if (draining.current) return;
    if ((await programPendingCount()) === 0) return;
    draining.current = true;
    setSyncing(true);
    try {
      const res = await drainProgramOutbox();
      if (res.authExpired) {
        setAuthExpired(true);
        toast.error("Session expired — sign in again to sync your changes");
        return;
      }
      setAuthExpired(false);
      if (res.synced > 0) {
        toast.success(`Synced ${res.synced} ${res.synced === 1 ? "change" : "changes"}`);
        await refreshFromServer();
      }
    } finally {
      draining.current = false;
      setSyncing(false);
      await refreshPending();
    }
  }, [refreshPending, refreshFromServer]);

  // 1. Load roster: cached snapshot first (instant, works offline), then a
  // network refresh that updates the cache when it succeeds.
  useEffect(() => {
    if (!programId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [roster, day, pend] = await Promise.all([
        loadProgramRoster(programId!),
        loadProgramDay(programId!, dateStr),
        pendingForProgram(programId!, dateStr),
      ]);
      if (roster && !cancelled) {
        setBaseRows(roster.rows);
        setPresentPhones(reconcilePresent(day?.presentPhones ?? [], pend));
        setPendingWalkins(pend.walkins);
        setLoading(false);
      }
      const ok = await refreshFromServer();
      if (!ok && !roster && !cancelled) toast.error("Offline and no cached roster yet");
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [programId, dateStr, refreshFromServer]);

  // 2. Keep the pending count fresh and drain whenever we (re)gain connectivity.
  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    if (online) syncNow();
  }, [online, syncNow]);

  // 3. Displayed roster: identity rows plus synthetic rows for offline walk-ins
  // that don't exist on the server yet, present flags applied, then searched.
  const allRows = useMemo<RosterRow[]>(() => {
    const byPhone = new Set(baseRows.map((r) => normPhone(r.phone)));
    const synthetic: RosterRow[] = pendingWalkins
      .filter((w) => !byPhone.has(w.phone))
      .map((w) => ({
        source: "walkin",
        id: w.phone,
        name: w.name,
        phone: w.phone,
        cell: "Walk-in",
        tag: "Walk-in",
        invitedBy: w.invitedBy,
        present: true,
      }));
    return [...baseRows, ...synthetic].map((r) => ({
      ...r,
      present: presentPhones.has(normPhone(r.phone)),
    }));
  }, [baseRows, pendingWalkins, presentPhones]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allRows;
    const qDigits = q.replace(/\D/g, "");
    return allRows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (qDigits.length >= 3 && r.phone.replace(/\D/g, "").includes(qDigits))
    );
  }, [allRows, searchQuery]);

  const presentCount = useMemo(
    () => allRows.filter((r) => r.present).length,
    [allRows]
  );

  // 4. Toggle a check-in — durable: recorded in the outbox first, then synced.
  const markPresent = async (row: RosterRow) => {
    if (!programId) return;
    const phone = normPhone(row.phone);
    const wasPresent = presentPhones.has(phone);
    const desiredOp = wasPresent ? "unmark" : "mark";

    // Optimistic UI
    setPresentPhones((prev) => {
      const next = new Set(prev);
      if (wasPresent) next.delete(phone);
      else next.add(phone);
      return next;
    });

    const item = await queueProgramToggle({
      programId,
      phone,
      dateStr,
      dateISO,
      desiredOp,
      name: row.name,
      source: row.source,
      memberId: row.memberId,
      contactId: row.contactId,
      invitedBy: row.invitedBy,
    });
    // An unmark that cancelled a pending walk-in mark also removes its
    // synthetic row — the person never reached the server.
    if (!item && wasPresent) {
      setPendingWalkins((prev) => prev.filter((w) => w.phone !== phone));
    }
    await refreshPending();

    if (online) {
      await syncNow();
    } else {
      toast.info(wasPresent ? "Unmarked — will sync" : "Marked — will sync when online");
    }
  };

  // 5. Walk-in — just a queued mark carrying its own name; the POST is the
  // create, so it needs no temp id. Validated up front because a bad phone
  // would be rejected (and dropped) at drain time, hours later.
  const addWalkin = async (name: string, phone: string, invitedBy?: string) => {
    if (!programId) return;
    const cleanName = name.trim();
    const cleanPhone = normPhone(phone);
    if (cleanName.length < 2) throw new Error("Name is required");
    if (!isValidPhone(cleanPhone)) throw new Error("A valid phone number is required");

    // Phone already on the roster → this is a check-in, not a new person.
    const existing = allRows.find((r) => normPhone(r.phone) === cleanPhone);
    if (existing) {
      if (!existing.present) await markPresent(existing);
      toast.success(`${existing.name} checked in`);
      return;
    }

    setPresentPhones((prev) => new Set(prev).add(cleanPhone));
    const item = await queueProgramToggle({
      programId,
      phone: cleanPhone,
      dateStr,
      dateISO,
      desiredOp: "mark",
      name: cleanName,
      source: "walkin",
      invitedBy: invitedBy?.trim() || undefined,
    });
    if (item) setPendingWalkins((prev) => [...prev, item]);
    await refreshPending();

    if (online) {
      await syncNow();
      toast.success("Walk-in checked in");
    } else {
      toast.success("Walk-in saved offline — will sync when online");
    }
  };

  return {
    rows: filteredRows,
    total: allRows.length,
    presentCount,
    loading,
    searchQuery,
    setSearchQuery,
    markPresent,
    addWalkin,
    // offline status
    online,
    pending,
    syncing,
    authExpired,
    syncNow,
  };
}
