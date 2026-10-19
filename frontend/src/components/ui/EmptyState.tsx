import type { LucideIcon } from "lucide-react";

// Vriendelijke lege staat met icoon, uitleg en (optioneel) een actie
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
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
      <span className="bg-brand-gradient mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg shadow-accent/25">
        <Icon size={22} />
      </span>
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
