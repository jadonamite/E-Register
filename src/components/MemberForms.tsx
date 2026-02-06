import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[11px] font-extrabold text-zinc-800 uppercase ml-2 tracking-widest">{children}</label>
);

const GlassInput = (props: any) => (
  <Input 
    {...props} 
    className="h-12 px-5 rounded-2xl border-none bg-white/40 focus:bg-white/70 text-zinc-950 placeholder:text-zinc-500 transition-all ring-0 focus-visible:ring-2 focus-visible:ring-black/5 text-sm font-medium" 
  />
);

export const ExistingForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 space-y-1.5"><Label>Full Names</Label><GlassInput placeholder="Enter member name..." /></div>
      <div className="space-y-1.5"><Label>Sex</Label><GlassInput placeholder="Male / Female" /></div>
      <div className="space-y-1.5"><Label>Mobile</Label><GlassInput placeholder="+234..." /></div>
      <div className="space-y-1.5"><Label>Dept</Label><GlassInput placeholder="MET" /></div>
      <div className="space-y-1.5"><Label>Level</Label><GlassInput placeholder="500L" /></div>
    </div>
    <SubmitButton label="Confirm Entry" onClick={() => onSubmit({})} />
  </div>
);

export const FirstTimerForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-3 gap-x-4 gap-y-3">
      <div className="col-span-2 space-y-1.5"><Label>Full Names</Label><GlassInput /></div>
      <div className="space-y-1.5"><Label>Sex</Label><GlassInput /></div>
      
      <div className="space-y-1.5"><Label>Birthday</Label><GlassInput placeholder="DD/MM" /></div>
      <div className="space-y-1.5"><Label>Mobile</Label><GlassInput /></div>
      <div className="space-y-1.5"><Label>Email</Label><GlassInput /></div>
      
      <div className="space-y-1.5"><Label>Dept in School</Label><GlassInput /></div>
      <div className="space-y-1.5"><Label>Level</Label><GlassInput /></div>
      <div className="space-y-1.5"><Label>Invited By</Label><GlassInput /></div>
      
      <div className="col-span-2 space-y-1.5"><Label>Address in School</Label><GlassInput /></div>
      <div className="space-y-1.5"><Label>Become Member?</Label><GlassInput placeholder="Yes / No" /></div>
      
      <div className="col-span-2 space-y-1.5"><Label>Visit Preference</Label><GlassInput placeholder="When can we visit?" /></div>
      <div className="space-y-1.5"><Label>Target Dept</Label><GlassInput placeholder="e.g. Media" /></div>
    </div>
    <SubmitButton label="Welcome First-Timer" onClick={() => onSubmit({})} />
  </div>
);

const SubmitButton = ({ label, onClick }: { label: string, onClick: () => void }) => (
  <Button onClick={onClick} className="w-full h-16 rounded-[2rem] bg-black text-white hover:bg-zinc-900 text-lg font-black shadow-xl transition-all active:scale-[0.98] mt-2">
    {label}
  </Button>
);