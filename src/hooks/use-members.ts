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
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.cell.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, members]);

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
      if (!res.ok) throw new Error("Failed to add");

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

      if (!res.ok) throw new Error("Failed to update");
      
      const updated = await res.json();
      setMembers(prev => prev.map(m => m._id === data._id ? updated : m));
      toast.success("Member details updated");

    } catch (error) {
      // Revert on failure
      if (originalMember) {
        setMembers(prev => prev.map(m => m._id === data._id ? originalMember : m));
      }
      toast.error("Update failed: Network Error");
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
    totalCount: members.length 
  };
}