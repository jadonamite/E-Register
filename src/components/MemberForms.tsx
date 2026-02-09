import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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

// --- Types & Constants ---
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

// --- Shared Sub-Components ---

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

const GenderToggle = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => (
  <div className="flex p-1 bg-white/30 rounded-2xl backdrop-blur-md border border-white/20">
    {["Male", "Female"].map((s) => (
      <button
        key={s}
        type="button"
        onClick={() => onChange(s)}
        className={cn(
          "flex-1 py-3 rounded-xl text-sm font-black transition-all",
          value === s ? "bg-zinc-950 text-white shadow-lg scale-[1.02]" : "text-zinc-500 hover:text-zinc-800"
        )}
      >
        {s}
      </button>
    ))}
  </div>
);

// --- Main Form Components ---

export const ExistingForm = ({ onSubmit, initialData }: { onSubmit: (data: MemberFormValues) => void, initialData?: MemberFormValues }) => {
  const [openCell, setOpenCell] = useState(false);
  const [form, setForm] = useState<MemberFormValues>(initialData || { 
    name: "", phone: "", sex: "Male", cell: "", seniorCell: "", team: "", schoolDept: "", churchDept: "", level: "", role: "Member" 
  });

  // Smart Auto-fill Logic
  useEffect(() => {
    const match = HIERARCHY_DATA.find(h => h.cell === form.cell);
    if (match) {
      setForm((prev: MemberFormValues) => ({ ...prev, seniorCell: match.seniorCell, team: match.team }));
    }
  }, [form.cell]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Full Names</Label>
          <GlassInput value={form.name} onChange={(e:any) => setForm({...form, name: e.target.value})} placeholder="David Olatunji..." />
        </div>
        
        <div className="col-span-2 space-y-1.5">
          <Label>Phone Number (Required)</Label>
          <GlassInput type="tel" value={form.phone} onChange={(e:any) => setForm({...form, phone: e.target.value})} placeholder="08012345678" />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Sex</Label>
          <GenderToggle value={form.sex} onChange={(val) => setForm({...form, sex: val})} />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Cell (Search or Type)</Label>
          <Popover open={openCell} onOpenChange={setOpenCell}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full h-12 justify-between rounded-2xl bg-white/40 border-none text-zinc-950 font-bold px-5">
                {form.cell || "Select Cell..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 border-none rounded-2xl shadow-2xl">
              <Command>
                <CommandInput placeholder="Search cell..." />
                <CommandList>
                  <CommandEmpty>No cell found.</CommandEmpty>
                  <CommandGroup>
                    {HIERARCHY_DATA.map((h) => (
                      <CommandItem key={h.cell} onSelect={() => { setForm({ ...form, cell: h.cell }); setOpenCell(false); }}>
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

        <div className="space-y-1.5">
          <Label>Senior Cell</Label>
          <GlassInput value={form.seniorCell} readOnly placeholder="Auto-filled" className="opacity-60 cursor-not-allowed" />
        </div>
        <div className="space-y-1.5">
          <Label>Team</Label>
          <GlassInput value={form.team} readOnly placeholder="Auto-filled" className="opacity-60 cursor-not-allowed" />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>System Role</Label>
          <select 
            className="w-full h-12 px-5 rounded-2xl border-none bg-white/40 text-zinc-950 text-sm font-bold focus:ring-2 focus:ring-black/10 outline-none appearance-none cursor-pointer"
            value={form.role}
            onChange={(e) => setForm({...form, role: e.target.value})}
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="space-y-1.5 text-zinc-950">
          <Label>Church Dept</Label>
          <GlassInput value={form.churchDept} onChange={(e:any) => setForm({...form, churchDept: e.target.value})} />
        </div>
        <div className="space-y-1.5 text-zinc-950">
          <Label>School Dept</Label>
          <GlassInput value={form.schoolDept} onChange={(e:any) => setForm({...form, schoolDept: e.target.value})} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Academic Level</Label>
          <GlassInput value={form.level} onChange={(e:any) => setForm({...form, level: e.target.value})} placeholder="500" />
        </div>
      </div>
      <SubmitButton label={initialData ? "Update Member" : "Confirm Entry"} onClick={() => onSubmit(form)} />
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
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Full Names</Label>
          <GlassInput value={form.name} onChange={(e:any) => setForm({...form, name: e.target.value})} />
        </div>
        
        <div className="col-span-2 space-y-1.5">
          <Label>Sex</Label>
          <GenderToggle value={form.sex} onChange={(val) => setForm({...form, sex: val})} />
        </div>

        <div className="space-y-1.5">
          <Label>Birthday</Label>
          <GlassInput value={form.birthday} onChange={(e:any) => setForm({...form, birthday: e.target.value})} placeholder="DD/MM" />
        </div>

        <div className="space-y-1.5">
          <Label>Phone (Required)</Label>
          <GlassInput value={form.phone} onChange={(e:any) => setForm({...form, phone: e.target.value})} />
        </div>
        
        <div className="col-span-2 space-y-1.5">
          <Label>Address in School</Label>
          <GlassInput value={form.address} onChange={(e:any) => setForm({...form, address: e.target.value})} />
        </div>
      </div>
      <SubmitButton label="Welcome First-Timer" onClick={() => onSubmit(form)} />
    </div>
  );
};

const SubmitButton = ({ label, onClick }: { label: string, onClick: () => void }) => (
  <Button onClick={onClick} className="w-full h-16 rounded-[2rem] bg-zinc-950 text-white hover:bg-black text-lg font-black shadow-2xl transition-all active:scale-[0.98] mt-2">
    {label}
  </Button>
);