"use client";
import { motion } from "framer-motion";
import { Check } from "@phosphor-icons/react";

export const SuccessCheck = () => {
  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      // CRITICAL FIX: Boosted Z-Index to 9999 to override any Dialog/Modal
      className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none"
    >
      {/* Added a subtle backdrop to make the check pop even more */}
      <div className="absolute inset-0 bg-black/5" />
      
      <div className="relative w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40">
        <motion.div
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          <Check size={64} color="white" weight="bold" />
        </motion.div>
      </div>
    </motion.div>
  );
};