import { CalendarClock, CircleCheck, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/ui/Logo";

// Gesplitst scherm: links sfeer en uitleg (vanaf tablet), rechts het formulier
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("authHero");

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-nav text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="bg-dots absolute inset-0 opacity-60" />
        <div aria-hidden className="bg-brand-gradient absolute -right-32 -bottom-40 h-[28rem] w-[28rem] rounded-full opacity-40 blur-3xl" />
        <div aria-hidden className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />

        <div className="relative">
          <Logo light />
        </div>

        <div className="relative max-w-lg">
          <h2 className="font-display text-4xl leading-tight font-bold xl:text-5xl">
            {t("title")} <span className="text-brand-gradient">{t("titleAccent")}</span>
          </h2>
          <p className="mt-4 text-lg text-white/70">{t("body")}</p>

          {/* Zwevende voorbeeldkaartjes */}
          <div className="relative mt-10 h-52">
            <div className="animate-float absolute top-0 left-0 w-64 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md [--r:-3deg]">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
                <Sparkles size={14} className="text-amber-300" /> {t("card1Label")}
              </div>
              <p className="mt-2 text-sm font-semibold">{t("card1Text")}</p>
              <p className="mt-1 text-xs text-sky-200">#socialmedia #contentplanning</p>
            </div>
            <div
              className="animate-float absolute top-16 left-60 w-56 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md [--r:4deg]"
              style={{ animationDelay: "1.5s" }}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <CircleCheck size={14} /> {t("card2Label")}
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-white/80">
                <CalendarClock size={15} /> {t("card2Text")}
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-sm text-white/50">{t("footer")}</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}
