import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/ui/Logo";

type Section = { heading: string; paragraphs?: string[]; items?: string[] };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy");
  return { title: t("title") };
}

// Openbaar privacybeleid (ook zonder login bereikbaar; nodig voor de app-reviews van de platforms)
export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  const sections = t.raw("sections") as Section[];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-16">
      <Link href="/" aria-label={t("back")}>
        <Logo />
      </Link>

      <h1 className="font-display mt-10 text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("updated")}</p>
      <p className="mt-6 leading-relaxed">{t("intro")}</p>

      {sections.map((section) => (
        <section key={section.heading} className="mt-10">
          <h2 className="font-display text-xl font-semibold">{section.heading}</h2>
          {section.paragraphs?.map((p) => (
            <p key={p} className="mt-3 leading-relaxed text-foreground/90">
              {p}
            </p>
          ))}
          {section.items && (
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-foreground/90">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <p className="mt-12 border-t border-line pt-6 text-sm">
        <Link href="/" className="text-accent hover:underline">
          {t("back")}
        </Link>
      </p>
    </main>
  );
}
