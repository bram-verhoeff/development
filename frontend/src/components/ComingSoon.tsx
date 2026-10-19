import { getTranslations } from "next-intl/server";

// Tijdelijke inhoud voor pagina's die in een latere stap gebouwd worden
export async function ComingSoon({ titleKey }: { titleKey: string }) {
  const t = await getTranslations();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t(titleKey)}</h1>
      <p className="mt-2 text-muted">{t("common.comingSoon")}</p>
    </div>
  );
}
