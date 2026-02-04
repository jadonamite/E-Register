"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    if (password === "Register") {
      router.push("/pfcc");
    } else if (password === "Executive") {
      router.push("/exec");
    } else {
      alert("Invalid Access Code");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F9FAFB] relative overflow-hidden">
      {/* Background Pop: Blurred Mesh */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pearl-pink/30 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pearl-gold/30 blur-[120px] rounded-full" />

      <div className="w-full max-w-[400px] z-10 p-6">
        <div className="flex flex-col items-center gap-2 mb-10">
          <Logo />
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Portal Access</p>
        </div>

        <div className="glass-tile p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Access Code</label>
            <Input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-2xl border-none bg-gray-200/40 h-14 px-5 focus:bg-white/80 transition-all text-center tracking-[0.3em]" 
              placeholder="••••••••" 
            />
          </div>
          <Button 
            onClick={handleLogin}
            className="w-full h-14 bg-gradient-to-r from-pearl-pink to-pearl-gold text-black font-black rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Enter Dashboard
          </Button>
        </div>
      </div>
    </main>
  );
}