"use client";

import { Check, FileText, Link2, Sparkles, WandSparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal, useFormStatus } from "react-dom";

import { generatePosts } from "@/app/(app)/generate/actions";
import { BrandLogo } from "@/components/brands/BrandLogo";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
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
    <StaggerItem>
      <section className={`${cardClass} p-5 sm:p-6`}>
        <h2 className="flex items-center gap-3 text-lg font-semibold">
          <span className="bg-brand-gradient inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white shadow-md shadow-accent/30">
            {number}
          </span>
          {title}
        </h2>
        <div className="mt-4">{children}</div>
      </section>
    </StaggerItem>
  );
}

// Vinkje dat "popt" zodra iets gekozen is
function CheckBadge({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 90 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className="absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md shadow-accent/40"
        >
          <Check size={12} strokeWidth={3} />
        </motion.span>
      )}
    </AnimatePresence>
  );
}

const selectable = (active: boolean) =>
  `relative cursor-pointer rounded-xl border transition-[border-color,background-color,box-shadow] ${
    active ? "border-accent bg-accent-soft/60 shadow-lg shadow-accent/15 ring-2 ring-accent/25" : "border-line bg-surface hover:border-accent/40"
  }`;

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
    <form action={action} className="relative">
      <Stagger className="space-y-5" step={0.08}>
        <AnimatePresence>
          {errorText && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Alert tone="error">{errorText}</Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <Step number={1} title={t("steps.brand")}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => {
              const active = brand.id === brandId;
              return (
                <motion.label key={brand.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className={`${selectable(active)} flex items-center gap-3 p-3`}>
                  <input type="radio" name="brand_id" value={brand.id} checked={active} onChange={() => setBrandId(brand.id)} className="sr-only" />
                  <BrandLogo brand={brand} size={40} />
                  <span className="min-w-0 flex-1 truncate pr-6 font-medium">{brand.name}</span>
                  <CheckBadge show={active} />
                </motion.label>
              );
            })}
          </div>
        </Step>

        <Step number={2} title={t("steps.platforms")}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {PLATFORMS.map((platform) => {
              const active = platforms.includes(platform);
              return (
                <motion.label
                  key={platform}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${selectable(active)} flex flex-col items-center gap-2 px-3 py-4 text-sm font-medium ${active ? "" : "opacity-80"}`}
                >
                  <input type="checkbox" name="platforms" value={platform} checked={active} onChange={() => toggle(platform)} className="sr-only" />
                  <motion.span animate={{ scale: active ? 1.1 : 1, rotate: active ? -4 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                    <PlatformIcon platform={platform} size={38} />
                  </motion.span>
                  {tPlatforms(platform)}
                  <CheckBadge show={active} />
                </motion.label>
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
                  className={`relative h-8 w-9 rounded-lg text-sm font-semibold transition-colors ${count === n ? "text-accent-foreground" : "text-muted hover:text-foreground"}`}
                >
                  {count === n && <motion.span layoutId="count-pill" className="absolute inset-0 rounded-lg bg-accent shadow-sm shadow-accent/40" />}
                  <span className="relative">{n}</span>
                </button>
              ))}
            </div>
            <input type="hidden" name="posts_per_platform" value={count} />
            <motion.span key={count * platforms.length} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-muted">
              {t("total", { count: count * platforms.length })}
            </motion.span>
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
                className={`relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  source === value ? "text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {source === value && <motion.span layoutId="source-pill" className="absolute inset-0 rounded-lg bg-surface shadow-sm" />}
                <Icon size={15} className="relative" />
                <span className="relative">{t(`source.${value}`)}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={source}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              {source === "none" && <p className="pt-3 text-sm text-muted">{t("source.noneHint")}</p>}
              {source === "url" && (
                <label className="block pt-3">
                  <span className="text-sm font-medium">{t("source.urlLabel")}</span>
                  <input name="source_url" type="url" required placeholder="https://" className={inputClass} />
                  <span className="mt-1 block text-xs text-muted">{t("source.urlHint")}</span>
                </label>
              )}
              {source === "text" && (
                <label className="block pt-3">
                  <span className="text-sm font-medium">{t("source.textLabel")}</span>
                  <textarea name="source_text" rows={6} required maxLength={20000} className={inputClass} placeholder={t("source.textPlaceholder")} />
                </label>
              )}
            </motion.div>
          </AnimatePresence>

          <label className="mt-5 block">
            <span className="text-sm font-medium">{t("instructions")}</span>
            <textarea name="instructions" rows={3} maxLength={2000} className={inputClass} placeholder={t("instructionsPlaceholder")} />
          </label>
        </Step>

        <StaggerItem className="flex justify-end">
          <GenerateButton disabled={!brandId || platforms.length === 0} />
        </StaggerItem>
      </Stagger>

      <PendingOverlay platforms={platforms} />
    </form>
  );
}

function GenerateButton({ disabled }: { disabled: boolean }) {
  const t = useTranslations("generate");
  const { pending } = useFormStatus();
  return (
    <motion.button
      type="submit"
      disabled={disabled || pending}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className="shine bg-brand-gradient inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-accent/30 disabled:opacity-50"
    >
      <motion.span animate={{ rotate: [0, -12, 12, 0] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2 }}>
        <WandSparkles size={19} />
      </motion.span>
      {t("submit")}
    </motion.button>
  );
}

// Alleen in de browser renderen (portal naar <body>)
const subscribe = () => () => {};
const useIsClient = () => useSyncExternalStore(subscribe, () => true, () => false);

// Wachtscherm zolang de AI schrijft; via een portal zodat het altijd het hele scherm bedekt
function PendingOverlay({ platforms }: { platforms: Platform[] }) {
  const { pending } = useFormStatus();
  const isClient = useIsClient();
  if (!isClient) return null;
  return createPortal(<AnimatePresence>{pending && <PendingSteps platforms={platforms} />}</AnimatePresence>, document.body);
}

const PENDING_STEPS = ["profile", "angles", "hooks", "writing", "polish"] as const;

function PendingSteps({ platforms }: { platforms: Platform[] }) {
  const t = useTranslations("generate.pending");
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, PENDING_STEPS.length - 1)), 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-nav/75 p-4 backdrop-blur-md"
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-nav p-7 text-center text-white shadow-2xl"
      >
        <div aria-hidden className="bg-brand-gradient absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-40 blur-3xl" />

        {/* Platformiconen die rond een pulserende vonk draaien */}
        <div className="relative mx-auto h-36 w-36">
          <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
            {platforms.map((platform, i) => {
              const angle = (i / platforms.length) * Math.PI * 2;
              return (
                <span
                  key={platform}
                  className="absolute top-1/2 left-1/2"
                  style={{ transform: `translate(-50%, -50%) translate(${Math.cos(angle) * 60}px, ${Math.sin(angle) * 60}px)` }}
                >
                  <motion.span className="block" animate={{ rotate: -360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                    <PlatformIcon platform={platform} size={28} />
                  </motion.span>
                </span>
              );
            })}
          </motion.div>
          <motion.div
            className="bg-brand-gradient absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl shadow-lg shadow-accent/50"
            animate={{ scale: [1, 1.12, 1], rotate: [0, 8, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles size={28} />
          </motion.div>
        </div>

        <p className="relative mt-3 font-display text-xl font-semibold">{t("title")}</p>

        <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="bg-brand-gradient h-full rounded-full"
            initial={{ width: "4%" }}
            animate={{ width: `${((step + 1) / PENDING_STEPS.length) * 92}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 20 }}
          />
        </div>

        <ul className="relative mt-5 space-y-2 text-left text-sm">
          {PENDING_STEPS.map((key, index) => (
            <motion.li
              key={key}
              className="flex items-center gap-2.5"
              animate={{ opacity: index <= step ? 1 : 0.35, x: index === step ? 4 : 0 }}
            >
              <span className="relative inline-flex h-5 w-5 items-center justify-center">
                {index < step ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                    <Check size={12} strokeWidth={3} />
                  </motion.span>
                ) : index === step ? (
                  <span className="h-2.5 w-2.5 animate-ping rounded-full bg-coral" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-white/30" />
                )}
              </span>
              {t(key)}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
