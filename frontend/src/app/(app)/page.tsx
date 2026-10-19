import { getTranslations } from "next-intl/server";

import { getMe } from "@/lib/me";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const { me } = await getMe();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("intro")}</p>
      {me && <p className="mt-6 text-sm text-muted">{t("loggedInAs", { email: me.email })}</p>}
    </div>
  );
}
