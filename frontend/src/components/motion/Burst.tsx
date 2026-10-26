"use client";

import { motion } from "motion/react";

// Kleine feestelijke uitbarsting van stipjes (bijv. bij goedkeuren). Remount met een nieuwe key om opnieuw af te spelen.
const COLORS = ["#10b981", "#2dd4bf", "#fbbf4a", "#fbbf24", "#22d3ee"];

export function Burst({ count = 12 }: { count?: number }) {
  return (
    <span aria-hidden className="pointer-events-none absolute top-1/2 left-1/2">
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const distance = 34 + (i % 3) * 10;
        return (
          <motion.span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{ background: COLORS[i % COLORS.length] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        );
      })}
    </span>
  );
}
