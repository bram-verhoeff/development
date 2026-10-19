import { Sparkles } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { BrandForm } from "@/components/brands/BrandForm";
import { BrandLogo } from "@/components/brands/BrandLogo";
import { DeleteBrandButton } from "@/components/brands/DeleteBrandButton";
import { buttonClass } from "@/components/ui/styles";
import { ApiError, apiFetch } from "@/lib/api";
import type { Brand } from "@/lib/types";

export default async function EditBrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ logoError?: string }>;
}) {
  const [{ id }, { logoError }] = await Promise.all([params, searchParams]);
  const t = await getTranslations("brands");

  let brand: Brand;
  try {
    brand = await apiFetch<Brand>(`/brands/${Number(id)}`);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 422)) notFound();
    throw e;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <BrandLogo brand={brand} size={56} />
          <h1 className="truncate text-2xl font-bold sm:text-3xl">{brand.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/generate?brand=${brand.id}`} className={buttonClass.gradient}>
            <Sparkles size={16} /> {t("generateFor")}
          </Link>
          <DeleteBrandButton brandId={brand.id} brandName={brand.name} />
        </div>
      </div>
      <BrandForm brand={brand} logoError={logoError} />
    </div>
  );
}
