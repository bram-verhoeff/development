import { getTranslations } from "next-intl/server";

// Gecentreerde kaart voor login, registratie en wachtwoordherstel
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("app");
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-xl font-semibold tracking-tight">{t("name")}</div>
          <div className="text-sm text-muted">{t("tagline")}</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
