import { getTranslations } from "next-intl/server";

import { BrandForm } from "@/components/brands/BrandForm";

export default async function NewBrandPage() {
  const t = await getTranslations("brands");
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t("newTitle")}</h1>
      <BrandForm />
    </div>
  );
}
