"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { ConnectivityEffect } from "@/components/exec/ConnectivityEffect";
import { WeeklyAccountability } from "@/components/exec/WeeklyAccountability";
import { PromptnessHierarchy } from "@/components/exec/PromptnessHierarchy";
import { GearSix } from "@phosphor-icons/react";
import Link from "next/link";
import { format } from "date-fns";
import { LogoutButton } from "@/components/LogoutButton";

export default function ExecutiveDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) setData(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchStats();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Logo />
        <p className="text-[10px] font-black tracking-widest opacity-30 uppercase font-unio">Loading Command Center...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-8 font-unio max-w-[1360px] mx-auto relative overflow-hidden">

      <div className="atmosphere">
        <div className="blob w-[480px] h-[480px] bg-pink-200 -top-40 -left-40" />
        <div className="blob w-[420px] h-[420px] bg-amber-100 top-1/3 -right-32" style={{ animationDelay: "-7s" }} />
        <div className="blob w-[440px] h-[440px] bg-emerald-100 bottom-0 left-1/4" style={{ animationDelay: "-13s" }} />
      </div>

      <ConnectivityEffect />

      <div className="relative z-10">
        <header className="flex justify-between items-center mb-10 pl-2">
          <Logo />
          <div className="flex items-center gap-3">
            <div className="glass-frosted px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 hidden sm:block">
              {format(new Date(), "MMM yyyy")}
            </div>
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
            >
              <GearSix size={18} weight="duotone" /> Admin
            </Link>
            <LogoutButton />
          </div>
        </header>

        {/* WEEKLY ACCOUNTABILITY — mosaic, trend band, leaderboard */}
        <WeeklyAccountability trend={data?.trend} />

        {/* PROMPTNESS */}
        <div className="mt-6">
          <div className="candy-card bg-white p-6 sm:p-8">
            <PromptnessHierarchy />
          </div>
        </div>
      </div>
    </div>
  );
}
