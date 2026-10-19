import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { logout } from "@/app/(auth)/actions";
import { Aurora } from "@/components/motion/Aurora";
import { Sidebar } from "@/components/Sidebar";
import { Alert } from "@/components/ui/Alert";
import { Logo } from "@/components/ui/Logo";
import { buttonClass } from "@/components/ui/styles";
import { getMe } from "@/lib/me";

// Schil voor alle pagina's achter de login: toegangscontrole via de backend, navigatie + werkvlak
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { me, error } = await getMe();
  if (error === "not_authenticated" || error === "invalid_token") redirect("/login");

  if (error || !me) {
    const t = await getTranslations();
    const noAccess = error === "email_not_allowed";
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Logo />
        <h1 className="mt-8 text-2xl font-bold">{noAccess ? t("auth.noAccess.title") : t("errors.page_failed_title")}</h1>
        <div className="mt-4">
          <Alert tone="error">
            {noAccess ? t("auth.noAccess.body") : t(error === "backend_unreachable" ? "errors.backend_unreachable" : "errors.unknown_error")}
          </Alert>
        </div>
        <form action={logout} className="mt-6">
          <button type="submit" className={buttonClass.secondary}>
            {t("nav.logout")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="relative isolate flex min-h-screen flex-col md:flex-row">
      <Aurora />
      <Sidebar email={me.email} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
