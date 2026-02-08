"use client";
import { motion } from "framer-motion";

export const ConnectivityEffect = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <svg className="absolute w-full h-full opacity-[0.03]">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" className="fill-stone-900" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      
      {/* Connecting Lines Animation */}
      <div className="absolute top-20 left-20 w-64 h-[1px] bg-gradient-to-r from-transparent via-pink-500/20 to-transparent" />
      <div className="absolute top-20 left-20 w-[1px] h-64 bg-gradient-to-b from-transparent via-pink-500/20 to-transparent" />
      
      {/* Pulsing Dots */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 1.2 }}
          className="absolute w-3 h-3 rounded-full bg-pink-500/20 blur-sm"
          style={{ 
            top: `${20 + (i * 15)}%`, 
            left: `${10 + (i * 20)}%` 
          }}
        />
      ))}
    </div>
  );
};