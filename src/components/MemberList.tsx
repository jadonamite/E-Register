// Updated Tag Logic for MemberList.tsx
const getRoleStyle = (role: string) => {
  switch (role) {
    case "Pastor": return "bg-amber-100 text-amber-700 border-amber-200";
    case "Team Lead": return "bg-indigo-100 text-indigo-700 border-indigo-200";
    case "Cell Leader": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "BST": return "bg-rose-100 text-rose-700 border-rose-200";
    default: return "bg-zinc-100 text-zinc-500 border-zinc-200";
  }
};

// Inside your .map loop:
<span className={cn(
  "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border transition-all shadow-sm",
  getRoleStyle(member.role)
)}>
  {member.role}
</span>