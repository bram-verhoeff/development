"use client";

import { Building2, Check, CircleAlert, Link2, LoaderCircle, Plug, Sparkles, Unplug, UserRound } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

import { disconnect, setDefaultPage, startConnection } from "@/app/(app)/brands/connections-actions";
import { PlatformIcon } from "@/components/ui/Badges";
import { buttonClass, cardClass } from "@/components/ui/styles";
import { useToast } from "@/components/ui/Toast";
import type { Connection, ConnectionKind, ConnectionsData, Platform } from "@/lib/types";

// Volgorde waarin "Alles koppelen" de platforms langsgaat
const ORDER: ConnectionKind[] = ["linkedin", "linkedin_pages", "x", "facebook", "instagram", "tiktok"];
// De bedrijfspagina's krijgen het LinkedIn-icoon
const iconFor = (kind: ConnectionKind): Platform => (kind === "linkedin_pages" ? "linkedin" : kind);

// Platforms die je in deze ronde hebt overgeslagen (geannuleerd/mislukt), zodat de wizard niet blijft herhalen
const skipKey = (brandId: number) => `postpilot-wizard-skip-${brandId}`;
function readSkipped(brandId: number): ConnectionKind[] {
  try {
    return JSON.parse(sessionStorage.getItem(skipKey(brandId)) ?? "[]");
  } catch {
    return [];
  }
}
function writeSkipped(brandId: number, list: ConnectionKind[] | null) {
  try {
    if (list) sessionStorage.setItem(skipKey(brandId), JSON.stringify(list));
    else sessionStorage.removeItem(skipKey(brandId));
  } catch {
    // Geen sessionStorage (privévenster): dan slaat de wizard niets over, ook prima
  }
}

const isActive = (connection?: Connection) => Boolean(connection && !connection.expired);

// Koppelingen van een merk met social-media-accounts
export function ConnectionsPanel({
  brandId,
  data,
  connected,
  connectError,
  wizard,
  returnedPlatform,
}: {
  brandId: number;
  data: ConnectionsData;
  connected?: string;
  connectError?: string;
  wizard?: boolean;
  returnedPlatform?: string;
}) {
  const t = useTranslations("connections");
  const tPlatforms = useTranslations("platforms");
  const tErrors = useTranslations("errors");
  const format = useFormatter();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState<ConnectionKind | null>(null);
  const [next, setNext] = useState<ConnectionKind | null>(null);
  const [, startTransition] = useTransition();

  const errorText = (code: string) => (tErrors.has(code) ? tErrors(code) : tErrors("unknown_error"));
  const connectionOf = (platform: ConnectionKind) => data.connections.find((c) => c.platform === platform);
  const configured = ORDER.filter((p) => data.platforms.find((x) => x.platform === p)?.configured);
  const todo = (skipped: ConnectionKind[] = []) => configured.filter((p) => !isActive(connectionOf(p)) && !skipped.includes(p));
  const doneCount = configured.filter((p) => isActive(connectionOf(p))).length;

  const go = (platform: ConnectionKind, viaWizard: boolean) => {
    setBusy(platform);
    startTransition(async () => {
      const result = await startConnection(brandId, platform, viaWizard);
      // Bij succes stuurt de server door naar het platform; we komen hier alleen bij een fout
      if (result?.error) {
        toast(errorText(result.error), "error");
        setBusy(null);
        setNext(null);
      }
    });
  };

  // Terug van een platform (één keer bij het laden): melding tonen en bij de wizard doorgaan met het volgende.
  // Alles gebeurt in timers die dit effect zelf opruimt: zo voert React's dubbele dev-run het maar één keer uit,
  // en stopt de wizard netjes als je de pagina verlaat.
  useEffect(() => {
    if (!connected && !connectError) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));

    later(() => {
      if (connected) toast(t("connectedToast", { platform: tPlatforms(connected) }));
      if (connectError) toast(errorText(connectError), connectError === "connect_denied" ? "magic" : "error");
      router.replace(pathname, { scroll: false });
      if (!wizard) return;

      // sessionStorage: welke platforms je in deze ronde al hebt overgeslagen
      const skipped = readSkipped(brandId);
      if (connectError && returnedPlatform && !skipped.includes(returnedPlatform as ConnectionKind)) skipped.push(returnedPlatform as ConnectionKind);
      const remaining = todo(skipped);
      if (remaining.length === 0) {
        writeSkipped(brandId, null);
        later(() => toast(t("wizardDone"), "magic"), 600);
        return;
      }
      writeSkipped(brandId, skipped);
      // Even laten zien wat er komt, dan door naar het volgende platform
      setNext(remaining[0]);
      later(() => go(remaining[0], true), 1400);
    }, 0);

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bewust alleen bij het laden van de pagina
  }, []);

  const connectAll = () => {
    writeSkipped(brandId, []);
    const remaining = todo();
    if (remaining.length === 0) toast(t("allConnected"), "magic");
    else go(remaining[0], true);
  };

  const unlink = (platform: ConnectionKind) => {
    if (!confirm(t("disconnectConfirm", { platform: tPlatforms(platform) }))) return;
    setBusy(platform);
    startTransition(async () => {
      const result = await disconnect(brandId, platform);
      setBusy(null);
      if (result.error) toast(errorText(result.error), "error");
      else toast(t("disconnectedToast", { platform: tPlatforms(platform) }), "magic");
    });
  };

  const progress = configured.length ? doneCount / configured.length : 0;

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`${cardClass} relative mb-5 overflow-hidden p-5 sm:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Link2 size={16} />
            </span>
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("description")}</p>
        </div>

        {/* Eén knop voor alles */}
        <div className="flex flex-col items-end gap-1.5">
          <motion.button
            type="button"
            onClick={connectAll}
            disabled={configured.length === 0 || busy !== null}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`${buttonClass.gradient} px-5 py-2.5`}
          >
            {busy && next ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {t("connectAll")}
          </motion.button>
          <span className="text-xs text-muted">
            {configured.length === 0 ? t("noneConfigured") : t("progress", { done: doneCount, total: configured.length })}
          </span>
        </div>
      </div>

      {configured.length > 0 && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line">
          <motion.div className="bg-brand-gradient h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ type: "spring", stiffness: 90, damping: 20 }} />
        </div>
      )}

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ORDER.map((platform) => {
          const info = data.platforms.find((p) => p.platform === platform);
          const connection = connectionOf(platform);
          const isBusy = busy === platform;
          return (
            <motion.li
              key={platform}
              layout
              className={`relative flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                isActive(connection) ? "border-emerald-300/70 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-line"
              } ${info?.configured ? "" : "opacity-60"} ${next === platform ? "ring-2 ring-accent/40" : ""}`}
            >
              <div className="relative">
                {connection?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- profielfoto van het platform
                  <img src={connection.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <PlatformIcon platform={iconFor(platform)} size={40} />
                )}
                {connection && (
                  <span className="absolute -right-1 -bottom-1">
                    <PlatformIcon platform={iconFor(platform)} size={18} />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{connection ? connection.display_name : tPlatforms(platform)}</div>
                <div className="truncate text-xs text-muted">
                  {next === platform ? (
                    <span className="font-medium text-accent">{t("upNext")}</span>
                  ) : !info?.configured ? (
                    t("notConfigured")
                  ) : !connection ? (
                    t("notConnected")
                  ) : connection.expired ? (
                    <span className="inline-flex items-center gap-1 font-medium text-rose-600">
                      <CircleAlert size={12} /> {t("expired")}
                    </span>
                  ) : connection.expires_at ? (
                    t("validUntil", { date: format.dateTime(new Date(connection.expires_at), { dateStyle: "medium" }) })
                  ) : (
                    t("connected")
                  )}
                </div>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {info?.configured && (
                  <motion.div key={isActive(connection) ? "aan" : "uit"} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                    {isActive(connection) ? (
                      <button type="button" disabled={isBusy} onClick={() => unlink(platform)} className={`${buttonClass.ghost} px-2.5 py-1.5`} aria-label={t("disconnect")}>
                        {isBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Unplug size={16} />}
                      </button>
                    ) : (
                      <button type="button" disabled={busy !== null} onClick={() => go(platform, false)} className={`${buttonClass.secondary} px-3 py-1.5`}>
                        {isBusy ? <LoaderCircle size={15} className="animate-spin" /> : <Plug size={15} />}
                        {connection ? t("reconnect") : t("connect")}
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </ul>

      {isActive(connectionOf("linkedin_pages")) && (connectionOf("linkedin_pages")?.pages.length ?? 0) > 0 && (
        <DefaultPagePicker brandId={brandId} pages={connectionOf("linkedin_pages")!} profile={connectionOf("linkedin")} />
      )}

      {/* Tussenscherm van de wizard: "volgende: X" */}
      <AnimatePresence>
        {next && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface/85 backdrop-blur-sm"
          >
            <motion.div initial={{ scale: 0.6, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 16 }}>
              <PlatformIcon platform={iconFor(next)} size={56} />
            </motion.div>
            <p className="font-display text-lg font-semibold">{t("wizardNext", { platform: tPlatforms(next) })}</p>
            <LoaderCircle size={20} className="animate-spin text-accent" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

// Op welke bedrijfspagina (of je eigen profiel) nieuwe LinkedIn-posts van dit merk standaard komen
function DefaultPagePicker({ brandId, pages, profile }: { brandId: number; pages: Connection; profile?: Connection }) {
  const t = useTranslations("connections");
  const tErrors = useTranslations("errors");
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const current = pages.pages.find((p) => p.is_default)?.id ?? null;
  const [choice, setChoice] = useState<string | null>(current);

  const choose = (pageId: string | null) => {
    if (pageId === choice) return;
    const previous = choice;
    setChoice(pageId);
    startTransition(async () => {
      const result = await setDefaultPage(brandId, pageId);
      if (result.error) {
        setChoice(previous);
        toast(tErrors.has(result.error) ? tErrors(result.error) : tErrors("unknown_error"), "error");
      } else toast(t("defaultSaved"), "magic");
    });
  };

  const options = [
    { id: null, label: profile ? t("ownProfileNamed", { name: profile.display_name }) : t("ownProfile"), page: false },
    ...pages.pages.map((p) => ({ id: p.id, label: p.name, page: true })),
  ];

  return (
    <div className="mt-5 rounded-xl border border-line p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <PlatformIcon platform="linkedin" size={18} /> {t("pagesTitle")}
        {pending && <LoaderCircle size={14} className="animate-spin text-muted" />}
      </h3>
      <p className="mt-1 text-xs text-muted">{t("pagesDescription")}</p>
      <div role="radiogroup" aria-label={t("pagesTitle")} className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.id === choice;
          return (
            <button
              key={option.id ?? "profiel"}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={pending}
              onClick={() => choose(option.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                selected ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-accent/50"
              }`}
            >
              {selected ? <Check size={14} /> : option.page ? <Building2 size={14} /> : <UserRound size={14} />}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
