"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";
import { MemberList } from "@/components/MemberList";
import { AddMemberModal } from "@/components/AddMemberModal";
import { useMembers } from "@/hooks/use-members";
import { MagnifyingGlass, Pulse, Plus } from "@phosphor-icons/react";

export default function PFCCDashboard() {
  const { filteredMembers, signedInIds, searchQuery, setSearchQuery, addMember, markPresent } = useMembers();
  const [service, setService] = useState("Sunday");

  return (
    // Added z-0 to the main container to establish a base layer
    <div className="min-h-screen bg-[#FDFBFC] p-6 md:p-12 font-unio max-w-[1600px] mx-auto relative z-0">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-20">
        <Logo />
        <div className="bg-zinc-100 p-2 rounded-2xl flex gap-2">
          {["Sunday", "Mid-Week"].map((s) => (
            <button
              key={s}
              onClick={() => setService(s)}
              className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${
                service === s ? "bg-white text-black shadow-lg" : "opacity-30"
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <div className="flex flex-col gap-8 mb-10">
            <div>
              <h1 className="text-6xl font-black tracking-tighter">Attendance</h1>
              <p className="text-xs font-bold opacity-30 uppercase tracking-[0.4em] mt-2">{service} Session</p>
            </div>
            
            {/* Long Search Bar - FIXED FOCUS */}
            <div className="relative w-full max-w-2xl group">
              <MagnifyingGlass className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20" size={24} />
              <input 
                placeholder="Search name or cell..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                /* Swapped focus:border-black for our signature pearl glow */
                className="h-16 w-full pl-16 bg-white border border-zinc-100 rounded-3xl font-medium text-lg focus:border-pearl-pink focus:ring-4 focus:ring-pearl-pink/20 outline-none shadow-sm transition-all" 
              />
            </div>
          </div>
          
          <MemberList members={filteredMembers} signedInIds={signedInIds} onMarkPresent={markPresent} />
        </div>

        <div className="lg:col-span-4">
          {/* Lowered z-index here to stay behind modals */}
          <div className="sticky top-12 space-y-8 z-10">
            {/* Changed from bg-black to bg-zinc-900 for a softer, premium look */}
            <div className="bg-zinc-900 text-white p-12 rounded-[3rem] flex flex-col items-center text-center shadow-2xl border border-white/5">
              <Pulse size={32} className="text-emerald-400 mb-4 animate-pulse" />
              <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.5em] mb-2">Live Count</span>
              <span className="text-9xl font-black tracking-tighter leading-none">{signedInIds.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) - High Z-index */}
      <div className="fixed bottom-12 right-12 z-50">
        <AddMemberModal onAdd={(data) => addMember(data.name, data.cell)} />
      </div>
    </div>
  );
}