import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

export const ExistingForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [form, setForm] = useState({ 
    name: "", sex: "", cell: "", schoolDept: "", churchDept: "", level: "", role: "Base Member" 
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Full Names</Label>
          <GlassInput value={form.name} onChange={(e:any) => setForm({...form, name: e.target.value})} placeholder="David Olatunji..." />
        </div>
        <div className="space-y-1.5"><Label>Sex</Label><GlassInput value={form.sex} onChange={(e:any) => setForm({...form, sex: e.target.value})} placeholder="Male/Female" /></div>
        <div className="space-y-1.5"><Label>Cell Name</Label><GlassInput value={form.cell} onChange={(e:any) => setForm({...form, cell: e.target.value})} placeholder="Zion" /></div>
        <div className="space-y-1.5"><Label>Church Dept</Label><GlassInput value={form.churchDept} onChange={(e:any) => setForm({...form, churchDept: e.target.value})} placeholder="Technical" /></div>
        <div className="space-y-1.5"><Label>School Dept (MET)</Label><GlassInput value={form.schoolDept} onChange={(e:any) => setForm({...form, schoolDept: e.target.value})} placeholder="MET" /></div>
        <div className="col-span-2 space-y-1.5"><Label>Academic Level</Label><GlassInput value={form.level} onChange={(e:any) => setForm({...form, level: e.target.value})} placeholder="500L" /></div>
      </div>
      <SubmitButton label="Confirm Entry" onClick={() => onSubmit(form)} />
    </div>
  );
};

export const FirstTimerForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [form, setForm] = useState({
    name: "", sex: "", birthday: "", schoolDept: "", level: "", address: "", 
    mobile: "", email: "", invitedBy: "", isMember: "", visitDate: "", targetDept: ""
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-x-4 gap-y-4">
        <div className="col-span-2 space-y-1.5"><Label>Names</Label><GlassInput value={form.name} onChange={(e:any) => setForm({...form, name: e.target.value})} /></div>
        <div className="space-y-1.5"><Label>Sex</Label><GlassInput value={form.sex} onChange={(e:any) => setForm({...form, sex: e.target.value})} /></div>
        
        <div className="space-y-1.5"><Label>Birthday</Label><GlassInput value={form.birthday} onChange={(e:any) => setForm({...form, birthday: e.target.value})} placeholder="DD/MM" /></div>
        <div className="space-y-1.5"><Label>Mobile</Label><GlassInput value={form.mobile} onChange={(e:any) => setForm({...form, mobile: e.target.value})} /></div>
        <div className="space-y-1.5"><Label>Email</Label><GlassInput value={form.email} onChange={(e:any) => setForm({...form, email: e.target.value})} /></div>
        
        <div className="space-y-1.5"><Label>Dept in School</Label><GlassInput value={form.schoolDept} onChange={(e:any) => setForm({...form, schoolDept: e.target.value})} /></div>
        <div className="space-y-1.5"><Label>Level</Label><GlassInput value={form.level} onChange={(e:any) => setForm({...form, level: e.target.value})} /></div>
        <div className="space-y-1.5"><Label>Invited By</Label><GlassInput value={form.invitedBy} onChange={(e:any) => setForm({...form, invitedBy: e.target.value})} /></div>
        
        <div className="col-span-2 space-y-1.5"><Label>Address in School</Label><GlassInput value={form.address} onChange={(e:any) => setForm({...form, address: e.target.value})} /></div>
        <div className="space-y-1.5"><Label>Member?</Label><GlassInput value={form.isMember} onChange={(e:any) => setForm({...form, isMember: e.target.value})} placeholder="Yes/No" /></div>
        
        <div className="col-span-2 space-y-1.5"><Label>Visit Preference</Label><GlassInput value={form.visitDate} onChange={(e:any) => setForm({...form, visitDate: e.target.value})} placeholder="When can we visit?" /></div>
        <div className="space-y-1.5"><Label>Target Dept</Label><GlassInput value={form.targetDept} onChange={(e:any) => setForm({...form, targetDept: e.target.value})} placeholder="e.g. Media" /></div>
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