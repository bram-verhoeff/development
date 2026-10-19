import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { BrandForm } from "@/components/brands/BrandForm";
import { PageHeader } from "@/components/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("brands"))("newTitle") };
}

export default async function NewBrandPage() {
  const t = await getTranslations("brands");
  return (
    <div>
      <PageHeader title={t("newTitle")} description={t("newDescription")} />
      <BrandForm />
    </div>
  );
}
