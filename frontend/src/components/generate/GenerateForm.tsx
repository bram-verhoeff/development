"use client";

import { Check, FileText, Link2, Sparkles, WandSparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { generatePosts } from "@/app/(app)/generate/actions";
import { BrandLogo } from "@/components/brands/BrandLogo";
import { Alert } from "@/components/ui/Alert";
import { PlatformIcon } from "@/components/ui/Badges";
import { cardClass, inputClass } from "@/components/ui/styles";
import { PLATFORMS, type Brand, type Platform } from "@/lib/types";

type SourceType = "none" | "url" | "text";

const sourceTabs: { value: SourceType; Icon: typeof Link2 }[] = [
  { value: "none", Icon: Sparkles },
  { value: "url", Icon: Link2 },
  { value: "text", Icon: FileText },
];

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className={`${cardClass} p-5 sm:p-6`}>
      <h2 className="flex items-center gap-3 text-lg font-semibold">
        <span className="bg-brand-gradient inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white">
          {number}
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function GenerateForm({ brands, initialBrandId }: { brands: Brand[]; initialBrandId?: number }) {
  const t = useTranslations("generate");
  const tPlatforms = useTranslations("platforms");
  const tErrors = useTranslations("errors");
  const [state, action] = useActionState(generatePosts, {});
  const [brandId, setBrandId] = useState(initialBrandId ?? brands[0]?.id);
  const [platforms, setPlatforms] = useState<Platform[]>(["instagram", "linkedin"]);
  const [count, setCount] = useState(3);
  const [source, setSource] = useState<SourceType>("none");

  const toggle = (platform: Platform) =>
    setPlatforms((list) => (list.includes(platform) ? list.filter((p) => p !== platform) : [...list, platform]));

  const errorText = state.error ? (tErrors.has(state.error) ? tErrors(state.error) : tErrors("unknown_error")) : null;

  return (
    <form action={action} className="relative space-y-5">
      {errorText && <Alert tone="error">{errorText}</Alert>}

      <Step number={1} title={t("steps.brand")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => {
            const active = brand.id === brandId;
            return (
              <label
                key={brand.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                  active ? "border-accent bg-accent-soft/60 ring-2 ring-accent/25" : "border-line hover:border-accent/40"
                }`}
              >
                <input type="radio" name="brand_id" value={brand.id} checked={active} onChange={() => setBrandId(brand.id)} className="sr-only" />
                <BrandLogo brand={brand} size={40} />
                <span className="min-w-0 flex-1 truncate font-medium">{brand.name}</span>
                {active && <Check size={18} className="text-accent" />}
              </label>
            );
          })}
        </div>
      </Step>

      <Step number={2} title={t("steps.platforms")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PLATFORMS.map((platform) => {
            const active = platforms.includes(platform);
            return (
              <label
                key={platform}
                className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-medium transition ${
                  active ? "border-accent bg-accent-soft/60 ring-2 ring-accent/25" : "border-line opacity-80 hover:opacity-100"
                }`}
              >
                <input type="checkbox" name="platforms" value={platform} checked={active} onChange={() => toggle(platform)} className="sr-only" />
                <PlatformIcon platform={platform} size={36} />
                {tPlatforms(platform)}
                {active && (
                  <span className="absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </label>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">{t("count")}</span>
          <div className="inline-flex rounded-xl border border-line bg-surface-2 p-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                aria-pressed={count === n}
                className={`h-8 w-9 rounded-lg text-sm font-semibold transition ${count === n ? "bg-accent text-accent-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
              >
                {n}
              </button>
            ))}
          </div>
          <input type="hidden" name="posts_per_platform" value={count} />
          <span className="text-sm text-muted">{t("total", { count: count * platforms.length })}</span>
        </div>
      </Step>

      <Step number={3} title={t("steps.source")}>
        <input type="hidden" name="source_type" value={source} />
        <div className="inline-flex flex-wrap rounded-xl border border-line bg-surface-2 p-1">
          {sourceTabs.map(({ value, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSource(value)}
              aria-pressed={source === value}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                source === value ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              <Icon size={15} /> {t(`source.${value}`)}
            </button>
          ))}
        </div>
        {source === "none" && <p className="mt-3 text-sm text-muted">{t("source.noneHint")}</p>}
        {source === "url" && (
          <label className="mt-3 block">
            <span className="text-sm font-medium">{t("source.urlLabel")}</span>
            <input name="source_url" type="url" required placeholder="https://" className={inputClass} />
            <span className="mt-1 block text-xs text-muted">{t("source.urlHint")}</span>
          </label>
        )}
        {source === "text" && (
          <label className="mt-3 block">
            <span className="text-sm font-medium">{t("source.textLabel")}</span>
            <textarea name="source_text" rows={6} required maxLength={20000} className={inputClass} placeholder={t("source.textPlaceholder")} />
          </label>
        )}

        <label className="mt-5 block">
          <span className="text-sm font-medium">{t("instructions")}</span>
          <textarea name="instructions" rows={3} maxLength={2000} className={inputClass} placeholder={t("instructionsPlaceholder")} />
        </label>
      </Step>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <GenerateButton disabled={!brandId || platforms.length === 0} />
      </div>

      <PendingOverlay />
    </form>
  );
}

function GenerateButton({ disabled }: { disabled: boolean }) {
  const t = useTranslations("generate");
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="bg-brand-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lg shadow-accent/30 transition hover:brightness-110 disabled:opacity-50"
    >
      <WandSparkles size={18} /> {t("submit")}
    </button>
  );
}

// Overlay met wisselende statusregels zolang Claude schrijft (dat kan een halve minuut duren)
function PendingOverlay() {
  const { pending } = useFormStatus();
  // Telkens opnieuw gemount bij een nieuwe opdracht, dus de stappen beginnen vanzelf bij 0
  return pending ? <PendingSteps /> : null;
}

const PENDING_STEPS = ["profile", "angles", "hooks", "writing", "polish"] as const;

function PendingSteps() {
  const t = useTranslations("generate.pending");
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, PENDING_STEPS.length - 1)), 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nav/70 p-4 backdrop-blur-sm" role="status" aria-live="polite">
      <div className={`${cardClass} w-full max-w-sm p-6 text-center`}>
        <div className="bg-brand-gradient mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl text-white shadow-lg shadow-accent/40">
          <Sparkles size={26} />
        </div>
        <p className="mt-4 font-display text-lg font-semibold">{t("title")}</p>
        <ul className="mt-4 space-y-2 text-left text-sm">
          {PENDING_STEPS.map((key, index) => (
            <li key={key} className={`flex items-center gap-2 transition ${index <= step ? "text-foreground" : "text-muted/50"}`}>
              <span className={`h-2 w-2 rounded-full ${index < step ? "bg-emerald-500" : index === step ? "animate-ping bg-accent" : "bg-line"}`} />
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
