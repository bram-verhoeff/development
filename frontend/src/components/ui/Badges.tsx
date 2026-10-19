"use client";

import { CircleCheck, CircleDashed, CircleX, Clock, Send } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Platform, PostStatus } from "@/lib/types";

// Herkenbare kleuren en korte tekens per platform (merklogo's zitten niet in onze iconenset)
export const platformStyle: Record<Platform, { mark: string; bg: string; soft: string; text: string }> = {
  instagram: {
    mark: "IG",
    bg: "bg-[linear-gradient(135deg,#f9a33c,#e1306c_55%,#833ab4)]",
    soft: "bg-pink-50 dark:bg-pink-950/40",
    text: "text-pink-700 dark:text-pink-300",
  },
  linkedin: { mark: "in", bg: "bg-[#0a66c2]", soft: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-800 dark:text-sky-300" },
  tiktok: {
    mark: "TT",
    bg: "bg-[#111] shadow-[inset_-2px_-2px_0_#25f4ee,inset_2px_2px_0_#fe2c55]",
    soft: "bg-zinc-100 dark:bg-zinc-800/60",
    text: "text-zinc-800 dark:text-zinc-200",
  },
  x: { mark: "X", bg: "bg-[#0f1419] dark:bg-[#e7e9ea] dark:text-black", soft: "bg-zinc-100 dark:bg-zinc-800/60", text: "text-zinc-800 dark:text-zinc-200" },
  facebook: { mark: "f", bg: "bg-[#1877f2]", soft: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-800 dark:text-blue-300" },
};

export function PlatformIcon({ platform, size = 22 }: { platform: Platform; size?: number }) {
  const style = platformStyle[platform];
  return (
    <span
      aria-hidden
      className={`${style.bg} inline-flex shrink-0 items-center justify-center rounded-md font-bold text-white`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {style.mark}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  const t = useTranslations("platforms");
  const style = platformStyle[platform];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-0.5 text-xs font-semibold ${style.soft} ${style.text}`}>
      <PlatformIcon platform={platform} size={20} />
      {t(platform)}
    </span>
  );
}

const statusStyle: Record<PostStatus | "scheduled" | "published", { className: string; Icon: typeof Clock }> = {
  concept: { className: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900", Icon: CircleDashed },
  approved: { className: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900", Icon: CircleCheck },
  rejected: { className: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900", Icon: CircleX },
  scheduled: { className: "bg-accent-soft text-accent ring-accent/25", Icon: Clock },
  published: { className: "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900", Icon: Send },
};

/** Status van een post; goedgekeurd + datum = "Ingepland", geplaatst = "Gepubliceerd". */
export function StatusBadge({ status, scheduled = false, published = false }: { status: PostStatus; scheduled?: boolean; published?: boolean }) {
  const t = useTranslations("status");
  const key = published ? "published" : status === "approved" && scheduled ? "scheduled" : status;
  const { className, Icon } = statusStyle[key];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${className}`}>
      <Icon size={13} strokeWidth={2.5} />
      {t(key)}
    </span>
  );
}
