// PostPilot-logo: papieren vliegtuigje in het merkverloop
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="bg-brand-gradient inline-flex shrink-0 items-center justify-center rounded-xl shadow-lg shadow-accent/30"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width={size * 0.58} height={size * 0.58} fill="none">
        <path d="M21.5 2.5 2.8 10.2c-.8.3-.8 1.5.1 1.7l6.6 1.9 1.9 6.6c.2.9 1.4.9 1.7.1L21.5 2.5Z" fill="white" />
        <path d="m9.5 13.8 5.2-5.2" stroke="#7a5cf0" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className={`font-display text-lg font-bold tracking-tight ${light ? "text-white" : "text-foreground"}`}>
        Post<span className="text-brand-gradient">Pilot</span>
      </span>
    </span>
  );
}
