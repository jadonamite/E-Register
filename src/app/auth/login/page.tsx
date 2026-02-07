"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo"; // Make sure this path is correct based on your tree

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === "Register") {
      router.push("/pfcc");
    } else if (password === "Executive") {
      router.push("/exec");
    } else {
      // Shake animation trigger
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center overflow-hidden bg-stone-50">
      
      {/* 1. Living Atmosphere Background (The "Blob" Effect) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            x: [0, 50, 0], 
            y: [0, 30, 0],
            scale: [1, 1.1, 1] 
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-96 h-96 bg-rose-200/30 blur-3xl rounded-full -top-20 -left-20" 
        />
        <motion.div 
          animate={{ 
            x: [0, -40, 0], 
            y: [0, -60, 0],
            scale: [1, 1.2, 1] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-80 h-80 bg-amber-100/40 blur-3xl rounded-full bottom-10 right-10" 
        />
      </div>

      {/* 2. The Glass Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          x: error ? [0, -10, 10, -10, 10, 0] : 0 
        }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="w-full max-w-[400px] p-10 flex flex-col items-center gap-10 z-10 bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl"
      >
        <div className="text-center space-y-4">
          <Logo /> 
          <p className="text-[10px] font-black tracking-[0.3em] opacity-40 uppercase">
            Ministry Portal Access
          </p>
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-6">
          <div className="space-y-2">
            <Input 
              type="password"
              placeholder="ENTER ACCESS CODE"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 bg-white/50 border-stone-200 rounded-xl text-center text-lg tracking-[0.2em] focus:ring-2 ring-stone-900/10 transition-all placeholder:tracking-normal placeholder:opacity-40 font-bold"
            />
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              type="submit"
              className="w-full h-14 rounded-xl bg-stone-900 text-white font-black hover:bg-stone-800 shadow-xl transition-all"
            >
              AUTHENTICATE
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