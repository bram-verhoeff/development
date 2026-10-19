"use client";

import { CircleCheck, CircleX, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useState } from "react";

type Tone = "success" | "error" | "magic";
type Toast = { id: number; tone: Tone; text: string };

const ToastContext = createContext<(text: string, tone?: Tone) => void>(() => {});

/** Korte melding rechtsonder, bijv. na goedkeuren of inplannen. */
export const useToast = () => useContext(ToastContext);

const icons = { success: CircleCheck, error: CircleX, magic: Sparkles };
const tones = {
  success: "text-emerald-500",
  error: "text-rose-500",
  magic: "text-coral",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((text: string, tone: Tone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-2), { id, tone, text }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = icons[toast.tone];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-white/10 bg-nav/95 px-4 py-3 text-sm font-medium text-white shadow-2xl shadow-black/30 backdrop-blur"
              >
                <Icon size={18} className={tones[toast.tone]} />
                {toast.text}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
