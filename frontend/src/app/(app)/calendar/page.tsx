import { CalendarCheck2, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { DateTimeFormatOptions } from "next-intl";
import { getFormatter, getTranslations } from "next-intl/server";

import { FadeIn } from "@/components/motion/Reveal";
import { PostFilters } from "@/components/posts/PostFilters";
import { PlatformIcon, platformStyle } from "@/components/ui/Badges";
import { buttonClass, cardClass } from "@/components/ui/styles";
import { apiFetch } from "@/lib/api";
import { currentMonth, dayKey, zonedToUtcIso } from "@/lib/time";
import type { Brand, Post } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("nav"))("calendar") };
}

type Search = { month?: string; brand?: string; platform?: string };

const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);

/** Alle dagen die het maandraster toont: van de maandag vóór de 1e tot de zondag na de laatste. */
function monthGrid(month: string) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const last = new Date(Date.UTC(y, m, 0));
  const start = addDays(first, -((first.getUTCDay() + 6) % 7));
  const end = addDays(last, 6 - ((last.getUTCDay() + 6) % 7));
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return { first, days, start, endExclusive: addDays(end, 1) };
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const t = await getTranslations("calendar");
  const format = await getFormatter();

  const month = /^\d{4}-\d{2}$/.test(search.month ?? "") ? search.month! : currentMonth();
  const { first, days, start, endExclusive } = monthGrid(month);

  const filters = new URLSearchParams();
  if (search.brand) filters.set("brand_id", search.brand);
  if (search.platform) filters.set("platform", search.platform);

  const scheduledQuery = new URLSearchParams(filters);
  scheduledQuery.set("start", zonedToUtcIso(`${keyOf(start)}T00:00`));
  scheduledQuery.set("end", zonedToUtcIso(`${keyOf(endExclusive)}T00:00`));
  const readyQuery = new URLSearchParams(filters);
  readyQuery.set("status", "approved");
  readyQuery.set("scheduled", "false");

  const [scheduled, ready, brands] = await Promise.all([
    apiFetch<Post[]>(`/posts?${scheduledQuery}`),
    apiFetch<Post[]>(`/posts?${readyQuery}`),
    apiFetch<Brand[]>("/brands"),
  ]);

  const byDay = new Map<string, Post[]>();
  for (const post of scheduled) {
    const key = dayKey(post.scheduled_at!);
    byDay.set(key, [...(byDay.get(key) ?? []), post]);
  }

  const today = dayKey(new Date().toISOString());
  const monthLink = (target: string) => {
    const params = new URLSearchParams();
    params.set("month", target);
    if (search.brand) params.set("brand", search.brand);
    if (search.platform) params.set("platform", search.platform);
    return `/calendar?${params}`;
  };
  const time = (iso: string) => format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit" });
  // Datums in het raster zijn kalenderdagen (UTC-middernacht); op 12:00 formatteren voorkomt dagverschuiving
  const dayLabel = (d: Date, options: DateTimeFormatOptions) =>
    format.dateTime(addDays(d, 0.5), options);

  const visibleDays = days.filter((d) => byDay.has(keyOf(d)));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold capitalize sm:text-4xl">{dayLabel(first, { month: "long", year: "numeric" })}</h1>
          <p className="mt-1 text-muted">{t("description", { count: scheduled.length })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={monthLink(shiftMonth(month, -1))} className={`${buttonClass.secondary} px-2.5`} aria-label={t("previous")}>
            <ChevronLeft size={18} />
          </Link>
          <Link href={monthLink(currentMonth())} className={buttonClass.secondary}>
            {t("today")}
          </Link>
          <Link href={monthLink(shiftMonth(month, 1))} className={`${buttonClass.secondary} px-2.5`} aria-label={t("next")}>
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      <PostFilters brands={brands} showStatus={false} />

      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        {/* Maandraster (vanaf tablet); key: opnieuw in beeld komen bij een andere maand */}
        <FadeIn key={month} className={`${cardClass} hidden overflow-hidden md:block`}>
          <div className="grid grid-cols-7 border-b border-line bg-surface-2 text-center text-xs font-semibold tracking-wide text-muted uppercase">
            {days.slice(0, 7).map((d) => (
              <div key={keyOf(d)} className="py-2">
                {dayLabel(d, { weekday: "short" })}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const key = keyOf(d);
              const inMonth = d.getUTCMonth() === first.getUTCMonth();
              const posts = byDay.get(key) ?? [];
              return (
                <div
                  key={key}
                  className={`min-h-28 border-r border-b border-line p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0 ${inMonth ? "" : "bg-surface-2/60"}`}
                >
                  <div
                    className={`mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold ${
                      key === today ? "bg-brand-gradient text-white shadow-md shadow-accent/40" : inMonth ? "text-foreground" : "text-muted/60"
                    }`}
                  >
                    {d.getUTCDate()}
                  </div>
                  <div className="space-y-1">
                    {posts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/posts/${post.id}`}
                        title={`${post.brand_name}: ${post.hook}`}
                        className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] leading-tight shadow-sm transition-[scale,box-shadow] hover:scale-[1.04] hover:shadow-md ${platformStyle[post.platform].soft}`}
                      >
                        <PlatformIcon platform={post.platform} size={16} />
                        <span className="font-semibold tabular-nums">{time(post.scheduled_at!)}</span>
                        <span className="truncate">{post.hook}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </FadeIn>

        {/* Agenda (telefoon) */}
        <div className="space-y-3 md:hidden">
          {visibleDays.length === 0 && <p className={`${cardClass} p-5 text-sm text-muted`}>{t("emptyMonth")}</p>}
          {visibleDays.map((d) => (
            <section key={keyOf(d)} className={`${cardClass} p-4`}>
              <h2 className="text-sm font-semibold capitalize">{dayLabel(d, { weekday: "long", day: "numeric", month: "long" })}</h2>
              <ul className="mt-2 space-y-2">
                {byDay.get(keyOf(d))!.map((post) => (
                  <li key={post.id}>
                    <Link href={`/posts/${post.id}`} className="flex items-center gap-2 text-sm">
                      <PlatformIcon platform={post.platform} size={20} />
                      <span className="font-semibold tabular-nums">{time(post.scheduled_at!)}</span>
                      <span className="truncate">{post.hook}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Nog in te plannen */}
        <aside className={`${cardClass} h-fit p-5`}>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarCheck2 size={18} className="text-emerald-600" /> {t("ready.title")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("ready.body")}</p>
          {ready.length === 0 ? (
            <p className="mt-4 rounded-xl bg-surface-2 p-3 text-sm text-muted">{t("ready.empty")}</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {ready.slice(0, 12).map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/posts/${post.id}`}
                    className="flex items-start gap-2 rounded-xl border border-line p-2.5 text-sm transition hover:border-accent/50 hover:bg-accent-soft/30"
                  >
                    <PlatformIcon platform={post.platform} size={20} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{post.hook}</span>
                      <span className="block truncate text-xs text-muted">{post.brand_name}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
