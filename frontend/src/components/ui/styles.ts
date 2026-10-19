// Gedeelde Tailwind-klassen, zodat knoppen, velden en kaarten overal hetzelfde ogen

export const inputClass =
  "mt-1.5 block w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap transition disabled:pointer-events-none disabled:opacity-60";

export const buttonClass = {
  primary: `${buttonBase} bg-accent text-accent-foreground shadow-sm shadow-accent/30 hover:brightness-110`,
  gradient: `${buttonBase} bg-brand-gradient text-white shadow-md shadow-accent/30 hover:brightness-110`,
  secondary: `${buttonBase} border border-line bg-surface text-foreground hover:border-accent/40 hover:bg-accent-soft/40`,
  ghost: `${buttonBase} text-muted hover:bg-accent-soft/50 hover:text-foreground`,
  danger: `${buttonBase} border border-rose-200 bg-surface text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40`,
  success: `${buttonBase} bg-emerald-600 text-white hover:bg-emerald-500`,
};

export const cardClass = "rounded-2xl border border-line bg-surface shadow-card";
