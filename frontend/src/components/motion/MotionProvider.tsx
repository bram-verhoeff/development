"use client";

import { MotionConfig } from "motion/react";

import { ToastProvider } from "@/components/ui/Toast";

// Animaties respecteren "beweging verminderen" van het besturingssysteem
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 380, damping: 32 }}>
      <ToastProvider>{children}</ToastProvider>
    </MotionConfig>
  );
}
