"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom"; // This is the secret weapon
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "@phosphor-icons/react";

export const SuccessCheck = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Don't render until we are sure we are in the browser
  if (!mounted) return null;

  // Render DIRECTLY into the body tag, bypassing all other Layouts/Modals
  return createPortal(
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
      >
        {/* Backdrop to darken everything slightly */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40"
        >
          <motion.div
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Check size={64} color="white" weight="bold" />
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body // Target the body
  );
};