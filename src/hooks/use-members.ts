import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

export function useMembers(currentService: string = "Sunday", selectedDate: Date = new Date()) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedInIds, setSignedInIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Fetch Members & Calculate Attendance based on Selected Date
  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch("/api/members");
        if (res.ok) {
          const data = await res.json();
          setMembers(data);

          // AUTO-CHECK LOGIC (Time Travel Aware):
          // Compare against the 'selectedDate' passed from the UI
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
  }, [currentService, selectedDate]); // Re-run when Service OR Date changes

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

  // 4. Mark Present (Optimistic + API + Time Travel)
  const toggleAttendance = async (id: string) => {
    const isPresent = signedInIds.includes(id);

    // Optimistic UI Update
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
          date: selectedDate.toISOString() // Uses the DATE from the date picker
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

    } catch (error) {
      // Revert UI if API fails
      if (isPresent) setSignedInIds(prev => [...prev, id]);
      else setSignedInIds(prev => prev.filter(sid => sid !== id));
      toast.error("Network Error: Could not update attendance");
    }
  };

  return { 
    filteredMembers, 
    signedInIds, 
    searchQuery, 
    setSearchQuery, 
    addMember, 
    markPresent: toggleAttendance, // Still called 'markPresent' in UI
    loading,
    totalCount: members.length 
  };
}