import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

export function useMembers(currentService: string = "Sunday", selectedDate: Date = new Date()) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedInIds, setSignedInIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.cell.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, members]);

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

      if (res.status === 409) {
        throw new Error("Member with this phone number already exists!");
      }

      if (!res.ok) throw new Error("Failed to add");

      const savedMember = await res.json();
      setMembers(prev => prev.map(m => m._id === tempId ? savedMember : m));
      toast.success("Member added to Database");

    } catch (error: any) {
      setMembers(prev => prev.filter(m => m._id !== tempId));
      toast.error(error.message || "Failed to save member");
    }
  };

  const toggleAttendance = async (id: string) => {
    const isPresent = signedInIds.includes(id);

    // Optimistic Update
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

      if (!res.ok) throw new Error("Failed to update server");

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
    markPresent: toggleAttendance, 
    loading,
    totalCount: members.length 
  };
}