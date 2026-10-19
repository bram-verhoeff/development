"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { PlatformIcon } from "@/components/ui/Badges";
import { inputClass } from "@/components/ui/styles";
import { PLATFORMS, type Brand, type Platform } from "@/lib/types";

// Filters staan in de URL, zodat je een gefilterde weergave kunt delen of terugvinden
export function PostFilters({
  brands,
  statuses,
  showStatus = true,
}: {
  brands: Pick<Brand, "id" | "name">[];
  statuses?: readonly string[];
  showStatus?: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("run"); // een filter wijzigen verlaat de weergave "net gegenereerd"
    router.push(`${pathname}?${next.toString()}`);
  };

  const activePlatform = params.get("platform") as Platform | null;
  const activeStatus = params.get("status");

  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
      {showStatus && statuses && (
        <div className="inline-flex rounded-xl border border-line bg-surface p-1 shadow-card" role="tablist">
          {[null, ...statuses].map((status) => (
            <button
              key={status ?? "all"}
              type="button"
              role="tab"
              aria-selected={activeStatus === status}
              onClick={() => update("status", status)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activeStatus === status ? "bg-accent text-accent-foreground shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              {status ? t(`status.${status}`) : t("filters.all")}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {PLATFORMS.map((platform) => {
          const active = activePlatform === platform;
          return (
            <button
              key={platform}
              type="button"
              aria-pressed={active}
              title={t(`platforms.${platform}`)}
              onClick={() => update("platform", active ? null : platform)}
              className={`rounded-xl border p-1.5 transition ${
                active ? "border-accent bg-accent-soft ring-2 ring-accent/30" : "border-line bg-surface opacity-70 hover:opacity-100"
              }`}
            >
              <PlatformIcon platform={platform} size={24} />
            </button>
          );
        })}
      </div>

      <select
        aria-label={t("filters.brand")}
        value={params.get("brand") ?? ""}
        onChange={(e) => update("brand", e.target.value || null)}
        className={`${inputClass} mt-0 lg:ml-auto lg:w-56`}
      >
        <option value="">{t("filters.allBrands")}</option>
        {brands.map((brand) => (
          <option key={brand.id} value={brand.id}>
            {brand.name}
          </option>
        ))}
      </select>
    </div>
  );
}
