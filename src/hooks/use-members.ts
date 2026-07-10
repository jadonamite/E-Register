import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { loadRoster, saveRoster } from "@/lib/offline/db";
import { queueToggle, drainOutbox, pendingCount, pendingForDate } from "@/lib/offline/queue";
import { useOnline } from "@/hooks/use-online";

// Reconcile the "already present" set: server-persisted attendance for the
// selected day, plus optimistic queued marks, minus queued unmarks. This keeps
// a queued-but-unsynced mark visible as present across reloads.
function computeSignedIn(
  memberList: any[],
  service: string,
  dateStr: string,
  pending: { mark: Set<string>; unmark: Set<string> }
): string[] {
  const ids = new Set<string>();
  for (const m of memberList) {
    const present = m.attendance?.some((r: any) => {
      return new Date(r.date).toDateString() === dateStr && r.serviceType === service;
    });
    if (present) ids.add(m._id);
  }
  for (const id of pending.mark) ids.add(id);
  for (const id of pending.unmark) ids.delete(id);
  return Array.from(ids);
}

export function useMembers(currentService: string = "Sunday", selectedDate: Date = new Date()) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedInIds, setSignedInIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [authExpired, setAuthExpired] = useState(false);

  const online = useOnline();
  const draining = useRef(false);

  const refreshPending = useCallback(async () => {
    setPending(await pendingCount());
  }, []);

  // Drain the outbox. Safe to call repeatedly; guarded against overlap.
  const syncNow = useCallback(async () => {
    if (draining.current) return;
    if ((await pendingCount()) === 0) return;
    draining.current = true;
    setSyncing(true);
    try {
      const res = await drainOutbox();
      if (res.authExpired) {
        setAuthExpired(true);
        toast.error("Session expired — sign in again to sync pending marks");
      } else if (res.synced > 0) {
        setAuthExpired(false);
        toast.success(`Synced ${res.synced} pending ${res.synced === 1 ? "mark" : "marks"}`);
      }
    } finally {
      draining.current = false;
      setSyncing(false);
      await refreshPending();
    }
  }, [refreshPending]);

  // 1. Load members: cached snapshot first (instant, works offline), then a
  // network refresh that updates the cache when it succeeds.
  useEffect(() => {
    let cancelled = false;
    const dateStr = selectedDate.toDateString();

    async function load() {
      const snap = await loadRoster();
      if (snap && !cancelled) {
        const pend = await pendingForDate(currentService, dateStr);
        setMembers(snap.members);
        setSignedInIds(computeSignedIn(snap.members, currentService, dateStr, pend));
        setLoading(false);
      }

      try {
        const res = await fetch("/api/members");
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          const pend = await pendingForDate(currentService, dateStr);
          setMembers(data);
          setSignedInIds(computeSignedIn(data, currentService, dateStr, pend));
          saveRoster(data);
        }
      } catch {
        if (!snap && !cancelled) toast.error("Offline and no cached list yet");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [currentService, selectedDate]);

  // 2. Keep pending count fresh and drain whenever we (re)gain connectivity.
  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    if (online) syncNow();
  }, [online, syncNow]);

  // 3. Search filter — name, cell, or phone (digits compared without spacing).
  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, "");
    return members.filter(m =>
      (m.name || "").toLowerCase().includes(q) ||
      (m.cell || "").toLowerCase().includes(q) ||
      (qDigits.length >= 3 && (m.phone || "").replace(/\D/g, "").includes(qDigits))
    );
  }, [searchQuery, members]);

  const getUniqueLevels = (level: "team" | "seniorCell" | "cell") => {
    const values = new Set(
      members
        .map(m => {
          if (level === "team") return m.team || "No Team";
          if (level === "seniorCell") return m.seniorCell || "Unassigned";
          if (level === "cell") return m.cell || "Unassigned";
        })
        .filter(Boolean)
    );
    return Array.from(values).sort();
  };

  const filterByHierarchy = (filterType: "all" | "team" | "seniorCell" | "cell", filterValue: string) => {
    if (filterType === "all" || !filterValue) return filteredMembers;

    return filteredMembers.filter(m => {
      if (filterType === "team") return (m.team || "No Team") === filterValue;
      if (filterType === "seniorCell") return (m.seniorCell || "Unassigned") === filterValue;
      if (filterType === "cell") return (m.cell || "Unassigned") === filterValue;
      return true;
    });
  };

  // 4. Add Member
  const addMember = async (data: any) => {
    const tempId = Date.now().toString();
    const optimisticMember = { ...data, _id: tempId, attendance: [] };

    setMembers(prev => [optimisticMember, ...prev]);

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.status === 409) throw new Error("Member already exists!");
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        throw new Error(error || "Failed to add");
      }

      const savedMember = await res.json();
      setMembers(prev => {
        const next = prev.map(m => m._id === tempId ? savedMember : m);
        saveRoster(next);
        return next;
      });
      toast.success("Member added successfully");

    } catch (error: any) {
      setMembers(prev => prev.filter(m => m._id !== tempId));
      toast.error(error.message || "Failed to save member");
      throw error; // let the modal keep itself open with the user's input intact
    }
  };

  // 5. Update Member
  const updateMember = async (data: any) => {
    const originalMember = members.find(m => m._id === data._id);

    setMembers(prev => prev.map(m => m._id === data._id ? { ...m, ...data } : m));

    try {
      const res = await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        throw new Error(error || "Failed to update");
      }

      const updated = await res.json();
      setMembers(prev => {
        const next = prev.map(m => m._id === data._id ? updated : m);
        saveRoster(next);
        return next;
      });
      toast.success(data.status === "Member" && !originalMember?.cell ? "Converted to member" : "Member details updated");

    } catch (error: any) {
      if (originalMember) {
        setMembers(prev => prev.map(m => m._id === data._id ? originalMember : m));
      }
      toast.error(error.message || "Update failed");
      throw error; // surface to the modal so it stays open with the edits intact
    }
  };

  // 6. Delete Member
  const deleteMember = async (id: string) => {
    const original = members;
    setMembers(prev => prev.filter(m => m._id !== id));

    try {
      const res = await fetch("/api/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: id }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        throw new Error(error || "Failed to delete");
      }
      setMembers(prev => {
        saveRoster(prev);
        return prev;
      });
      toast.success("Member removed from the database");
    } catch (error: any) {
      setMembers(original);
      toast.error(error.message || "Delete failed");
      throw error;
    }
  };

  // 7. Toggle Attendance — durable: recorded in the outbox first, then synced.
  // A dropped signal or reload never loses the mark; it drains on reconnect.
  const toggleAttendance = async (id: string) => {
    const dateStr = selectedDate.toDateString();
    const isPresent = signedInIds.includes(id);
    const desiredOp = isPresent ? "unmark" : "mark";

    // Optimistic UI
    setSignedInIds(prev => isPresent ? prev.filter(sid => sid !== id) : [...prev, id]);

    await queueToggle({
      memberId: id,
      serviceType: currentService,
      dateStr,
      dateISO: selectedDate.toISOString(),
      desiredOp,
    });
    await refreshPending();

    if (online) {
      await syncNow();
    } else {
      toast.info(isPresent ? "Unmarked — will sync" : "Marked — will sync when online");
    }
  };

  return {
    filteredMembers,
    signedInIds,
    searchQuery,
    setSearchQuery,
    addMember,
    updateMember,
    deleteMember,
    markPresent: toggleAttendance,
    loading,
    totalCount: members.length,
    getUniqueLevels,
    filterByHierarchy,
    // offline status
    online,
    pending,
    syncing,
    authExpired,
    syncNow,
  };
}
