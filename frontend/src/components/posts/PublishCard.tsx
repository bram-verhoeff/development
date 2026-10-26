"use client";

import { CalendarClock, ExternalLink, Link2, LoaderCircle, PartyPopper, Send, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { publishPost, setPublishAs } from "@/app/(app)/posts/actions";
import { Burst } from "@/components/motion/Burst";
import { PlatformIcon } from "@/components/ui/Badges";
import { buttonClass, cardClass, inputClass } from "@/components/ui/styles";
import { useToast } from "@/components/ui/Toast";
import type { Platform, PostDetail } from "@/lib/types";

// Platforms waarvoor PostPilot al zelf (tekst) kan publiceren
const PUBLISHABLE: Platform[] = ["linkedin", "x", "facebook"];
// Platforms die alleen posts met afbeelding of video accepteren
const MEDIA_ONLY: Platform[] = ["instagram", "tiktok"];

// Nu meteen plaatsen op het gekoppelde account
export function PublishCard({ post }: { post: PostDetail }) {
  const t = useTranslations("publish");
  const tPlatforms = useTranslations("platforms");
  const tErrors = useTranslations("errors");
  const format = useFormatter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [burst, setBurst] = useState(0);
  const platform = tPlatforms(post.platform);
  // Profiel of bedrijfspagina waarop de post komt
  const account = post.publish_as_label ?? post.connection?.display_name ?? "";
  const errorText = (code: string) => (tErrors.has(code) ? tErrors(code) : tErrors("unknown_error"));
  const when = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "medium", timeStyle: "short" });

  const publish = () => {
    if (!confirm(t("confirm", { platform, account }))) return;
    startTransition(async () => {
      const result = await publishPost(post.id);
      if (result.error) toast(errorText(result.error), "error");
      else {
        setBurst((n) => n + 1);
        toast(t("published", { platform }));
      }
    });
  };

  let content: React.ReactNode;
  if (post.published_at) {
    content = (
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-3">
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <PartyPopper size={16} /> {t("publishedAt", { date: when(post.published_at) })}
        </p>
        {post.external_url && (
          <a href={post.external_url} target="_blank" rel="noopener noreferrer" className={`${buttonClass.secondary} w-full`}>
            <ExternalLink size={16} /> {t("view", { platform })}
          </a>
        )}
      </motion.div>
    );
  } else if (MEDIA_ONLY.includes(post.platform)) {
    content = <p className="text-sm text-muted">{t("mediaRequired", { platform })}</p>;
  } else if (!PUBLISHABLE.includes(post.platform)) {
    content = <p className="text-sm text-muted">{t("notYet", { platform })}</p>;
  } else if (!post.connection || post.connection.expired) {
    content = (
      <div className="space-y-3">
        <p className="text-sm text-muted">{post.connection ? t("expired", { platform }) : t("connectFirst", { platform })}</p>
        <Link href={`/brands/${post.brand_id}`} className={`${buttonClass.secondary} w-full`}>
          <Link2 size={16} /> {post.connection ? t("reconnect", { platform }) : t("connect", { platform })}
        </Link>
      </div>
    );
  } else if (post.status !== "approved") {
    content = <p className="text-sm text-muted">{t("approveFirst")}</p>;
  } else {
    content = (
      <div className="space-y-3">
        <p className="text-sm text-muted">{t("asAccount", { account })}</p>
        {post.scheduled_at && (
          <p className="flex items-center gap-2 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
            <CalendarClock size={16} className="shrink-0" />
            {post.next_attempt_at ? t("retryAt", { date: when(post.next_attempt_at) }) : t("autoAt", { date: when(post.scheduled_at) })}
          </p>
        )}
        <motion.button
          type="button"
          disabled={pending}
          onClick={publish}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          className={`${buttonClass.gradient} relative w-full py-2.5`}
        >
          {pending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
          {pending ? t("publishing") : t("button", { platform })}
          {burst > 0 && <Burst key={burst} count={16} />}
        </motion.button>
      </div>
    );
  }

  return (
    <section className={`${cardClass} p-5`}>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <PlatformIcon platform={post.platform} size={22} /> {t("title")}
      </h2>
      {post.publish_error && !post.published_at && (
        <p className="mt-3 flex gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" /> {t("lastError", { error: errorText(post.publish_error) })}
        </p>
      )}
      {!post.published_at && <PublishAsPicker post={post} />}
      <div className="mt-3">{content}</div>
    </section>
  );
}

// LinkedIn: kiezen tussen je eigen profiel en een gekoppelde bedrijfspagina
function PublishAsPicker({ post }: { post: PostDetail }) {
  const t = useTranslations("publish");
  const tErrors = useTranslations("errors");
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [choice, setChoice] = useState(post.publish_as ?? "");

  // Alleen tonen als er echt iets te kiezen valt (er zijn bedrijfspagina's gekoppeld)
  if (!post.publish_options.some((o) => o.kind === "page")) return null;

  const change = (value: string) => {
    const previous = choice;
    setChoice(value);
    startTransition(async () => {
      const result = await setPublishAs(post.id, value || null);
      if (result.error) {
        setChoice(previous);
        toast(tErrors.has(result.error) ? tErrors(result.error) : tErrors("unknown_error"), "error");
      }
    });
  };

  return (
    <label className="mt-3 block">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
        {t("publishAs")}
        {pending && <LoaderCircle size={12} className="animate-spin" />}
      </span>
      <select value={choice} disabled={pending} onChange={(e) => change(e.target.value)} className={inputClass}>
        {post.publish_options.map((option) => (
          <option key={option.value ?? "profiel"} value={option.value ?? ""}>
            {option.kind === "page"
              ? option.label
              : option.label
                ? t("ownProfileNamed", { name: option.label })
                : t("ownProfileMissing")}
          </option>
        ))}
      </select>
    </label>
  );
}
