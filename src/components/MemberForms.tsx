import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion"; // Added for smooth transitions
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type MemberFormValues = {
  _id?: string;
  name: string;
  phone: string;
  sex: string;
  cell: string;
  seniorCell: string;
  team: string;
  schoolDept: string;
  churchDept: string;
  level: string;
  role: string;
};

const HIERARCHY_DATA = [
  { cell: "Marvelous", seniorCell: "Harvesters", team: "The Winning Team" },
  { cell: "Zion", seniorCell: "Harvesters", team: "The Winning Team" },
  { cell: "Grace", seniorCell: "Eagles", team: "The Winning Team" },
];

const ROLES = ["Member", "BST", "Cell Leader", "Senior Cell Leader", "Team Lead", "Pastor"];

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[11px] font-black text-zinc-950/40 uppercase ml-2 tracking-[0.2em]">
    {children}
  </label>
);

const GlassInput = (props: any) => (
  <Input 
    {...props} 
    className="h-14 px-6 rounded-[1.25rem] border-none bg-black/[0.03] focus:bg-white text-zinc-950 placeholder:text-zinc-400 transition-all ring-1 ring-black/[0.05] focus-visible:ring-black focus-visible:ring-offset-0 text-sm font-bold" 
  />
);

// --- NEW BEAUTIFUL GENDER SWITCH ---
const GenderSwitch = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const isMale = value === "Male";

  return (
    <div className="relative w-full h-14 bg-black/[0.05] rounded-[1.25rem] p-1.5 flex items-center cursor-pointer select-none" onClick={() => onChange(isMale ? "Female" : "Male")}>
      {/* Sliding Pill Background */}
      <motion.div 
        className="absolute h-[calc(100%-12px)] w-[calc(50%-6px)] bg-white rounded-xl shadow-sm z-0"
        animate={{ x: isMale ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      
      <div className="relative z-10 flex-1 text-center text-[11px] font-black tracking-widest transition-colors duration-200" style={{ color: isMale ? "#000" : "#A1A1AA" }}>
        MALE
      </div>
      <div className="relative z-10 flex-1 text-center text-[11px] font-black tracking-widest transition-colors duration-200" style={{ color: !isMale ? "#000" : "#A1A1AA" }}>
        FEMALE
      </div>
    </div>
  );
};

export const ExistingForm = ({ onSubmit, initialData }: { onSubmit: (data: MemberFormValues) => void, initialData?: MemberFormValues }) => {
  const [openCell, setOpenCell] = useState(false);
  const [form, setForm] = useState<MemberFormValues>(initialData || { 
    name: "", phone: "", sex: "Male", cell: "", seniorCell: "", team: "", schoolDept: "", churchDept: "", level: "", role: "Member" 
  });

  useEffect(() => {
    const match = HIERARCHY_DATA.find(h => h.cell === form.cell);
    if (match) {
      setForm((prev: MemberFormValues) => ({ ...prev, seniorCell: match.seniorCell, team: match.team }));
    }
  }, [form.cell]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-5">
        <div className="col-span-2 space-y-2">
          <Label>Full Names</Label>
          <GlassInput value={form.name} onChange={(e:any) => setForm({...form, name: e.target.value})} placeholder="e.g. Omolayo Temitayo" />
        </div>
        
        <div className="col-span-2 space-y-2">
          <Label>Phone Number</Label>
          <GlassInput type="tel" value={form.phone} onChange={(e:any) => setForm({...form, phone: e.target.value})} placeholder="080..." />
        </div>

        <div className="col-span-2 space-y-2">
          <Label>Sex / Gender</Label>
          <GenderSwitch value={form.sex} onChange={(val) => setForm({...form, sex: val})} />
        </div>

        <div className="col-span-2 space-y-2">
          <Label>Cell Fellowship</Label>
          <Popover open={openCell} onOpenChange={setOpenCell}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full h-14 justify-between rounded-[1.25rem] bg-black/[0.03] border-none text-zinc-950 font-bold px-6">
                {form.cell || "Select Cell..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-30" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 rounded-2xl border-none shadow-2xl">
              <Command>
                <CommandInput placeholder="Search cells..." className="h-12 border-none ring-0" />
                <CommandList>
                  <CommandEmpty>No cell found.</CommandEmpty>
                  <CommandGroup>
                    {HIERARCHY_DATA.map((h) => (
                      <CommandItem key={h.cell} onSelect={() => { setForm({ ...form, cell: h.cell }); setOpenCell(false); }} className="py-3 px-4 font-medium">
                        <Check className={cn("mr-2 h-4 w-4", form.cell === h.cell ? "opacity-100" : "opacity-0")} />
                        {h.cell}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2 opacity-50">
          <Label>Senior Cell</Label>
          <GlassInput value={form.seniorCell} readOnly />
        </div>
        <div className="space-y-2 opacity-50">
          <Label>Team</Label>
          <GlassInput value={form.team} readOnly />
        </div>

        <div className="col-span-2 space-y-2">
          <Label>System Role</Label>
          <select 
            className="w-full h-14 px-6 rounded-[1.25rem] border-none bg-black/[0.03] text-zinc-950 text-sm font-bold outline-none cursor-pointer"
            value={form.role}
            onChange={(e) => setForm({...form, role: e.target.value})}
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Church Dept</Label>
          <GlassInput value={form.churchDept} onChange={(e:any) => setForm({...form, churchDept: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>School Dept</Label>
          <GlassInput value={form.schoolDept} onChange={(e:any) => setForm({...form, schoolDept: e.target.value})} />
        </div>
      </div>
      
      <Button 
        onClick={() => onSubmit(form)} 
        className="w-full h-16 rounded-[1.5rem] bg-zinc-950 text-white hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-black tracking-widest mt-4 uppercase"
      >
        {initialData ? "Apply Changes" : "Confirm Entry"}
      </Button>
    </div>
  );
};

export const FirstTimerForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [form, setForm] = useState({
    name: "", sex: "Male", birthday: "", schoolDept: "", level: "", address: "", 
    phone: "", email: "", invitedBy: "", isMember: "", visitDate: ""
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-5">
        <div className="col-span-2 space-y-2">
          <Label>Full Names</Label>
          <GlassInput value={form.name} onChange={(e:any) => setForm({...form, name: e.target.value})} />
        </div>
        
        <div className="col-span-2 space-y-2">
          <Label>Gender</Label>
          <GenderSwitch value={form.sex} onChange={(val) => setForm({...form, sex: val})} />
        </div>

        <div className="space-y-2">
          <Label>Birthday</Label>
          <GlassInput value={form.birthday} onChange={(e:any) => setForm({...form, birthday: e.target.value})} placeholder="DD/MM" />
        </div>

        <div className="space-y-2">
          <Label>Phone</Label>
          <GlassInput value={form.phone} onChange={(e:any) => setForm({...form, phone: e.target.value})} />
        </div>
      </div>
      <Button 
        onClick={() => onSubmit(form)} 
        className="w-full h-16 rounded-[1.5rem] bg-zinc-950 text-white hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-black tracking-widest mt-4 uppercase"
      >
        Welcome First-Timer
      </Button>
    </div>
  );
};