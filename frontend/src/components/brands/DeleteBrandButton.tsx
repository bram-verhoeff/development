"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { deleteBrand } from "@/app/(app)/brands/actions";
import { buttonClass } from "@/components/ui/styles";

// Verwijderen na bevestiging; posts en generaties van het merk gaan mee
export function DeleteBrandButton({ brandId, brandName }: { brandId: number; brandName: string }) {
  const t = useTranslations("brands");
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={buttonClass.danger}
      onClick={() => {
        if (confirm(t("delete.confirm", { name: brandName }))) startTransition(() => deleteBrand(brandId));
      }}
    >
      {pending ? t("delete.busy") : t("delete.button")}
    </button>
  );
}
