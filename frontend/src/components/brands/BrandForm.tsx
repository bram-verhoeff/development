"use client";

import { Megaphone, Palette, Save, Target, Type } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { saveBrand } from "@/app/(app)/brands/actions";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { Alert } from "@/components/ui/Alert";
import { Field, Select, TextArea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { buttonClass, cardClass } from "@/components/ui/styles";
import type { Brand } from "@/lib/types";

import { BrandLogo } from "./BrandLogo";
import { ColorListInput } from "./ColorListInput";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

function Section({ icon: Icon, title, hint, children }: { icon: LucideIcon; title: string; hint: string; children: React.ReactNode }) {
  return (
    <StaggerItem>
      <section className={`${cardClass} grid gap-5 p-5 sm:p-6 lg:grid-cols-[220px_1fr]`}>
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Icon size={16} />
          </span>
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted">{hint}</p>
      </div>
      <div className="space-y-4">{children}</div>
      </section>
    </StaggerItem>
  );
}

// Formulier voor nieuw én bestaand merk
export function BrandForm({ brand, logoError }: { brand?: Brand; logoError?: string }) {
  const t = useTranslations("brands");
  const tErrors = useTranslations("errors");
  const [state, action] = useActionState(saveBrand.bind(null, brand?.id ?? null), { error: logoError });
  const [fileError, setFileError] = useState<string>();

  const error = fileError ?? state.error;

  return (
    <form action={action}>
      <Stagger className="space-y-5" step={0.07}>
      {error && <Alert tone="error">{tErrors.has(error) ? tErrors(error) : tErrors("unknown_error")}</Alert>}

      <Section icon={Type} title={t("sections.basics")} hint={t("sections.basicsHint")}>
        <Field label={t("form.name")} name="name" defaultValue={brand?.name} maxLength={200} required />
        <Field label={t("form.website")} name="website_url" type="url" placeholder="https://" defaultValue={brand?.website_url ?? ""} />
        <Select label={t("form.language")} name="content_language" defaultValue={brand?.content_language ?? "nl"}>
          <option value="nl">{t("languages.nl")}</option>
          <option value="en">{t("languages.en")}</option>
        </Select>
      </Section>

      <Section icon={Target} title={t("sections.voice")} hint={t("sections.voiceHint")}>
        <TextArea label={t("form.audience")} name="target_audience" hint={t("form.audienceHint")} defaultValue={brand?.target_audience} maxLength={4000} />
        <TextArea label={t("form.tone")} name="tone_of_voice" hint={t("form.toneHint")} defaultValue={brand?.tone_of_voice} maxLength={4000} />
      </Section>

      <Section icon={Megaphone} title={t("sections.message")} hint={t("sections.messageHint")}>
        <TextArea label={t("form.usps")} name="usps" hint={t("form.onePerLine")} rows={4} defaultValue={brand?.usps.join("\n")} />
        <TextArea
          label={t("form.avoid")}
          name="avoid_terms"
          hint={`${t("form.avoidHint")} ${t("form.onePerLine")}`}
          rows={3}
          defaultValue={brand?.avoid_terms.join("\n")}
        />
      </Section>

      <Section icon={Palette} title={t("sections.look")} hint={t("sections.lookHint")}>
        <ColorListInput initial={brand?.colors ?? []} />
        <fieldset>
          <legend className="text-sm font-medium">{t("form.logo")}</legend>
          <div className="mt-1.5 flex items-center gap-4">
            {brand?.logo_url && <BrandLogo brand={brand} size={64} />}
            <div className="space-y-2">
              <input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setFileError(file && file.size > MAX_LOGO_BYTES ? "logo_too_large" : undefined);
                }}
                className="block text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:border-accent"
              />
              <p className="text-xs text-muted">{t("form.logoHint")}</p>
              {brand?.logo_url && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="remove_logo" className="accent-[var(--accent)]" /> {t("form.removeLogo")}
                </label>
              )}
            </div>
          </div>
        </fieldset>
      </Section>

      <StaggerItem className="flex flex-wrap justify-end gap-3">
        <Link href="/brands" className={buttonClass.secondary}>
          {t("form.cancel")}
        </Link>
        <SubmitButton pendingLabel={t("form.saving")} fullWidth={false} variant="gradient">
          <Save size={16} /> {brand ? t("form.save") : t("form.create")}
        </SubmitButton>
      </StaggerItem>
      </Stagger>
    </form>
  );
}
