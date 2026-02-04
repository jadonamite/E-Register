"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion"; // Highly recommended for that 'Apple' feel

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    if (password === "Register") router.push("/pfcc");
    else if (password === "Executive") router.push("/exec");
    else alert("Access Denied");
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* ATMOSPHERE BLOBS */}
      <div className="atmosphere">
        <div className="blob w-96 h-96 bg-pearl-pink -top-20 -left-20" />
        <div className="blob w-80 h-80 bg-pearl-gold bottom-10 right-10 animation-delay-2000" />
        <div className="blob w-64 h-64 bg-emerald-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-[400px] p-10 flex flex-col items-center gap-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-white/40"
      >
        <div className="text-center space-y-2">
          <Logo />
          <p className="text-[10px] font-black tracking-[0.3em] opacity-30 uppercase">Secure Portal</p>
        </div>

        <div className="w-full space-y-6">
          <div className="space-y-3">
            <Input 
              type="password"
              placeholder="Enter Access Code"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 bg-white/50 border-none rounded-2xl text-center text-lg tracking-widest focus:ring-2 ring-pearl-pink/50 transition-all"
            />
          </div>

          <Button 
            onClick={handleLogin}
            className="w-full h-14 rounded-2xl bg-white text-black font-black shadow-xl hover:bg-pearl-pink hover:scale-[1.02] active:scale-95 transition-all border border-white/50"
          >
            Authenticate
          </Button>
        </div>

        <footer className="text-[9px] font-bold opacity-20 tracking-tighter uppercase">
          Proprietary System • Christ Embassy
        </footer>
      </motion.div>
    </main>
  );
}