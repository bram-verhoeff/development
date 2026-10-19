"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { saveBrand } from "@/app/(app)/brands/actions";
import { Alert } from "@/components/ui/Alert";
import { Field, Select, TextArea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { buttonClass } from "@/components/ui/styles";
import type { Brand } from "@/lib/types";

import { BrandLogo } from "./BrandLogo";
import { ColorListInput } from "./ColorListInput";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

// Formulier voor nieuw én bestaand merk
export function BrandForm({ brand, logoError }: { brand?: Brand; logoError?: string }) {
  const t = useTranslations("brands");
  const tErrors = useTranslations("errors");
  const [state, action] = useActionState(saveBrand.bind(null, brand?.id ?? null), { error: logoError });
  const [fileError, setFileError] = useState<string>();

  const error = fileError ?? state.error;

  return (
    <form action={action} className="max-w-2xl space-y-5">
      {error && <Alert tone="error">{tErrors.has(error) ? tErrors(error) : tErrors("unknown_error")}</Alert>}

      <Field label={t("form.name")} name="name" defaultValue={brand?.name} maxLength={200} required />
      <Field
        label={t("form.website")}
        name="website_url"
        type="url"
        placeholder="https://"
        defaultValue={brand?.website_url ?? ""}
      />
      <TextArea
        label={t("form.audience")}
        name="target_audience"
        hint={t("form.audienceHint")}
        defaultValue={brand?.target_audience}
        maxLength={4000}
      />
      <TextArea
        label={t("form.tone")}
        name="tone_of_voice"
        hint={t("form.toneHint")}
        defaultValue={brand?.tone_of_voice}
        maxLength={4000}
      />
      <TextArea
        label={t("form.usps")}
        name="usps"
        hint={t("form.onePerLine")}
        rows={4}
        defaultValue={brand?.usps.join("\n")}
      />
      <TextArea
        label={t("form.avoid")}
        name="avoid_terms"
        hint={`${t("form.avoidHint")} ${t("form.onePerLine")}`}
        rows={3}
        defaultValue={brand?.avoid_terms.join("\n")}
      />
      <Select label={t("form.language")} name="content_language" defaultValue={brand?.content_language ?? "nl"}>
        <option value="nl">{t("languages.nl")}</option>
        <option value="en">{t("languages.en")}</option>
      </Select>

      <ColorListInput initial={brand?.colors ?? []} />

      <fieldset>
        <legend className="text-sm font-medium">{t("form.logo")}</legend>
        <div className="mt-1 flex items-center gap-4">
          {brand?.logo_url && <BrandLogo brand={brand} size={56} />}
          <div className="space-y-2">
            <input
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setFileError(file && file.size > MAX_LOGO_BYTES ? "logo_too_large" : undefined);
              }}
              className="block text-sm file:mr-3 file:rounded-md file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
            <p className="text-xs text-muted">{t("form.logoHint")}</p>
            {brand?.logo_url && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="remove_logo" /> {t("form.removeLogo")}
              </label>
            )}
          </div>
        </div>
      </fieldset>

      <div className="flex gap-3 pt-2">
        <SubmitButton pendingLabel={t("form.saving")} fullWidth={false}>
          {brand ? t("form.save") : t("form.create")}
        </SubmitButton>
        <Link href="/brands" className={buttonClass.secondary}>
          {t("form.cancel")}
        </Link>
      </div>
    </form>
  );
}
