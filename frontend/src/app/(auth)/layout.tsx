import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Aurora } from "@/components/motion/Aurora";
import { FadeIn } from "@/components/motion/Reveal";
import { Logo } from "@/components/ui/Logo";

// Rustig, gecentreerd scherm: logo en slogan, daaronder het formulier in één kaart
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("authHero");
  const tPrivacy = await getTranslations("privacy");

  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-8">
      <Aurora />

      <FadeIn className="flex w-full max-w-sm flex-col items-center">
        <Logo />
        <p className="mt-3 text-center text-sm text-muted">
          {t("title")} <span className="font-semibold text-accent">{t("titleAccent")}</span>
        </p>

        <div className="mt-8 w-full rounded-3xl border border-line bg-surface/90 p-6 shadow-card backdrop-blur-xl sm:p-8">
          {children}
        </div>
      </FadeIn>

      <div className="mt-8 flex flex-col items-center gap-2 text-xs text-muted">
        <p>{t("footer")}</p>
        <Link href="/privacy" className="hover:text-foreground hover:underline">
          {tPrivacy("title")}
        </Link>
      </div>
    </div>
  );
}
