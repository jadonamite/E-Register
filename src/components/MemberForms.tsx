import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CaretDown, Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// The Source of Truth for Hierarchy
const HIERARCHY_DATA = [
  { cell: "Marvelous", seniorCell: "Harvesters", team: "The Winning Team" },
  { cell: "Zion", seniorCell: "Harvesters", team: "The Winning Team" },
  { cell: "Grace", seniorCell: "Eagles", team: "The Winning Team" },
];

// The Full Hierarchy of Roles
const ROLES = ["Member", "BST", "Cell Leader", "Senior Cell Leader", "Team Lead", "Pastor"];

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[11px] font-black text-zinc-950 uppercase ml-2 tracking-widest drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">
    {children}
  </label>
);

const GlassInput = (props: any) => (
  <Input 
    {...props} 
    className="h-12 px-5 rounded-2xl border-none bg-white/40 focus:bg-white/80 text-zinc-950 placeholder:text-zinc-500 transition-all ring-0 focus-visible:ring-2 focus-visible:ring-black/10 text-sm font-bold shadow-inner" 
  />
);

const PillToggle = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const isMale = value === "Male";
  return (
    <div 
      onClick={() => onChange(isMale ? "Female" : "Male")}
      className="relative w-full h-12 bg-black/10 rounded-full p-1.5 flex items-center cursor-pointer border border-white/20 shadow-inner"
    >
      <motion.div 
        className="absolute h-9 w-[45%] bg-white rounded-full shadow-md z-0"
        animate={{ x: isMale ? 0 : "110%" }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
      <span className={cn("relative z-10 flex-1 text-center text-[10px] font-black transition-colors", isMale ? "text-black" : "text-zinc-400")}>M</span>
      <span className={cn("relative z-10 flex-1 text-center text-[10px] font-black transition-colors", !isMale ? "text-black" : "text-zinc-400")}>F</span>
    </div>
  );
};

export const ExistingForm = ({ onSubmit, initialData }: { onSubmit: (data: any) => void, initialData?: any }) => {
  const [form, setForm] = useState(initialData || { 
    name: "", phone: "", sex: "Male", cell: "", seniorCell: "", team: "", schoolDept: "", churchDept: "", level: "", role: "Member" 
  });
  const [dropdowns, setDropdowns] = useState({ cell: false, role: false });

  // Auto-fill Logic for Hierarchy
  useEffect(() => {
    const match = HIERARCHY_DATA.find(h => h.cell.toLowerCase() === form.cell.toLowerCase());
    if (match) {
      setForm((prev: any) => ({ ...prev, seniorCell: match.seniorCell, team: match.team }));
    }
  }, [form.cell]);

  // Combobox Filtering Logic: Show all if input is focused but empty/default, otherwise filter
  const filteredCells = form.cell === "" 
    ? HIERARCHY_DATA 
    : HIERARCHY_DATA.filter(h => h.cell.toLowerCase().includes(form.cell.toLowerCase()));

  const filteredRoles = (form.role === "" || form.role === "Member")
    ? ROLES 
    : ROLES.filter(r => r.toLowerCase().includes(form.role.toLowerCase()));

  return (
    <div className="grid grid-cols-12 gap-x-4 gap-y-5">
      {/* Row 1: Full Names & Sex Pill Toggle */}
      <div className="col-span-9 space-y-1.5">
        <Label>Full Names</Label>
        <GlassInput value={form.name} onChange={(e:any) => setForm({...form, name: e.target.value})} placeholder="David Olatunji..." />
      </div>
      <div className="col-span-3 space-y-1.5">
        <Label>Sex</Label>
        <PillToggle value={form.sex} onChange={(val) => setForm({...form, sex: val})} />
      </div>

      {/* Row 2: Phone & Typeable Cell Combobox */}
      <div className="col-span-6 space-y-1.5">
        <Label>Phone Number</Label>
        <GlassInput value={form.phone} onChange={(e:any) => setForm({...form, phone: e.target.value})} />
      </div>
      <div className="col-span-6 space-y-1.5 relative">
        <Label>Cell Name</Label>
        <div className="relative">
          <GlassInput 
            value={form.cell} 
            onChange={(e:any) => { setForm({...form, cell: e.target.value}); setDropdowns({...dropdowns, cell: true}); }}
            onFocus={() => setDropdowns({...dropdowns, cell: true})}
            onBlur={() => setTimeout(() => setDropdowns({...dropdowns, cell: false}), 200)}
          />
          <CaretDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          
          <AnimatePresence>
            {dropdowns.cell && filteredCells.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-2xl shadow-2xl z-[100] border border-zinc-100 py-2"
              >
                {filteredCells.map(h => (
                  <button key={h.cell} onClick={() => setForm({...form, cell: h.cell})}
                    className="w-full px-5 py-3 text-left text-sm font-bold text-zinc-700 hover:bg-zinc-50 flex items-center justify-between"
                  >
                    {h.cell} {form.cell === h.cell && <Check weight="bold" className="text-emerald-500" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Row 3: Manual Hierarchy Overrides & Academic Level */}
      <div className="col-span-4 space-y-1.5">
        <Label>Senior Cell</Label>
        <GlassInput value={form.seniorCell} onChange={(e:any) => setForm({...form, seniorCell: e.target.value})} />
      </div>
      <div className="col-span-4 space-y-1.5">
        <Label>Team</Label>
        <GlassInput value={form.team} onChange={(e:any) => setForm({...form, team: e.target.value})} />
      </div>
      <div className="col-span-4 space-y-1.5">
        <Label>Level</Label>
        <GlassInput value={form.level} onChange={(e:any) => setForm({...form, level: e.target.value})} />
      </div>

      {/* Row 4: Typeable Role Combobox & Departments */}
      <div className="col-span-6 space-y-1.5 relative">
        <Label>Role</Label>
        <div className="relative">
          <GlassInput 
            value={form.role} 
            onChange={(e:any) => { setForm({...form, role: e.target.value}); setDropdowns({...dropdowns, role: true}); }}
            onFocus={() => setDropdowns({...dropdowns, role: true})}
            onBlur={() => setTimeout(() => setDropdowns({...dropdowns, role: false}), 200)}
          />
          <CaretDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          
          <AnimatePresence>
            {dropdowns.role && filteredRoles.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-2xl shadow-2xl z-[100] border border-zinc-100 py-2 max-h-[200px] overflow-y-auto"
              >
                {filteredRoles.map(r => (
                  <button key={r} onClick={() => setForm({...form, role: r})}
                    className="w-full px-5 py-3 text-left text-sm font-bold text-zinc-700 hover:bg-zinc-50 flex items-center justify-between"
                  >
                    {r} {form.role === r && <Check weight="bold" className="text-emerald-500" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="col-span-3 space-y-1.5">
        <Label>Church Dept</Label>
        <GlassInput value={form.churchDept} onChange={(e:any) => setForm({...form, churchDept: e.target.value})} />
      </div>
      <div className="col-span-3 space-y-1.5">
        <Label>School Dept</Label>
        <GlassInput value={form.schoolDept} onChange={(e:any) => setForm({...form, schoolDept: e.target.value})} />
      </div>

      <div className="col-span-12 mt-4">
        <Button onClick={() => onSubmit(form)} 
          className="w-full h-16 rounded-full bg-zinc-950 text-white hover:bg-black text-lg font-black shadow-2xl transition-all active:scale-[0.98]"
        >
          {initialData ? "Update Member" : "Confirm Entry"}
        </Button>
      </div>
    </div>
  );
};

export const FirstTimerForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [form, setForm] = useState({
    name: "", sex: "Male", birthday: "", schoolDept: "", level: "", address: "", 
    phone: "", email: "", invitedBy: "", isMember: "No", visitDate: ""
  });

  return (
    <div className="grid grid-cols-12 gap-x-4 gap-y-4">
      <div className="col-span-9 space-y-1.5">
        <Label>Full Names</Label>
        <GlassInput value={form.name} onChange={(e:any) => setForm({...form, name: e.target.value})} />
      </div>
      <div className="col-span-3 space-y-1.5">
        <Label>Sex</Label>
        <PillToggle value={form.sex} onChange={(val) => setForm({...form, sex: val})} />
      </div>
      <div className="col-span-4 space-y-1.5">
        <Label>Phone</Label>
        <GlassInput value={form.phone} onChange={(e:any) => setForm({...form, phone: e.target.value})} />
      </div>
      <div className="col-span-5 space-y-1.5">
        <Label>Email</Label>
        <GlassInput value={form.email} onChange={(e:any) => setForm({...form, email: e.target.value})} />
      </div>
      <div className="col-span-3 space-y-1.5">
        <Label>Birthday</Label>
        <GlassInput value={form.birthday} onChange={(e:any) => setForm({...form, birthday: e.target.value})} placeholder="DD/MM" />
      </div>
      <div className="col-span-12 space-y-1.5">
        <Label>Address in School</Label>
        <GlassInput value={form.address} onChange={(e:any) => setForm({...form, address: e.target.value})} />
      </div>
      <div className="col-span-6 space-y-1.5">
        <Label>Invited By</Label>
        <GlassInput value={form.invitedBy} onChange={(e:any) => setForm({...form, invitedBy: e.target.value})} />
      </div>
      <div className="col-span-3 space-y-1.5">
        <Label>Level</Label>
        <GlassInput value={form.level} onChange={(e:any) => setForm({...form, level: e.target.value})} />
      </div>
      <div className="col-span-3 space-y-1.5">
        <Label>Member?</Label>
        <GlassInput value={form.isMember} onChange={(e:any) => setForm({...form, isMember: e.target.value})} />
      </div>
      <div className="col-span-12 space-y-1.5">
        <Label>Visit Preference</Label>
        <GlassInput value={form.visitDate} onChange={(e:any) => setForm({...form, visitDate: e.target.value})} />
      </div>
      <div className="col-span-12 mt-4">
        <Button onClick={() => onSubmit(form)} 
          className="w-full h-16 rounded-full bg-zinc-950 text-white hover:bg-black text-lg font-black shadow-2xl transition-all active:scale-[0.98]"
        >
          Welcome First-Timer
        </Button>
      </div>
    </div>
  );
};