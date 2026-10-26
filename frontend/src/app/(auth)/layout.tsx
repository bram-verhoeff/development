import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AuthHero } from "@/components/auth/AuthHero";
import { Aurora } from "@/components/motion/Aurora";
import { FadeIn } from "@/components/motion/Reveal";
import { Logo } from "@/components/ui/Logo";

// Gesplitst scherm: links sfeer en uitleg (vanaf laptop), rechts het formulier
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("authHero");
  const tPrivacy = await getTranslations("privacy");
  const texts = {
    title: t("title"),
    titleAccent: t("titleAccent"),
    body: t("body"),
    card1Label: t("card1Label"),
    card1Text: t("card1Text"),
    card2Label: t("card2Label"),
    card2Text: t("card2Text"),
    dragHint: t("dragHint"),
  };

  return (
    <div className="relative isolate grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-nav text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="bg-dots absolute inset-0 opacity-60" />
        <div aria-hidden className="bg-brand-gradient absolute -right-32 -bottom-40 h-[28rem] w-[28rem] rounded-full opacity-40 blur-3xl" />
        <div aria-hidden className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />

        <div className="relative">
          <Logo light />
        </div>
        <AuthHero texts={texts} />
        <p className="relative text-sm text-white/50">{t("footer")}</p>
      </section>

      <section className="relative flex flex-col items-center justify-center gap-4 px-4 py-10 sm:px-8">
        <Aurora />
        <FadeIn className="w-full max-w-sm rounded-3xl border border-line bg-surface/80 p-6 shadow-2xl shadow-accent/10 backdrop-blur-xl sm:p-8">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </FadeIn>
        <Link href="/privacy" className="relative text-xs text-muted hover:text-foreground hover:underline">
          {tPrivacy("title")}
        </Link>
      </section>
    </div>
  );
}
