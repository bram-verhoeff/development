// Gedeelde Tailwind-klassen, zodat knoppen en velden overal hetzelfde ogen

export const inputClass =
  "mt-1 block w-full rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60";

export const buttonClass = {
  primary: `${buttonBase} bg-accent text-accent-foreground hover:opacity-90`,
  secondary: `${buttonBase} border border-line bg-surface text-foreground hover:bg-background`,
  danger: `${buttonBase} border border-red-300 bg-surface text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40`,
};
