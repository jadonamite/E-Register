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

  const addMember = (name: string, cell: string) => {
    const newEntry = {
      id: Date.now(),
      name,
      cell,
      schoolDept: "NEW",
      churchDept: "Convert",
      role: "Base Member"
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