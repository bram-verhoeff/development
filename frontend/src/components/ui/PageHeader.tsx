import { FadeIn } from "@/components/motion/Reveal";

// Kop van een pagina: titel, korte uitleg en eventuele acties rechts
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <FadeIn className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        <div aria-hidden className="bg-brand-gradient mt-2 h-1 w-12 rounded-full" />
        {description && <p className="mt-3 max-w-2xl text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </FadeIn>
  );
}
