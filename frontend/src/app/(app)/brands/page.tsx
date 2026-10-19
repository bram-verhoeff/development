import { Building2, Globe, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { BrandLogo } from "@/components/brands/BrandLogo";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { buttonClass, cardClass } from "@/components/ui/styles";
import { apiFetch } from "@/lib/api";
import type { Brand } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("nav"))("brands") };
}

export default async function BrandsPage() {
  const t = await getTranslations("brands");
  const brands = await apiFetch<Brand[]>("/brands");

  const newButton = (
    <Link href="/brands/new" className={buttonClass.gradient}>
      <Plus size={16} /> {t("new")}
    </Link>
  );

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} actions={brands.length > 0 && newButton} />

      {brands.length === 0 ? (
        <EmptyState icon={Building2} title={t("empty.title")} body={t("empty.body")} action={newButton} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {brands.map((brand) => (
            <li key={brand.id}>
              <Link
                href={`/brands/${brand.id}`}
                className={`${cardClass} group flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg`}
              >
                {/* Kleurstrook met de merkkleuren */}
                <div className="flex h-2">
                  {(brand.colors.length ? brand.colors : ["var(--accent)", "var(--coral)"]).map((color, i) => (
                    <span key={i} className="flex-1" style={{ background: color }} />
                  ))}
                </div>
                <div className="flex flex-1 gap-4 p-5">
                  <BrandLogo brand={brand} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-lg font-semibold">{brand.name}</div>
                    {brand.website_url && (
                      <div className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted">
                        <Globe size={13} /> {new URL(brand.website_url).hostname}
                      </div>
                    )}
                    {brand.tone_of_voice && <p className="mt-2 line-clamp-2 text-sm text-muted">{brand.tone_of_voice}</p>}
                  </div>
                </div>
                {brand.usps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-5 pb-5">
                    {brand.usps.slice(0, 3).map((usp) => (
                      <span key={usp} className="max-w-full truncate rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium">
                        {usp}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
