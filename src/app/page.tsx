"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight } from "@phosphor-icons/react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      // Code is verified server-side; the signed session cookie is set by the
      // API (httpOnly — the browser never sees the token or the code).
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: password }),
      });

      if (!res.ok) {
        // Surface the server's real reason (e.g. "Invalid access code").
        const { error: message } = await res.json().catch(() => ({ error: "" }));
        setError(true);
        setTimeout(() => setError(false), 500);
        toast.error(message || "Invalid access code");
        return;
      }

      toast.success("Access granted");
      router.push("/exec");
    } catch {
      // Network / server unreachable — distinct from a wrong code.
      setError(true);
      setTimeout(() => setError(false), 500);
      toast.error("Network error — check your connection and try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-background">
      
      {/* Visual Pop: Living Atmosphere Blobs */}
      {/* We use absolute positioning here so they sit BEHIND the card */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <motion.div 
          animate={{ 
            x: [0, 50, 0], 
            y: [0, 30, 0],
            scale: [1, 1.1, 1] 
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          // Ensure 'bg-pearl-pink' is defined in your Tailwind config or use a hex code like 'bg-[#ffd1dc]'
          className="absolute blob w-96 h-96 bg-pink-200/40 blur-3xl rounded-full -top-20 -left-20" 
        />
        <motion.div 
          animate={{ 
            x: [0, -40, 0], 
            y: [0, -60, 0],
            scale: [1, 1.2, 1] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          // Ensure 'bg-pearl-gold' is defined or use 'bg-[#fff5cc]'
          className="absolute blob w-80 h-80 bg-amber-100/40 blur-3xl rounded-full bottom-10 right-10" 
        />
      </div>

      {/* The Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          x: error ? [0, -10, 10, -10, 10, 0] : 0 
        }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="glass-card relative z-10 w-full max-w-[400px] p-10 flex flex-col items-center gap-10 shadow-2xl border border-white/40 bg-white/30 backdrop-blur-xl rounded-3xl"
      >
        <div className="text-center">
          <Logo />
          <p className="text-[10px] font-bold tracking-[0.4em] opacity-30 uppercase mt-4">
            Leadership Access
          </p>
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-6">
          <div className="space-y-2">
            <Input 
              type="password"
              placeholder="Enter Access Code"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 bg-white/50 border-white/20 rounded-2xl text-center text-lg tracking-[0.4em] focus:ring-2 focus:ring-pink-300/30 transition-all placeholder:tracking-normal placeholder:opacity-50 font-bold"
            />
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-white text-black font-black shadow-lg hover:shadow-xl transition-all border border-white/40 disabled:opacity-60"
            >
              {loading ? "Authenticating..." : "Authenticate"}
            </Button>
          </motion.div>
        </form>
        
        <Link
          href="/pfcc"
          className="group -mt-4 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Attendance Register
          <ArrowRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <footer className="flex flex-col items-center gap-1 opacity-20">
          <p className="text-[9px] font-bold tracking-tighter uppercase">
            Proprietary System • Christ Embassy
          </p>
        </footer>
      </motion.div>
    </main>
  );
}