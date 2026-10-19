"use client";

import { CalendarClock, CircleCheck, Hand, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useRef } from "react";

import { PlatformIcon } from "@/components/ui/Badges";
import type { Platform } from "@/lib/types";

type Texts = {
  title: string;
  titleAccent: string;
  body: string;
  card1Label: string;
  card1Text: string;
  card2Label: string;
  card2Text: string;
  dragHint: string;
};

const words = (text: string) => text.split(" ");
const ORBIT: Platform[] = ["instagram", "linkedin", "tiktok", "x", "facebook"];

// Linkerhelft van het loginscherm: titel woord-voor-woord, en kaartjes die je kunt rondslepen
export function AuthHero({ texts }: { texts: Texts }) {
  const area = useRef<HTMLDivElement>(null);

  return (
    <div className="relative max-w-lg">
      <h2 className="font-display text-4xl leading-tight font-extrabold xl:text-5xl">
        {words(texts.title).map((word, i) => (
          <motion.span
            key={i}
            className="mr-[0.25em] inline-block"
            initial={{ opacity: 0, y: 24, rotate: 4 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 0.1 + i * 0.07, type: "spring", stiffness: 260, damping: 20 }}
          >
            {word}
          </motion.span>
        ))}
        <motion.span
          className="text-brand-animated inline-block"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 + words(texts.title).length * 0.07, type: "spring", stiffness: 200, damping: 14 }}
        >
          {texts.titleAccent}
        </motion.span>
      </h2>
      <motion.p className="mt-4 text-lg text-white/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
        {texts.body}
      </motion.p>

      <div ref={area} className="relative mt-10 h-60">
        <motion.div
          drag
          dragConstraints={area}
          dragElastic={0.2}
          whileDrag={{ scale: 1.06, rotate: 0, cursor: "grabbing" }}
          initial={{ opacity: 0, rotate: -4 }}
          animate={{ opacity: 1, rotate: -4 }}
          transition={{ delay: 0.9 }}
          className="absolute top-0 left-0 w-64 cursor-grab"
        >
          {/* Zweven op een binnenlaag, zodat het slepen (x/y) er niet mee botst */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-md"
          >
          <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
            <Sparkles size={14} className="text-amber-300" /> {texts.card1Label}
          </div>
          <p className="mt-2 text-sm font-semibold">{texts.card1Text}</p>
          <p className="mt-1 text-xs text-sky-200">#socialmedia #contentplanning</p>
          </motion.div>
        </motion.div>

        <motion.div
          drag
          dragConstraints={area}
          dragElastic={0.2}
          whileDrag={{ scale: 1.06, cursor: "grabbing" }}
          initial={{ opacity: 0, rotate: 5 }}
          animate={{ opacity: 1, rotate: 5 }}
          transition={{ delay: 1.1 }}
          className="absolute top-20 left-56 w-56 cursor-grab"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-md"
          >
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
            <CircleCheck size={14} /> {texts.card2Label}
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-white/80">
            <CalendarClock size={15} /> {texts.card2Text}
          </div>
          </motion.div>
        </motion.div>

        <motion.div
          drag
          dragConstraints={area}
          whileDrag={{ scale: 1.1, cursor: "grabbing" }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3, type: "spring", stiffness: 300, damping: 16 }}
          className="absolute bottom-0 left-8 flex cursor-grab gap-1.5 rounded-2xl border border-white/10 bg-white/10 p-2 shadow-xl backdrop-blur-md"
        >
          {ORBIT.map((platform, i) => (
            <motion.span key={platform} animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}>
              <PlatformIcon platform={platform} size={26} />
            </motion.span>
          ))}
        </motion.div>

        <motion.p
          className="absolute right-0 bottom-2 flex items-center gap-1.5 text-xs text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <Hand size={13} /> {texts.dragHint}
        </motion.p>
      </div>
    </div>
  );
}
