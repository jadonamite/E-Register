import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
  present: boolean;
}

// Live program roster: members ∪ invitees ∪ walk-ins, marked against the
// program's own attendance store (never Member.attendance). Search + present
// toggles are server-backed so the 2000+ list stays responsive.
export function useProgramRoster(programId: string | null, date: Date) {
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [total, setTotal] = useState(0);
  const [presentCount, setPresentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const dateISO = date.toISOString();

  const load = useCallback(
    async (search: string) => {
      if (!programId) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({ date: dateISO, limit: "200" });
        if (search.trim()) params.set("search", search.trim());
        const res = await fetch(`/api/programs/${programId}/roster?${params}`);
        if (res.status === 401 || res.status === 403) {
          setRows([]);
          toast.error("Sign in as a marker to view the program roster");
          return;
        }
        if (!res.ok) throw new Error("Failed to load roster");
        const data = await res.json();
        setRows(data.rows);
        setTotal(data.total);
        setPresentCount(data.presentCount);
      } catch {
        toast.error("Could not load program roster");
      } finally {
        setLoading(false);
      }
    },
    [programId, dateISO]
  );

  // Debounced search + reload on program/date change.
  useEffect(() => {
    const t = setTimeout(() => load(searchQuery), searchQuery ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, searchQuery]);

  const markPresent = async (row: RosterRow) => {
    const wasPresent = row.present;
    // Optimistic
    setRows((prev) => prev.map((r) => (r.phone === row.phone ? { ...r, present: !wasPresent } : r)));
    setPresentCount((c) => c + (wasPresent ? -1 : 1));

    try {
      const res = await fetch("/api/program-attendance", {
        method: wasPresent ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId,
          date: dateISO,
          phone: row.phone,
          name: row.name,
          source: row.source,
          memberId: row.memberId,
          contactId: row.contactId,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        throw new Error(error || "Failed to sync");
      }
    } catch (e: any) {
      // Revert
      setRows((prev) => prev.map((r) => (r.phone === row.phone ? { ...r, present: wasPresent } : r)));
      setPresentCount((c) => c + (wasPresent ? 1 : -1));
      toast.error(e?.message || "Attendance sync failed");
    }
  };

  const addWalkin = async (name: string, phone: string) => {
    const res = await fetch("/api/program-attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programId, date: dateISO, phone, name, source: "walkin" }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "" }));
      throw new Error(error || "Failed to add attendee");
    }
    toast.success("Walk-in checked in");
    await load(searchQuery);
  };

  return {
    rows,
    total,
    presentCount,
    loading,
    searchQuery,
    setSearchQuery,
    markPresent,
    addWalkin,
  };
}
