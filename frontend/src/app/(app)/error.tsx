"use client";

import { useTranslations } from "next-intl";

import { Alert } from "@/components/ui/Alert";
import { buttonClass } from "@/components/ui/styles";

// Vangt onverwachte fouten op pagina's achter de login op, met de navigatie er nog omheen
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  return (
    <div className="max-w-md space-y-4">
      <Alert tone="error">{t("page_failed")}</Alert>
      <button type="button" onClick={reset} className={buttonClass.secondary}>
        {t("retry")}
      </button>
    </div>
  );
}
