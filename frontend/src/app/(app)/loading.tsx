import { cardClass } from "@/components/ui/styles";

// Direct zichtbaar bij elke navigatie, terwijl de pagina haar gegevens ophaalt
export default function AppLoading() {
  return (
    <div aria-busy className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-lg bg-line" />
        <div className="h-4 w-80 max-w-full rounded bg-line/70" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${cardClass} h-24`} />
        ))}
      </div>
      <div className={`${cardClass} h-64`} />
    </div>
  );
}
