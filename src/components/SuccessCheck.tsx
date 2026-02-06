"use client";
import { motion } from "framer-motion";
import { Check } from "@phosphor-icons/react";

export const SuccessCheck = () => {
  return (
    <motion.div 
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"
    >
      <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40">
        <motion.div
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Check size={64} color="white" weight="bold" />
        </motion.div>
      </div>
    </motion.div>
  );
};
