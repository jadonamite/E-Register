"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
      router.push("/pfcc");
    } else if (password === "Executive") {
      router.push("/exec");
    } else {
      setError(true);
      setTimeout(() => setError(false), 500); // Reset shake animation
    }
  };

  return (
    // replace the class name above if errors {/*min-h-screen relative flex items-center justify-center*/}
    <main className="min-h-screen relative flex items-center justify-center absolute inset-0 overflow-hidden bg-background">
      {/* Visual Pop: Living Atmosphere Blobs */}
      <div className="atmosphere">
        <motion.div 
          animate={{ 
            x: [0, 50, 0], 
            y: [0, 30, 0],
            scale: [1, 1.1, 1] 
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="blob w-96 h-96 bg-pearl-pink -top-20 -left-20" 
        />
        <motion.div 
          animate={{ 
            x: [0, -40, 0], 
            y: [0, -60, 0],
            scale: [1, 1.2, 1] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="blob w-80 h-80 bg-pearl-gold bottom-10 right-10" 
        />
      </div>

      {/* The Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          x: error ? [0, -10, 10, -10, 10, 0] : 0 
        }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="glass-card w-full max-w-[400px] p-10 flex flex-col items-center gap-10 shadow-2xl border-white/50 z-10"
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
              className="h-14 bg-white/40 border-none rounded-2xl text-center text-lg tracking-[0.4em] focus:ring-2 ring-pearl-pink/30 transition-all placeholder:tracking-normal placeholder:opacity-50"
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