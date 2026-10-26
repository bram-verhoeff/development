"use client";

import { motion } from "motion/react";

import { PlatformIcon } from "@/components/ui/Badges";
import type { Platform } from "@/lib/types";

// Route van het vliegtuigje (in pixels binnen een vak van 420×220)
const ROUTE = "M 10 190 C 90 40, 200 220, 270 110 S 380 20, 410 60";

const chips: { platform: Platform; className: string; delay: number }[] = [
  { platform: "instagram", className: "right-[46%] top-[12%]", delay: 0 },
  { platform: "linkedin", className: "right-[18%] top-[58%]", delay: 0.8 },
  { platform: "tiktok", className: "right-[6%] top-[8%]", delay: 1.6 },
  { platform: "x", className: "right-[34%] bottom-[6%]", delay: 2.2 },
];

// Decoratie rechts in de hero: vliegtuigje dat over een gestippelde route vliegt + zwevende platforms
export function HeroArt() {
  return (
    <div aria-hidden className="pointer-events-none absolute top-1/2 right-0 hidden h-[220px] w-[420px] -translate-y-1/2 lg:block">
      <svg viewBox="0 0 420 220" width="420" height="220" className="absolute inset-0">
        <motion.path
          d={ROUTE}
          fill="none"
          stroke="url(#route)"
          strokeWidth="2"
          strokeDasharray="4 8"
          strokeLinecap="round"
          // Stromende streepjes langs de route
          initial={{ opacity: 0, strokeDashoffset: 0 }}
          animate={{ opacity: 1, strokeDashoffset: -48 }}
          transition={{ opacity: { duration: 1.2 }, strokeDashoffset: { duration: 2.4, repeat: Infinity, ease: "linear" } }}
        />
        <defs>
          <linearGradient id="route" x1="0" x2="1">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#fbbf4a" stopOpacity="0.9" />
          </linearGradient>
        </defs>
      </svg>

      <motion.div
        className="absolute top-0 left-0"
        style={{ offsetPath: `path("${ROUTE}")`, offsetRotate: "auto" }}
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: ["0%", "100%"] }}
        transition={{ duration: 7, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" className="-translate-x-1/2 -translate-y-1/2 rotate-45 drop-shadow-[0_4px_12px_rgba(251,191,74,0.6)]">
          <path d="M21.5 2.5 2.8 10.2c-.8.3-.8 1.5.1 1.7l6.6 1.9 1.9 6.6c.2.9 1.4.9 1.7.1L21.5 2.5Z" fill="white" />
        </svg>
      </motion.div>

      {chips.map(({ platform, className, delay }) => (
        <motion.div
          key={platform}
          className={`absolute rounded-2xl border border-white/15 bg-white/10 p-2 shadow-xl backdrop-blur-md ${className}`}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
          transition={{
            opacity: { delay: 0.4 + delay * 0.3 },
            scale: { delay: 0.4 + delay * 0.3, type: "spring", stiffness: 300, damping: 18 },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay },
          }}
        >
          <PlatformIcon platform={platform} size={30} />
        </motion.div>
      ))}
    </div>
  );
}
