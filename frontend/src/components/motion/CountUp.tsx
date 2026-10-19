"use client";

import { animate, useInView, useMotionValue, useReducedMotion, useTransform, motion } from "motion/react";
import { useEffect, useRef } from "react";

// Getal dat vanaf 0 optelt zodra het in beeld komt
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const count = useMotionValue(reduce ? value : 0);
  const rounded = useTransform(count, (v) => Math.round(v).toString());

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, value, { duration: reduce ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, value, count, reduce]);

  return (
    <motion.span ref={ref} className={className}>
      {rounded}
    </motion.span>
  );
}
