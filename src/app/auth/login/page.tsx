import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-iridescent flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-md p-8 flex flex-col items-center gap-8">
        <Logo /> {/* Pearlescent "E REGISTER" */}
        
        <div className="w-full space-y-4">
          <Input 
            placeholder="Mobile Number" 
            className="bg-white/10 border-white/20 h-12 focus:ring-pearl-pink"
          />
          <Input 
            type="password" 
            placeholder="Access Code" 
            className="bg-white/10 border-white/20 h-12 focus:ring-pearl-pink"
          />
          <Button className="w-full h-12 bg-white text-black hover:bg-pearl-pink transition-colors font-bold rounded-xl shadow-lg">
            Enter Portal
          </Button>
        </div>
        
        <p className="text-xs text-black/40 font-medium uppercase tracking-widest">
          Christ Embassy • PFCC Portal
        </p>
      </div>
    </main>
  );
}