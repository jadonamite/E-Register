import { useState, useMemo } from "react";
import { mockMembers as initialMembers } from "@/lib/mock-data";

export function useMembers() {
  const [members, setMembers] = useState(initialMembers);
  const [signedInIds, setSignedInIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.cell.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, members]);

  // Updated to accept the full data object from the modal
  const addMember = (data: any) => {
    const newEntry = {
      ...data,
      id: Date.now(),
      // Ensuring defaults if fields are missing
      schoolDept: data.schoolDept || "N/A",
      churchDept: data.churchDept || "First-Timer",
      role: data.role || "Base Member",
      level: data.level || "100L" 
    };
    setMembers([newEntry, ...members]);
  };

  const markPresent = (id: number) => {
    if (!signedInIds.includes(id)) setSignedInIds(prev => [...prev, id]);
  };

  return { 
    filteredMembers, 
    signedInIds, 
    searchQuery, 
    setSearchQuery, 
    addMember, 
    markPresent,
    totalCount: members.length 
  };
}