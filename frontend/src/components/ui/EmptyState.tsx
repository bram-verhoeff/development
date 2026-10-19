import type { LucideIcon } from "lucide-react";

import { FadeIn } from "@/components/motion/Reveal";
import { Floating } from "@/components/motion/Floating";

// Vriendelijke lege staat met zwevend icoon, uitleg en (optioneel) een actie
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <FadeIn className="relative flex flex-col items-center overflow-hidden rounded-3xl border border-dashed border-line bg-surface/70 px-6 py-14 text-center backdrop-blur">
      <div aria-hidden className="bg-brand-gradient absolute -top-24 h-48 w-48 rounded-full opacity-15 blur-3xl" />
      <Floating className="bg-brand-gradient relative mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-xl shadow-accent/30">
        <Icon size={24} />
      </Floating>
      <p className="relative font-display text-xl font-semibold">{title}</p>
      <p className="relative mt-1 max-w-md text-sm text-muted">{body}</p>
      {action && <div className="relative mt-6">{action}</div>}
    </FadeIn>
  );
}
