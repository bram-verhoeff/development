import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { BrandLogo } from "@/components/brands/BrandLogo";
import { buttonClass } from "@/components/ui/styles";
import { apiFetch } from "@/lib/api";
import type { Brand } from "@/lib/types";

export default async function BrandsPage() {
  const t = await getTranslations("brands");
  const brands = await apiFetch<Brand[]>("/brands");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <Link href="/brands/new" className={buttonClass.primary}>
          {t("new")}
        </Link>
      </div>

      {brands.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-line bg-surface p-8 text-center">
          <p className="font-medium">{t("empty.title")}</p>
          <p className="mt-1 text-sm text-muted">{t("empty.body")}</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {brands.map((brand) => (
            <li key={brand.id}>
              <Link
                href={`/brands/${brand.id}`}
                className="flex h-full gap-4 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent"
              >
                <BrandLogo brand={brand} />
                <div className="min-w-0">
                  <div className="truncate font-semibold">{brand.name}</div>
                  {brand.website_url && (
                    <div className="truncate text-sm text-muted">{new URL(brand.website_url).hostname}</div>
                  )}
                  {brand.colors.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {brand.colors.map((color) => (
                        <span
                          key={color}
                          title={color}
                          className="h-4 w-4 rounded-full border border-line"
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
