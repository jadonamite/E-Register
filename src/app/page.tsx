"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === "Register") {
      // 1. Set the Cookie (The "Gate Pass" for Middleware)
      document.cookie = "user-role=PFCC; path=/; max-age=86400; SameSite=Lax";
      // 2. Redirect
      router.push("/pfcc");
    } else if (password === "Executive") {
      // 1. Set the Executive Cookie
      document.cookie = "user-role=EXEC; path=/; max-age=86400; SameSite=Lax";
      // 2. Redirect
      router.push("/exec");
    } else {
      // Shake animation trigger
      setError(true);
      setTimeout(() => setError(false), 500); 
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
            Ministry Portal Access
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
              className="w-full h-14 rounded-2xl bg-white text-black font-black shadow-lg hover:shadow-xl transition-all border border-white/40"
            >
              Authenticate
            </Button>
          </motion.div>
        </form>
        
        <footer className="flex flex-col items-center gap-1 opacity-20">
          <p className="text-[9px] font-bold tracking-tighter uppercase">
            Proprietary System • Christ Embassy
          </p>
        </footer>
      </motion.div>
    </main>
  );
}