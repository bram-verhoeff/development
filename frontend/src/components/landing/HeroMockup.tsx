"use client";

import { CalendarClock, CircleCheck, CircleDashed, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { PlatformIcon } from "@/components/ui/Badges";
import type { Platform } from "@/lib/types";

const PLATFORMS: Platform[] = ["linkedin", "instagram", "facebook", "x"];
// Fasen van de demo: tekst wordt getypt → concept → goedgekeurd → ingepland, en dan opnieuw
const PHASES = ["writing", "concept", "approved", "scheduled"] as const;
type Phase = (typeof PHASES)[number];
const PHASE_MS: Record<Phase, number> = { writing: 3200, concept: 1400, approved: 1400, scheduled: 2600 };

const statusStyle: Record<Exclude<Phase, "writing">, { className: string; Icon: typeof CircleCheck }> = {
  concept: { className: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900", Icon: CircleDashed },
  approved: { className: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900", Icon: CircleCheck },
  scheduled: { className: "bg-accent-soft text-accent ring-accent/25", Icon: CalendarClock },
};

// Voorbeeld van de app in de hero: een post die zichzelf schrijft en door de statussen loopt
export function HeroMockup() {
  const t = useTranslations("landing.mockup");
  const reduce = useReducedMotion();
  const text = t("text");
  const [phase, setPhase] = useState<Phase>(reduce ? "scheduled" : "writing");
  const [typed, setTyped] = useState(reduce ? text.length : 0);

  useEffect(() => {
    if (reduce) return;
    const timer = setTimeout(() => {
      const next = PHASES[(PHASES.indexOf(phase) + 1) % PHASES.length];
      if (next === "writing") setTyped(0);
      setPhase(next);
    }, PHASE_MS[phase]);
    return () => clearTimeout(timer);
  }, [phase, reduce]);

  useEffect(() => {
    if (phase !== "writing" || typed >= text.length) return;
    const timer = setTimeout(() => setTyped((n) => n + 1), 2600 / text.length);
    return () => clearTimeout(timer);
  }, [phase, typed, text.length]);

  const status = phase === "writing" ? null : statusStyle[phase];

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Gloed achter de kaart */}
      <div aria-hidden className="bg-brand-gradient absolute inset-6 -z-10 rounded-[2rem] opacity-40 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -1.5 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 120, damping: 18 }}
        className="rounded-3xl border border-line bg-surface/90 p-5 shadow-2xl shadow-accent/10 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="bg-brand-gradient h-9 w-9 rounded-full" />
            <div>
              <p className="text-sm font-semibold">{t("brand")}</p>
              <div className="mt-0.5 flex gap-1">
                {PLATFORMS.map((platform) => (
                  <PlatformIcon key={platform} platform={platform} size={16} />
                ))}
              </div>
            </div>
          </div>
          <AnimatePresence mode="popLayout" initial={false}>
            {status ? (
              <motion.span
                key={phase}
                initial={{ opacity: 0, scale: 0.7, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: 6 }}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${status.className}`}
              >
                <status.Icon size={13} /> {t(phase)}
              </motion.span>
            ) : (
              <motion.span
                key="writing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted"
              >
                <Sparkles size={13} className="text-coral" /> {t("writing")}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-4 min-h-[4.5rem] text-[15px] leading-relaxed">
          {text.slice(0, typed)}
          {phase === "writing" && <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-accent" />}
        </p>
        <motion.p animate={{ opacity: phase === "writing" ? 0 : 1 }} className="mt-2 text-sm font-medium text-accent">
          {t("tags")}
        </motion.p>

        {/* Beeldvlak met zachte verloop-animatie */}
        <div className="relative mt-4 h-36 overflow-hidden rounded-2xl bg-surface-2">
          <motion.div
            aria-hidden
            className="bg-brand-gradient absolute inset-0 opacity-30"
            animate={reduce ? undefined : { scale: [1, 1.15, 1], rotate: [0, 4, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <div aria-hidden className="bg-dots absolute inset-0 opacity-60" />
        </div>
      </motion.div>

      {/* Zwevende kalenderchip */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9, type: "spring", stiffness: 160, damping: 18 }}
        className="absolute -right-4 -bottom-6 sm:-right-10"
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-3 py-2 text-xs font-semibold shadow-xl"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <CalendarClock size={15} />
          </span>
          {t("scheduled")}
        </motion.div>
      </motion.div>
    </div>
  );
}
