"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { MemberList } from "@/components/MemberList";
import { mockMembers } from "@/lib/mock-data";
import { Users, Calendar } from "@phosphor-icons/react";

export default function PFCCDashboard() {
  const [service, setService] = useState("Sunday"); // Sunday or Mid-Week

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 relative overflow-hidden">
      <div className="atmosphere">
        <div className="blob w-[500px] h-[500px] bg-pearl-pink/10 -top-40 -right-20" />
      </div>

      <div className="max-w-7xl mx-auto z-10 relative">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <Logo />
          
          {/* SERVICE SELECTOR POP */}
          <div className="glass-tile p-1.5 flex gap-1">
            {["Sunday", "Mid-Week"].map((type) => (
              <button
                key={type}
                onClick={() => setService(type)}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
                  service === type 
                  ? "bg-white text-black shadow-sm scale-105" 
                  : "opacity-40 hover:opacity-100"
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="glass-tile lg:col-span-8 p-8 min-h-[600px]">
            <div className="mb-8">
              <h2 className="text-2xl font-black">{service} Register</h2>
              <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">Mark Attendance</p>
            </div>
            <MemberList members={mockMembers} onMarkPresent={() => {}} />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="glass-tile p-10 flex flex-col items-center justify-center">
              <Users size={32} weight="duotone" className="opacity-20 mb-2" />
              <p className="text-7xl font-black">+14</p>
              <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Signed In</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}