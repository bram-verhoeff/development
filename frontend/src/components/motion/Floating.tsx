"use client";

import { motion } from "motion/react";

// Element dat zachtjes op en neer zweeft
export function Floating({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.span
      className={className}
      animate={{ y: [0, -8, 0], rotate: [0, -4, 4, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.span>
  );
}
