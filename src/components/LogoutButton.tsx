"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";

export function LogoutButton({ className = "" }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      title="Sign out"
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50 ${className}`}
    >
      <SignOut size={16} weight="bold" />
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
