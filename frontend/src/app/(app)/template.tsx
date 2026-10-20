"use client";

import { motion } from "motion/react";

// Paginaovergang: elke navigatie komt zacht omhoog in beeld.
// Bewust geen blur/filter: dat zou position:fixed in de pagina (overlays) verstoren.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
