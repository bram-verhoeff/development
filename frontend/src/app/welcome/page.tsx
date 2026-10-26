import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Landing } from "@/components/landing/Landing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  return { title: t("metaTitle") };
}

// Openbare landingspagina; de proxy toont deze op "/" aan bezoekers zonder login
export default function WelcomePage() {
  return <Landing />;
}
