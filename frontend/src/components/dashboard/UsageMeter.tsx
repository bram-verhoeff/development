"use client";

import { motion } from "motion/react";

// Balk die bij het laden naar het verbruik toe groeit
export function UsageMeter({ ratio }: { ratio: number }) {
  return (
    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-line">
      <motion.div
        className="bg-brand-gradient h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(ratio * 100, ratio > 0 ? 3 : 0)}%` }}
        transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.4 }}
      />
    </div>
  );
}
