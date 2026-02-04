"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { MemberList } from "@/components/MemberList";
import { AddMemberDrawer } from "@/components/AddMemberDrawer";
import { useMembers } from "@/hooks/use-members";
import { MagnifyingGlassIcon, ChartLineUpIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";

export default function PFCCDashboard() {
  const { 
    filteredMembers, 
    signedInIds, 
    searchQuery, 
    setSearchQuery, 
    addMember, 
    markPresent,
    totalCount 
  } = useMembers();

  return (
    <div className="min-h-screen relative bg-[#F9FAFB] p-4 md:p-10 overflow-hidden">
      <div className="atmosphere">
        <div className="blob w-[600px] h-[600px] bg-pearl-pink/15 -top-40 -right-20" />
      </div>

      <div className="max-w-7xl mx-auto z-10 relative">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <Logo />
          <div className="glass-tile px-6 py-2.5 text-[10px] font-black tracking-widest bg-white shadow-sm">
            SUNDAY SERVICE
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-tile p-8 min-h-[650px] flex flex-col">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                <h2 className="text-3xl font-black tracking-tight shrink-0">Register</h2>
                <div className="relative w-full md:w-72">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={20} />
                  <Input placeholder="Search name or cell..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-12 pl-12 bg-black/5 border-none rounded-2xl" />
                </div>
              </div>
              <MemberList members={filteredMembers} signedInIds={signedInIds} onMarkPresent={markPresent} />
            </motion.div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-tile p-10 flex flex-col items-center text-center">
              <ChartLineUpIcon size={32} className="text-pink-400 mb-3" />
              <p className="text-xs font-black opacity-40 uppercase">Signed In</p>
              <span className="text-8xl font-black mt-2">{signedInIds.length}</span>
            </div>
            
            <div className="glass-tile p-8 flex items-center justify-between opacity-50">
              <p className="text-[10px] font-black uppercase tracking-widest">Total Database: {totalCount}</p>
            </div>

            <AddMemberDrawer onAdd={addMember} />
          </div>
        </div>
      </div>
    </div>
  );
}