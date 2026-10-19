import { ArrowRight, Building2, CalendarClock, CalendarDays, CircleCheck, CircleDashed, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";

import { PlatformIcon } from "@/components/ui/Badges";
import { buttonClass, cardClass } from "@/components/ui/styles";
import { apiFetch } from "@/lib/api";
import { getMe } from "@/lib/me";
import { TIME_ZONE } from "@/lib/time";
import type { Dashboard, Post } from "@/lib/types";

function greetingKey() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE }).format(new Date()));
  return hour < 6 ? "night" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const format = await getFormatter();
  const [{ me }, data] = await Promise.all([getMe(), apiFetch<Dashboard>("/dashboard")]);
  const name = me?.email.split("@")[0] ?? "";

  const stats = [
    { key: "concept", value: data.concept, Icon: CircleDashed, href: "/posts?status=concept", tone: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
    { key: "ready", value: data.approved_unscheduled, Icon: CircleCheck, href: "/calendar", tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
    { key: "scheduled", value: data.scheduled_upcoming, Icon: CalendarClock, href: "/calendar", tone: "text-accent bg-accent-soft" },
    { key: "brands", value: data.brands, Icon: Building2, href: "/brands", tone: "text-coral bg-coral-soft" },
  ] as const;

  const usage = Math.min(data.generations_today / Math.max(data.generation_daily_limit, 1), 1);

  return (
    <div className="space-y-6">
      {/* Begroeting */}
      <section className="relative overflow-hidden rounded-3xl bg-nav p-6 text-white shadow-xl sm:p-8">
        <div aria-hidden className="bg-dots absolute inset-0 opacity-50" />
        <div aria-hidden className="bg-brand-gradient absolute -top-24 -right-16 h-72 w-72 rounded-full opacity-50 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-medium text-white/60">{t(`greeting.${greetingKey()}`)}</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
            {t("hello")} <span className="text-brand-gradient capitalize">{name}</span>
          </h1>
          <p className="mt-2 max-w-xl text-white/70">
            {data.brands === 0 ? t("introNoBrands") : t("intro", { concept: data.concept, ready: data.approved_unscheduled })}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {data.brands === 0 ? (
              <Link href="/brands/new" className={buttonClass.gradient}>
                <Plus size={16} /> {t("actions.firstBrand")}
              </Link>
            ) : (
              <>
                <Link href="/generate" className={buttonClass.gradient}>
                  <Sparkles size={16} /> {t("actions.generate")}
                </Link>
                <Link href="/calendar" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">
                  <CalendarDays size={16} /> {t("actions.calendar")}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Kerncijfers */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ key, value, Icon, href, tone }) => (
          <Link key={key} href={href} className={`${cardClass} group p-5 transition hover:-translate-y-0.5 hover:shadow-lg`}>
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
              <Icon size={20} />
            </span>
            <div className="mt-4 font-display text-3xl font-bold tabular-nums">{value}</div>
            <div className="mt-0.5 flex items-center justify-between text-sm text-muted">
              {t(`stats.${key}`)}
              <ArrowRight size={15} className="opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
            </div>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Komende 7 dagen */}
        <section className={`${cardClass} p-5 sm:p-6`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("upcoming.title")}</h2>
            <Link href="/calendar" className="text-sm font-medium text-accent hover:underline">
              {t("upcoming.all")}
            </Link>
          </div>
          {data.upcoming.length === 0 ? (
            <p className="mt-4 rounded-xl bg-surface-2 p-4 text-sm text-muted">{t("upcoming.empty")}</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {data.upcoming.map((post) => (
                <li key={post.id}>
                  <Link href={`/posts/${post.id}`} className="flex items-center gap-4 py-3 transition hover:opacity-80">
                    <div className="w-14 shrink-0 text-center">
                      <div className="text-xs font-semibold text-muted uppercase">
                        {format.dateTime(new Date(post.scheduled_at!), { weekday: "short" })}
                      </div>
                      <div className="font-display text-xl font-bold">{format.dateTime(new Date(post.scheduled_at!), { day: "numeric" })}</div>
                    </div>
                    <PlatformIcon platform={post.platform} size={28} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{post.hook}</p>
                      <p className="truncate text-xs text-muted">
                        {post.brand_name} · {format.dateTime(new Date(post.scheduled_at!), { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          {/* Wacht op beoordeling */}
          <section className={`${cardClass} p-5 sm:p-6`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("review.title")}</h2>
              <Link href="/posts?status=concept" className="text-sm font-medium text-accent hover:underline">
                {t("review.all")}
              </Link>
            </div>
            {data.recent_concepts.length === 0 ? (
              <p className="mt-4 rounded-xl bg-surface-2 p-4 text-sm text-muted">{t("review.empty")}</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {data.recent_concepts.map((post: Post) => (
                  <li key={post.id}>
                    <Link
                      href={`/posts/${post.id}`}
                      className="flex items-center gap-3 rounded-xl border border-line p-3 transition hover:border-accent/50 hover:bg-accent-soft/30"
                    >
                      <PlatformIcon platform={post.platform} size={24} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{post.hook}</span>
                        <span className="block truncate text-xs text-muted">{post.brand_name}</span>
                      </span>
                      <ArrowRight size={15} className="text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* AI-verbruik */}
          <section className={`${cardClass} p-5 sm:p-6`}>
            <div className="flex items-center justify-between text-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles size={18} className="text-coral" /> {t("usage.title")}
              </h2>
              <span className="font-semibold tabular-nums">
                {data.generations_today} / {data.generation_daily_limit}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
              <div className="bg-brand-gradient h-full rounded-full" style={{ width: `${usage * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted">{t("usage.body")}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
