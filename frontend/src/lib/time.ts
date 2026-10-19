// Tijden altijd in Nederlandse tijd tonen en invoeren, ongeacht waar de server draait.
// De backend slaat alles op in UTC.

export const TIME_ZONE = "Europe/Amsterdam";

type Parts = { year: number; month: number; day: number; hour: number; minute: number };

function partsInZone(date: Date): Parts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

/** Verschil tussen Amsterdam en UTC op dat moment, in minuten (60 in de winter, 120 in de zomer). */
function offsetMinutes(date: Date): number {
  const p = partsInZone(date);
  return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - Math.floor(date.getTime() / 60000) * 60000) / 60000;
}

/** Amsterdamse datum + tijd ("2026-10-20T09:30") → ISO-string in UTC. */
export function zonedToUtcIso(local: string): string {
  const [date, time = "00:00"] = local.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, min);
  // Twee keer corrigeren vangt de overgang naar zomer- en wintertijd op
  let utc = guess - offsetMinutes(new Date(guess)) * 60000;
  utc = guess - offsetMinutes(new Date(utc)) * 60000;
  return new Date(utc).toISOString();
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO-string → "2026-10-20T09:30" in Amsterdamse tijd (voor <input type="datetime-local">). */
export function utcIsoToZonedInput(iso: string): string {
  const p = partsInZone(new Date(iso));
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** Datumsleutel "2026-10-20" in Amsterdamse tijd, om posts per dag te groeperen. */
export function dayKey(iso: string): string {
  const p = partsInZone(new Date(iso));
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Huidige maand als "2026-10" (Amsterdam). */
export function currentMonth(): string {
  const p = partsInZone(new Date());
  return `${p.year}-${pad(p.month)}`;
}
