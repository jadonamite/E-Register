"use client";

import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { MemberList } from "@/components/MemberList";
import { AddMemberModal } from "@/components/AddMemberModal";
import { useMembers } from "@/hooks/use-members";
import { MagnifyingGlass, Pulse, CalendarBlank, Plus, Monitor, WarningCircle } from "@phosphor-icons/react";
import { format } from "date-fns";

export default function PFCCDashboard() {
  const [service, setService] = useState("Sunday");
  const [date, setDate] = useState<Date>(new Date());
  const [isMobile, setIsMobile] = useState(false);
  
  const [editingMember, setEditingMember] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Check for mobile viewport on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 960); // Setting 1024px as the cutoff for a complex dashboard
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { 
    filteredMembers, 
    signedInIds, 
    searchQuery, 
    setSearchQuery, 
    addMember, 
    updateMember, 
    markPresent 
  } = useMembers(service, date);

  const handleEditInitiated = (member: any) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  // 2. Mobile Access Restricted UI
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#FDFBFC] flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-8 scale-125">
          <Logo />
        </div>
        <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mb-6 text-zinc-400">
          <Monitor size={40} weight="duotone" />
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-stone-900 mb-2">Desktop Only</h1>
        <p className="text-sm font-medium text-stone-500 max-w-[280px] leading-relaxed">
          The PFCC Attendance Register is optimized for larger screens to ensure data accuracy and speed.
        </p>
        <div className="mt-10 flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full border border-amber-100">
          <WarningCircle size={16} className="text-amber-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Access Restricted</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBFC] p-6 md:p-12 font-sans max-w-[1600px] mx-auto relative z-0">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12">
        <Logo />
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <CalendarBlank size={18} className="text-stone-400" />
            </div>
            <input 
              type="date"
              value={format(date, "yyyy-MM-dd")}
              onChange={(e) => setDate(new Date(e.target.value))}
              className="pl-12 pr-6 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-stone-700 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none shadow-sm hover:border-stone-300 transition-all uppercase tracking-wider cursor-pointer"
            />
          </div>

          <div className="bg-zinc-100 p-1.5 rounded-xl flex gap-1">
            {["Sunday", "Mid-Week"].map((s) => (
              <button
                key={s}
                onClick={() => setService(s)}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  service === s ? "bg-white text-black shadow-sm" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <div className="flex flex-col gap-8 mb-10">
            <div>
              <h1 className="text-6xl font-black tracking-tighter text-stone-900">Attendance</h1>
              <div className="flex items-center gap-3 mt-2 opacity-40">
                <span className="text-xs font-bold uppercase tracking-[0.4em]">{service} Session</span>
                <span className="w-1 h-1 bg-black rounded-full" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">{format(date, "MMMM d, yyyy")}</span>
              </div>
            </div>
            
            <div className="relative w-full max-w-2xl group">
              <MagnifyingGlass className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20" size={24} />
              <input 
                placeholder="Search name or cell..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-16 w-full pl-16 bg-white border border-zinc-100 rounded-3xl font-medium text-lg focus:border-stone-300 focus:ring-4 focus:ring-stone-100 outline-none shadow-sm transition-all text-stone-800 placeholder:text-stone-300" 
              />
            </div>
          </div>
          
          <MemberList 
            members={filteredMembers} 
            signedInIds={signedInIds} 
            onMarkPresent={markPresent}
            onEdit={handleEditInitiated}
          />
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-12 space-y-8 z-10">
            <div className="bg-stone-900 text-white p-12 rounded-[3rem] flex flex-col items-center text-center shadow-2xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-stone-800 to-stone-900 -z-10" />
              
              <Pulse size={32} className="text-emerald-400 mb-4 animate-pulse" />
              <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.5em] mb-2">Live Count</span>
              <span className="text-9xl font-black tracking-tighter leading-none">{signedInIds.length}</span>
              
              <div className="mt-8 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">
                  {format(date, "MMM do")} Record
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-12 right-12 z-50">
        <AddMemberModal 
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          initialData={editingMember}
          onAdd={async (data) => {
            if (editingMember) {
              await updateMember(data);
            } else {
              await addMember(data);
            }
          }} 
        />
        
        {!isModalOpen && (
          <button 
            onClick={handleAddNew}
            className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-90 transition-all"
          >
            <Plus size={36} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
}