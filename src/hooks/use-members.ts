import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

export function useMembers(currentService: string = "Sunday") {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedInIds, setSignedInIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Fetch Members & Calculate Attendance
  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch("/api/members");
        if (res.ok) {
          const data = await res.json();
          setMembers(data);

          // AUTO-CHECK LOGIC:
          // Look at every member. If they have an attendance record for TODAY and THIS SERVICE, mark them present.
          const todayStr = new Date().toDateString(); // e.g., "Sun Feb 08 2026"
          
          const alreadyPresentIds = data
            .filter((m: any) => 
              m.attendance?.some((record: any) => {
                const recordDate = new Date(record.date).toDateString();
                return recordDate === todayStr && record.serviceType === currentService;
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
  }, [currentService]); // Re-run this check if you switch from "Sunday" to "Mid-Week"

  // 2. Filter Logic
  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.cell.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, members]);

  // 3. Add Member (Optimistic + API)
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

      if (!res.ok) throw new Error("Failed to add");

      const savedMember = await res.json();
      setMembers(prev => prev.map(m => m._id === tempId ? savedMember : m));
      toast.success("Member added to Database");

    } catch (error: any) {
      setMembers(prev => prev.filter(m => m._id !== tempId));
      toast.error("Failed to save member");
    }
  };

  // 4. Mark Present (Optimistic + API)
  const markPresent = async (id: string) => {
    // If already marked locally, stop (prevent double clicks)
    if (signedInIds.includes(id)) return;

    // Optimistic Update
    setSignedInIds(prev => [...prev, id]);
    toast.success("Marked Present");

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: id,
          serviceType: currentService, // Use the active service (Sunday/Mid-Week)
          date: new Date().toISOString()
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

    } catch (error) {
      // Revert if API fails
      setSignedInIds(prev => prev.filter(sid => sid !== id));
      toast.error("Could not save attendance");
    }
  };

  return { 
    filteredMembers, 
    signedInIds, 
    searchQuery, 
    setSearchQuery, 
    addMember, 
    markPresent,
    loading,
    totalCount: members.length 
  };
}