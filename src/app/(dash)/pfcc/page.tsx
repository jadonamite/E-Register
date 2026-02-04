import { Logo } from "@/components/Logo"; 
import { MemberList } from "@/components/MemberList"; // Import the search list
import { Button } from "@/components/ui/button";
import { mockMembers } from "@/lib/mock-data";

export default function PFCCDashboard() {
  return (
    <div className="min-h-screen bg-iridescent p-4 md:p-10 space-y-6">
      
      {/* 1. TOP HEADER: Where your logo lives */}
      <header className="flex justify-between items-center">
        <Logo /> 
        <div className="glass-card px-4 py-2 text-sm font-bold">Sunday Service</div>
      </header>

      {/* 2. THE BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* BIG TILE: The Sign-In Register */}
        <div className="glass-card md:col-span-2 h-[600px] p-6">
          <h2 className="text-xl font-bold mb-4">Member Register</h2>
          {/* This is where the Search & Tap logic lives */}
          <MemberList members={mockMembers} /> 
        </div>

        {/* SMALL TILE: Stats */}
        <div className="glass-card p-6 flex flex-col justify-center items-center">
          <h3 className="text-sm font-bold opacity-50 uppercase">Today's Attendance</h3>
          <p className="text-6xl font-black text-black">+14</p>
        </div>

      </div>
    </div>
  );
}