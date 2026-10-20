"use client";

import { motion, type Variants } from "motion/react";

// Bouwstenen om onderdelen speels in beeld te laten komen

const item: Variants = {
  // Kort en zonder filter: een blur-animatie is duur en laat de inhoud trager aanvoelen
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
};

/** Eén element dat (na een eventuele vertraging) omhoog in beeld komt. */
export function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} variants={item} initial="hidden" animate="show" transition={{ delay }}>
      {children}
    </motion.div>
  );
}

/** Container waarvan de directe <StaggerItem>-kinderen na elkaar binnenkomen. */
export function Stagger({
  children,
  className,
  delay = 0,
  step = 0.03,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  step?: number;
  as?: "div" | "ul" | "ol" | "section";
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: step, delayChildren: delay } } }}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "li" }) {
  const Component = motion[as];
  return (
    <Component className={className} variants={item}>
      {children}
    </Component>
  );
}
