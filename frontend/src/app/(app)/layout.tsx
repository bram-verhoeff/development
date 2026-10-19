import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { logout } from "@/app/(auth)/actions";
import { Sidebar } from "@/components/Sidebar";
import { Alert } from "@/components/ui/Alert";
import { getMe } from "@/lib/me";

// Schil voor alle pagina's achter de login: toegangscontrole via de backend, navigatie + werkvlak
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { error } = await getMe();
  if (error === "not_authenticated" || error === "invalid_token") redirect("/login");

  if (error) {
    const t = await getTranslations();
    const noAccess = error === "email_not_allowed";
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-xl font-semibold">{noAccess ? t("auth.noAccess.title") : t("app.name")}</h1>
        <div className="mt-4">
          <Alert tone="error">
            {noAccess ? t("auth.noAccess.body") : t(error === "backend_unreachable" ? "errors.backend_unreachable" : "errors.unknown_error")}
          </Alert>
        </div>
        <form action={logout} className="mt-4">
          <button type="submit" className="text-sm text-accent hover:underline">
            {t("nav.logout")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
