"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { MemberList } from "@/components/MemberList";
import { mockMembers } from "@/lib/mock-data";
import { Users, MagnifyingGlass, Activity, UserPlus } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";

export default function PFCCDashboard() {
  const [service, setService] = useState("Sunday");
  const [searchQuery, setSearchQuery] = useState("");
  const [signedInIds, setSignedInIds] = useState<number[]>([]);

  // Real-time Search Logic
  const filteredMembers = useMemo(() => {
    return mockMembers.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.cell.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleMarkPresent = (id: number) => {
    if (!signedInIds.includes(id)) {
      setSignedInIds(prev => [...prev, id]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] relative overflow-hidden p-4 md:p-10 font-unio">
      {/* ATMOSPHERE BLOBS */}
      <div className="atmosphere">
        <div className="blob w-[600px] h-[600px] bg-pearl-pink/15 -top-40 -right-20" />
        <div className="blob w-[500px] h-[500px] bg-pearl-gold/15 -bottom-20 -left-20" />
      </div>

      <div className="max-w-7xl mx-auto z-10 relative">
        {/* TOP NAV BENTO */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <Logo />
          
          <div className="glass-tile p-1.5 flex gap-1 shadow-sm">
            {["Sunday", "Mid-Week"].map((type) => (
              <button
                key={type}
                onClick={() => setService(type)}
                className={`px-8 py-2.5 rounded-xl text-[10px] font-black transition-all tracking-widest ${
                  service === type 
                  ? "bg-white text-black shadow-md scale-105" 
                  : "opacity-30 hover:opacity-60"
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* REGISTER SECTION (Focus) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-tile p-8 min-h-[650px] flex flex-col"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">{service} Register</h2>
                  <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.3em]">Attendance Management</p>
                </div>

                {/* SEARCH COMPONENT */}
                <div className="relative w-full md:w-72 group">
                  <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity" size={20} />
                  <Input 
                    placeholder="Search name or cell..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 pl-12 bg-black/5 border-none rounded-2xl text-sm focus:bg-white/50 transition-all shadow-inner"
                  />
                </div>
              </div>

              <MemberList 
                members={filteredMembers} 
                signedInIds={signedInIds}
                onMarkPresent={handleMarkPresent} 
              />
            </motion.div>
          </div>

          {/* STATS SECTION */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* FOCUS AREA: SIGNED IN COUNT */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="glass-tile p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group border-pearl-pink/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pearl-pink/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Activity size={32} weight="duotone" className="text-pink-400 mb-3" />
              <p className="text-xs font-black opacity-40 uppercase tracking-[0.2em]">Signed In</p>
              <motion.span 
                key={signedInIds.length}
                initial={{ scale: 1.2, color: "#fce4ec" }}
                animate={{ scale: 1, color: "#000" }}
                className="text-8xl font-black mt-2 tracking-tighter"
              >
                {signedInIds.length}
              </motion.span>
            </motion.div>

            {/* TOTAL MEMBERS COUNT */}
            <div className="glass-tile p-8 flex items-center justify-between group">
              <div>
                <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">Total Database</p>
                <p className="text-3xl font-black">{mockMembers.length}</p>
              </div>
              <Users size={40} weight="duotone" className="opacity-10 group-hover:opacity-30 transition-opacity" />
            </div>

            {/* NEW CONVERT BUTTON */}
            <motion.button 
              whileTap={{ scale: 0.95 }}
              className="glass-tile p-6 bg-white shadow-xl flex items-center justify-between group border-pearl-gold/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-pearl-gold/30 flex items-center justify-center group-hover:rotate-90 transition-transform">
                  <UserPlus size={24} weight="bold" />
                </div>
                <span className="font-black text-sm uppercase tracking-tight">New Convert</span>
              </div>
            </motion.button>

          </div>
        </div>
      </div>
    </div>
  );
}