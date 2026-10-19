import { Building2, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { GenerateForm } from "@/components/generate/GenerateForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { buttonClass } from "@/components/ui/styles";
import { apiFetch } from "@/lib/api";
import type { Brand } from "@/lib/types";

// Claude kan er even over doen; geef de server actions op deze pagina ruim de tijd (seconden)
export const maxDuration = 300;

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("nav"))("generate") };
}

export default async function GeneratePage({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const { brand } = await searchParams;
  const t = await getTranslations("generate");
  const brands = await apiFetch<Brand[]>("/brands");

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      {brands.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t("noBrands.title")}
          body={t("noBrands.body")}
          action={
            <Link href="/brands/new" className={buttonClass.gradient}>
              <Plus size={16} /> {t("noBrands.action")}
            </Link>
          }
        />
      ) : (
        <GenerateForm brands={brands} initialBrandId={brand ? Number(brand) : undefined} />
      )}
    </div>
  );
}
