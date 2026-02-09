import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Restoration of your HIERARCHY_DATA
const HIERARCHY_DATA = [
  { cell: "Marvelous", seniorCell: "Harvesters", team: "The Winning Team" },
  { cell: "Zion", seniorCell: "Harvesters", team: "The Winning Team" },
  { cell: "Grace", seniorCell: "Eagles", team: "The Winning Team" },
];

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

// Compact Pill Toggle (Image 3 style)
const CompactToggle = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const isMale = value === "Male";
  return (
    <div 
      onClick={() => onChange(isMale ? "Female" : "Male")}
      className="relative w-24 h-10 bg-black/10 rounded-full p-1 flex items-center cursor-pointer overflow-hidden border border-white/20"
    >
      <motion.div 
        className="absolute h-8 w-11 bg-white rounded-full shadow-sm z-0"
        animate={{ x: isMale ? 0 : 40 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
      <span className={cn("relative z-10 flex-1 text-center text-[9px] font-black transition-colors", isMale ? "text-black" : "text-zinc-500")}>M</span>
      <span className={cn("relative z-10 flex-1 text-center text-[9px] font-black transition-colors", !isMale ? "text-black" : "text-zinc-500")}>F</span>
    </div>
  );
};

export const ExistingForm = ({ onSubmit, initialData }: { onSubmit: (data: any) => void, initialData?: any }) => {
  const [form, setForm] = useState(initialData || { 
    name: "", phone: "", sex: "Male", cell: "", seniorCell: "", team: "", schoolDept: "", churchDept: "", level: "", role: "Member" 
  });

  useEffect(() => {
    const match = HIERARCHY_DATA.find(h => h.cell === form.cell);
    if (match) {
      setForm((prev: any) => ({ ...prev, seniorCell: match.seniorCell, team: match.team }));
    }
  }, [form.cell]);

  return (
    <div className="grid grid-cols-12 gap-x-4 gap-y-5">
      <div className="col-span-8 space-y-1.5">
        <Label>Full Names</Label>
        <GlassInput value={form.name} onChange={(e:any) => setForm({...form, name: e.target.value})} />
      </div>
      
      <div className="col-span-4 space-y-1.5">
        <Label>Sex</Label>
        <CompactToggle value={form.sex} onChange={(val) => setForm({...form, sex: val})} />
      </div>

      <div className="col-span-6 space-y-1.5">
        <Label>Phone Number</Label>
        <GlassInput value={form.phone} onChange={(e:any) => setForm({...form, phone: e.target.value})} />
      </div>

      <div className="col-span-6 space-y-1.5">
        <Label>Cell Name</Label>
        <select 
          className="w-full h-12 px-5 rounded-2xl border-none bg-white/40 text-zinc-950 text-sm font-bold outline-none"
          value={form.cell}
          onChange={(e) => setForm({...form, cell: e.target.value})}
        >
          <option value="">Select Cell</option>
          {HIERARCHY_DATA.map(h => <option key={h.cell} value={h.cell}>{h.cell}</option>)}
        </select>
      </div>

      <div className="col-span-4 space-y-1.5 opacity-60">
        <Label>Senior Cell</Label>
        <GlassInput value={form.seniorCell} readOnly />
      </div>
      <div className="col-span-4 space-y-1.5 opacity-60">
        <Label>Team</Label>
        <GlassInput value={form.team} readOnly />
      </div>
      <div className="col-span-4 space-y-1.5">
        <Label>Level</Label>
        <GlassInput value={form.level} onChange={(e:any) => setForm({...form, level: e.target.value})} />
      </div>

      <div className="col-span-6 space-y-1.5">
        <Label>Role</Label>
        <select 
          className="w-full h-12 px-5 rounded-2xl border-none bg-white/40 text-zinc-950 text-sm font-bold outline-none"
          value={form.role}
          onChange={(e) => setForm({...form, role: e.target.value})}
        >
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="col-span-3 space-y-1.5">
        <Label>Church Dept</Label>
        <GlassInput value={form.churchDept} onChange={(e:any) => setForm({...form, churchDept: e.target.value})} />
      </div>
      <div className="col-span-3 space-y-1.5">
        <Label>School Dept</Label>
        <GlassInput value={form.schoolDept} onChange={(e:any) => setForm({...form, schoolDept: e.target.value})} />
      </div>

      <div className="col-span-12 mt-2">
        <Button 
          onClick={() => onSubmit(form)} 
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
      <div className="col-span-8 space-y-1.5">
        <Label>Full Names</Label>
        <GlassInput value={form.name} onChange={(e:any) => setForm({...form, name: e.target.value})} />
      </div>
      <div className="col-span-4 space-y-1.5">
        <Label>Sex</Label>
        <CompactToggle value={form.sex} onChange={(val) => setForm({...form, sex: val})} />
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
        <Button 
          onClick={() => onSubmit(form)} 
          className="w-full h-16 rounded-full bg-zinc-950 text-white hover:bg-black text-lg font-black shadow-2xl transition-all active:scale-[0.98]"
        >
          Welcome First-Timer
        </Button>
      </div>
    </div>
  );
};