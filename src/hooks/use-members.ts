import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner"; // Assuming you have Sonner for toasts

export function useMembers() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedInIds, setSignedInIds] = useState<string[]>([]); // Changed to string for MongoDB _id
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Fetch Members from Database on Load
  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch("/api/members");
        if (res.ok) {
          const data = await res.json();
          setMembers(data);
        }
      } catch (error) {
        console.error("Failed to load members", error);
        toast.error("Could not load member list");
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, []);

  // 2. Filter Logic (Same as before)
  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.cell.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, members]);

  // 3. Add Member (Connects to API)
  const addMember = async (data: any) => {
    // Optimistic UI Update (Show it immediately)
    const tempId = Date.now().toString();
    const optimisticMember = { ...data, _id: tempId };
    setMembers(prev => [optimisticMember, ...prev]);

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add");
      }

      const savedMember = await res.json();
      
      // Replace the temporary optimistic member with the real one from DB
      setMembers(prev => prev.map(m => m._id === tempId ? savedMember : m));
      toast.success("Member added to Database");

    } catch (error: any) {
      // Revert if failed
      setMembers(prev => prev.filter(m => m._id !== tempId));
      toast.error(error.message);
    }
  };

  // 4. Mark Present (For now, local only + visual)
  // We will connect this to the Attendance API in the next step
 
  const markPresent = async (id: string, serviceType: string) => {
    // 1. Optimistic Update (Turn it green instantly)
    if (!signedInIds.includes(id)) {
      setSignedInIds(prev => [...prev, id]);
      toast.success("Marked Present");
    }

    try {
      // 2. Send to Backend
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: id,
          serviceType: serviceType, // e.g., "Sunday"
          date: new Date().toISOString()
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

    } catch (error) {
      // If it fails, revert the green checkmark
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
