import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

export function useMembers(currentService: string = "Sunday", selectedDate: Date = new Date()) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedInIds, setSignedInIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Fetch Members
  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch("/api/members");
        if (res.ok) {
          const data = await res.json();
          setMembers(data);

          const targetDateStr = selectedDate.toDateString(); 
          
          const alreadyPresentIds = data
            .filter((m: any) => 
              m.attendance?.some((record: any) => {
                const recordDate = new Date(record.date).toDateString();
                return recordDate === targetDateStr && record.serviceType === currentService;
              })
            )
            .map((m: any) => m._id);

          setSignedInIds(alreadyPresentIds);
        }
      } catch (error) {
        console.error("Failed to load members", error);
        toast.error("Could not load member list");
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, [currentService, selectedDate]);

  // 2. Filter Logic
  const filteredMembers = useMemo(() => {
    return members.filter(m =>
      (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.cell || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, members]);

  // Filter by hierarchy
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

  // 3. Add Member
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
      setMembers(prev => prev.map(m => m._id === tempId ? savedMember : m));
      toast.success("Member added successfully");

    } catch (error: any) {
      setMembers(prev => prev.filter(m => m._id !== tempId));
      toast.error(error.message || "Failed to save member");
      throw error; // let the modal keep itself open with the user's input intact
    }
  };

  // 4. Update Member (The new Edit logic)
  const updateMember = async (data: any) => {
    const originalMember = members.find(m => m._id === data._id);
    
    // Optimistic Update
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
      setMembers(prev => prev.map(m => m._id === data._id ? updated : m));
      toast.success(data.status === "Member" && !originalMember?.cell ? "Converted to member" : "Member details updated");

    } catch (error: any) {
      // Revert on failure
      if (originalMember) {
        setMembers(prev => prev.map(m => m._id === data._id ? originalMember : m));
      }
      toast.error(error.message || "Update failed");
      throw error; // surface to the modal so it stays open with the edits intact
    }
  };

  // 5. Toggle Attendance
  const toggleAttendance = async (id: string) => {
    const isPresent = signedInIds.includes(id);

    if (isPresent) {
      setSignedInIds(prev => prev.filter(sid => sid !== id));
      toast.info("Marked Absent");
    } else {
      setSignedInIds(prev => [...prev, id]);
      toast.success("Marked Present");
    }

    try {
      const method = isPresent ? "DELETE" : "POST";
      const res = await fetch("/api/attendance", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: id,
          serviceType: currentService, 
          date: selectedDate.toISOString() 
        }),
      });

      if (!res.ok) {
        const { error: message } = await res.json().catch(() => ({ error: "" }));
        throw new Error(message || "Failed to sync");
      }
    } catch (error: any) {
      if (isPresent) setSignedInIds(prev => [...prev, id]);
      else setSignedInIds(prev => prev.filter(sid => sid !== id));
      toast.error(error?.message || "Attendance sync failed");
    }
  };

  return {
    filteredMembers,
    signedInIds,
    searchQuery,
    setSearchQuery,
    addMember,
    updateMember,
    markPresent: toggleAttendance,
    loading,
    totalCount: members.length,
    getUniqueLevels,
    filterByHierarchy
  };
}