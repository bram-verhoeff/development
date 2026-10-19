"use client";

import { motion, useMotionTemplate, useMotionValue } from "motion/react";

// Kaart met een gloed die de muis volgt en een oplichtende verlooprand bij hover
export function SpotlightCard({
  children,
  className = "",
  glow = "rgba(124, 92, 240, 0.16)",
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
}) {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const background = useMotionTemplate`radial-gradient(320px circle at ${x}px ${y}px, ${glow}, transparent 70%)`;

  return (
    <motion.div
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left);
        y.set(e.clientY - rect.top);
      }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`group/spot relative isolate overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-shadow hover:shadow-xl hover:shadow-accent/10 ${className}`}
    >
      {/* Gloed onder de muis */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100" style={{ background }} />
      {/* Verlooprand */}
      <div
        aria-hidden
        className="bg-brand-gradient pointer-events-none absolute inset-0 -z-20 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{ padding: 1, WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }}
      />
      {children}
    </motion.div>
  );
}
