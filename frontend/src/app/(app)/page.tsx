import { ArrowRight, Building2, CalendarClock, CalendarDays, CircleCheck, CircleDashed, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";

import { HeroArt } from "@/components/dashboard/HeroArt";
import { UsageMeter } from "@/components/dashboard/UsageMeter";
import { CountUp } from "@/components/motion/CountUp";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { PlatformIcon } from "@/components/ui/Badges";
import { buttonClass, cardClass } from "@/components/ui/styles";
import { apiFetch } from "@/lib/api";
import { getMe } from "@/lib/me";
import { TIME_ZONE } from "@/lib/time";
import type { Dashboard } from "@/lib/types";

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
    { key: "concept", value: data.concept, Icon: CircleDashed, href: "/posts?status=concept", tone: "text-amber-600 bg-amber-100/70 dark:bg-amber-950/50", glow: "rgba(245, 158, 11, 0.16)" },
    { key: "ready", value: data.approved_unscheduled, Icon: CircleCheck, href: "/calendar", tone: "text-emerald-600 bg-emerald-100/70 dark:bg-emerald-950/50", glow: "rgba(16, 185, 129, 0.16)" },
    { key: "scheduled", value: data.scheduled_upcoming, Icon: CalendarClock, href: "/calendar", tone: "text-accent bg-accent-soft", glow: "rgba(124, 92, 240, 0.18)" },
    { key: "brands", value: data.brands, Icon: Building2, href: "/brands", tone: "text-coral bg-coral-soft", glow: "rgba(255, 106, 61, 0.16)" },
  ] as const;

  const usage = Math.min(data.generations_today / Math.max(data.generation_daily_limit, 1), 1);

  return (
    <div className="space-y-6">
      {/* Begroeting */}
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl bg-nav p-6 text-white shadow-2xl shadow-accent/10 sm:p-8 lg:min-h-[220px]">
          <div aria-hidden className="bg-dots absolute inset-0 opacity-50" />
          <div aria-hidden className="bg-brand-gradient absolute -top-24 -right-16 h-72 w-72 rounded-full opacity-40 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl" />
          <HeroArt />
          <div className="relative max-w-xl">
            <p className="text-sm font-medium text-white/60">{t(`greeting.${greetingKey()}`)}</p>
            <h1 className="mt-1 text-3xl font-extrabold sm:text-5xl">
              {t("hello")} <span className="text-brand-animated capitalize">{name}</span>
            </h1>
            <p className="mt-3 text-white/70">
              {data.brands === 0 ? t("introNoBrands") : t("intro", { concept: data.concept, ready: data.approved_unscheduled })}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {data.brands === 0 ? (
                <Link href="/brands/new" className={buttonClass.gradient}>
                  <Plus size={16} /> {t("actions.firstBrand")}
                </Link>
              ) : (
                <>
                  <Link href="/generate" className={`${buttonClass.gradient} px-5 py-2.5`}>
                    <Sparkles size={16} /> {t("actions.generate")}
                  </Link>
                  <Link
                    href="/calendar"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/15"
                  >
                    <CalendarDays size={16} /> {t("actions.calendar")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Kerncijfers */}
      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4" delay={0.03}>
        {stats.map(({ key, value, Icon, href, tone, glow }) => (
          <StaggerItem key={key}>
            <SpotlightCard glow={glow}>
              <Link href={href} className="group block p-5">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110 group-hover:-rotate-6 ${tone}`}>
                  <Icon size={21} />
                </span>
                <CountUp value={value} className="mt-4 block font-display text-4xl font-bold tabular-nums" />
                <div className="mt-0.5 flex items-center justify-between text-sm text-muted">
                  {t(`stats.${key}`)}
                  <ArrowRight size={15} className="-translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                </div>
              </Link>
            </SpotlightCard>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Komende 7 dagen */}
        <FadeIn delay={0.06}>
          <section className={`${cardClass} h-full p-5 sm:p-6`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("upcoming.title")}</h2>
              <Link href="/calendar" className="text-sm font-medium text-accent hover:underline">
                {t("upcoming.all")}
              </Link>
            </div>
            {data.upcoming.length === 0 ? (
              <p className="mt-4 rounded-xl bg-surface-2 p-4 text-sm text-muted">{t("upcoming.empty")}</p>
            ) : (
              <Stagger as="ul" className="mt-4 space-y-1" delay={0.08}>
                {data.upcoming.map((post) => (
                  <StaggerItem as="li" key={post.id}>
                    <Link href={`/posts/${post.id}`} className="group flex items-center gap-4 rounded-xl p-2.5 transition hover:bg-accent-soft/40">
                      <div className="w-14 shrink-0 rounded-xl bg-surface-2 py-1.5 text-center transition group-hover:bg-surface">
                        <div className="text-[11px] font-semibold text-muted uppercase">
                          {format.dateTime(new Date(post.scheduled_at!), { weekday: "short" })}
                        </div>
                        <div className="font-display text-xl leading-none font-bold">
                          {format.dateTime(new Date(post.scheduled_at!), { day: "numeric" })}
                        </div>
                      </div>
                      <PlatformIcon platform={post.platform} size={28} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{post.hook}</p>
                        <p className="truncate text-xs text-muted">
                          {post.brand_name} · {format.dateTime(new Date(post.scheduled_at!), { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <ArrowRight size={15} className="text-muted opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </section>
        </FadeIn>

        <div className="space-y-6">
          {/* Wacht op beoordeling */}
          <FadeIn delay={0.08}>
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
                <Stagger as="ul" className="mt-4 space-y-2" delay={0.1}>
                  {data.recent_concepts.map((post) => (
                    <StaggerItem as="li" key={post.id}>
                      <Link
                        href={`/posts/${post.id}`}
                        className="group flex items-center gap-3 rounded-xl border border-line p-3 transition hover:-translate-y-0.5 hover:border-accent/50 hover:bg-accent-soft/30 hover:shadow-md"
                      >
                        <PlatformIcon platform={post.platform} size={24} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{post.hook}</span>
                          <span className="block truncate text-xs text-muted">{post.brand_name}</span>
                        </span>
                        <ArrowRight size={15} className="text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
                      </Link>
                    </StaggerItem>
                  ))}
                </Stagger>
              )}
            </section>
          </FadeIn>

          {/* AI-verbruik */}
          <FadeIn delay={0.1}>
            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="flex items-center justify-between text-sm">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Sparkles size={18} className="text-coral" /> {t("usage.title")}
                </h2>
                <span className="font-semibold tabular-nums">
                  {data.generations_today} / {data.generation_daily_limit}
                </span>
              </div>
              <UsageMeter ratio={usage} />
              <p className="mt-2 text-xs text-muted">{t("usage.body")}</p>
            </section>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
