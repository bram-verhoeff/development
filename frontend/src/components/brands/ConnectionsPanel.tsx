"use client";

import { CircleAlert, Link2, LoaderCircle, Plug, Unplug } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";

import { disconnect, startConnection } from "@/app/(app)/brands/connections-actions";
import { PlatformIcon } from "@/components/ui/Badges";
import { buttonClass, cardClass } from "@/components/ui/styles";
import { useToast } from "@/components/ui/Toast";
import type { ConnectionsData, Platform } from "@/lib/types";

// Koppelingen van een merk met social-media-accounts
export function ConnectionsPanel({
  brandId,
  data,
  connected,
  connectError,
}: {
  brandId: number;
  data: ConnectionsData;
  connected?: string;
  connectError?: string;
}) {
  const t = useTranslations("connections");
  const tPlatforms = useTranslations("platforms");
  const tErrors = useTranslations("errors");
  const format = useFormatter();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState<Platform | null>(null);
  const [, startTransition] = useTransition();
  const shown = useRef(false);

  const errorText = (code: string) => (tErrors.has(code) ? tErrors(code) : tErrors("unknown_error"));

  // Melding na terugkomst van het platform, daarna de URL opschonen
  useEffect(() => {
    if (shown.current || (!connected && !connectError)) return;
    shown.current = true;
    if (connected) toast(t("connectedToast", { platform: tPlatforms(connected) }));
    if (connectError) toast(errorText(connectError), "error");
    router.replace(pathname, { scroll: false });
  });

  const connect = (platform: Platform) => {
    setBusy(platform);
    startTransition(async () => {
      const result = await startConnection(brandId, platform);
      // Bij succes stuurt de server door naar het platform; we komen hier alleen bij een fout
      if (result?.error) {
        toast(errorText(result.error), "error");
        setBusy(null);
      }
    });
  };

  const unlink = (platform: Platform) => {
    if (!confirm(t("disconnectConfirm", { platform: tPlatforms(platform) }))) return;
    setBusy(platform);
    startTransition(async () => {
      const result = await disconnect(brandId, platform);
      setBusy(null);
      if (result.error) toast(errorText(result.error), "error");
      else toast(t("disconnectedToast", { platform: tPlatforms(platform) }), "magic");
    });
  };

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`${cardClass} mb-5 p-5 sm:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Link2 size={16} />
            </span>
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("description")}</p>
        </div>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.platforms.map(({ platform, supported, configured }) => {
          const connection = data.connections.find((c) => c.platform === platform);
          const isBusy = busy === platform;
          return (
            <motion.li
              key={platform}
              layout
              className={`relative flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                connection && !connection.expired ? "border-emerald-300/70 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-line"
              } ${supported ? "" : "opacity-60"}`}
            >
              <div className="relative">
                {connection?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- profielfoto van het platform
                  <img src={connection.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <PlatformIcon platform={platform} size={40} />
                )}
                {connection && (
                  <span className="absolute -right-1 -bottom-1">
                    <PlatformIcon platform={platform} size={18} />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{connection ? connection.display_name : tPlatforms(platform)}</div>
                <div className="truncate text-xs text-muted">
                  {!supported
                    ? t("comingSoon")
                    : !configured
                      ? t("notConfigured")
                      : !connection
                        ? t("notConnected")
                        : connection.expired
                          ? <span className="inline-flex items-center gap-1 font-medium text-rose-600"><CircleAlert size={12} /> {t("expired")}</span>
                          : connection.expires_at
                            ? t("validUntil", { date: format.dateTime(new Date(connection.expires_at), { dateStyle: "medium" }) })
                            : t("connected")}
                </div>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {supported && configured && (
                  <motion.div key={connection ? "aan" : "uit"} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                    {connection && !connection.expired ? (
                      <button type="button" disabled={isBusy} onClick={() => unlink(platform)} className={`${buttonClass.ghost} px-2.5 py-1.5`} aria-label={t("disconnect")}>
                        {isBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Unplug size={16} />}
                      </button>
                    ) : (
                      <button type="button" disabled={isBusy} onClick={() => connect(platform)} className={`${buttonClass.gradient} px-3 py-1.5`}>
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
    </motion.section>
  );
}
