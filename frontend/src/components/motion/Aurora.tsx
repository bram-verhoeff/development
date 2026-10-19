"use client";

import { motion } from "motion/react";

// Langzaam bewegende kleurvlekken + subtiel raster als achtergrond van het werkvlak
const blobs = [
  { className: "left-[10%] top-[-10%] h-[32rem] w-[32rem] bg-indigo-500/25 dark:bg-indigo-500/30", x: [0, 80, -40, 0], y: [0, 60, 30, 0], duration: 26 },
  { className: "right-[-5%] top-[20%] h-[28rem] w-[28rem] bg-fuchsia-500/20 dark:bg-fuchsia-500/25", x: [0, -70, 30, 0], y: [0, 40, -50, 0], duration: 30 },
  { className: "left-[35%] bottom-[-15%] h-[30rem] w-[30rem] bg-orange-400/20 dark:bg-orange-500/20", x: [0, 50, -60, 0], y: [0, -40, 20, 0], duration: 34 },
];

export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${blob.className}`}
          animate={{ x: blob.x, y: blob.y, scale: [1, 1.08, 0.96, 1] }}
          transition={{ duration: blob.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
    </div>
  );
}
