"use client";

import { motion } from "framer-motion";

export const Logo = () => (
  <div className="ml-4 flex items-center gap-1 relative group">
    <motion.span 
      animate={{ 
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] 
      }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      className="font-unio text-4xl font-bold tracking-tighter bg-gradient-to-r from-pink-500 via-rose-400 to-amber-300 bg-[length:200%_auto] bg-clip-text text-transparent"
    >
      E-Register
    </motion.span>
    <motion.div 
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)] mt-4" 
    />
  </div>
);