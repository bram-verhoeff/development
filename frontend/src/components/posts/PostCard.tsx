"use client";

import { CalendarClock, Check, Pencil, Trash2, TriangleAlert, X } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { deletePost, setPostStatus } from "@/app/(app)/posts/actions";
import { Burst } from "@/components/motion/Burst";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { PlatformBadge, StatusBadge } from "@/components/ui/Badges";
import { buttonClass } from "@/components/ui/styles";
import { useToast } from "@/components/ui/Toast";
import type { Post } from "@/lib/types";

// Compacte kaart met snelle goedkeur-/afwijsknoppen
export function PostCard({ post }: { post: Post }) {
  const t = useTranslations("posts");
  const tErrors = useTranslations("errors");
  const format = useFormatter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [burst, setBurst] = useState(0);

  const changeStatus = (status: Post["status"]) => {
    if (status === "approved") setBurst((n) => n + 1);
    startTransition(async () => {
      const result = await setPostStatus(post.id, status);
      if (result.error) toast(tErrors.has(result.error) ? tErrors(result.error) : tErrors("unknown_error"), "error");
      else toast(status === "approved" ? t("toast.approved") : t("toast.rejected"), status === "approved" ? "success" : "magic");
    });
  };

  const handleDelete = () => {
    if (!confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      const result = await deletePost(post.id);
      if (result.error) toast(tErrors.has(result.error) ? tErrors(result.error) : tErrors("unknown_error"), "error");
      else toast(t("toast.deleted"), "magic");
    });
  };

  const overLimit = post.char_count > post.max_chars;

  return (
    <SpotlightCard className={`flex h-full flex-col p-4 ${pending ? "opacity-70" : ""}`}>
      {post.thumbnail_url && (
        <Link href={`/posts/${post.id}`} className="-mx-4 -mt-4 mb-3 block aspect-video overflow-hidden bg-surface-2">
          {post.thumbnail_kind === "video" ? (
            <video src={post.thumbnail_url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- gegenereerd beeld uit Supabase Storage
            <img src={post.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover/spot:scale-105" />
          )}
        </Link>
      )}
      <header className="flex flex-wrap items-center gap-2">
        <PlatformBadge platform={post.platform} />
        {/* key: de badge "popt" bij een statuswissel */}
        <motion.span key={`${post.status}-${Boolean(post.scheduled_at)}-${Boolean(post.published_at)}`} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <StatusBadge status={post.status} scheduled={Boolean(post.scheduled_at)} published={Boolean(post.published_at)} />
        </motion.span>
        <span className="ml-auto truncate text-xs text-muted">{post.brand_name}</span>
      </header>

      <Link href={`/posts/${post.id}`} className="mt-3 block flex-1">
        <p className="leading-snug font-semibold">{post.hook}</p>
        <p className="mt-1.5 line-clamp-4 text-sm whitespace-pre-line text-muted">{post.body}</p>
        {post.hashtags.length > 0 && <p className="mt-2 line-clamp-1 text-xs font-medium text-accent">{post.hashtags.join(" ")}</p>}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className={overLimit ? "font-semibold text-rose-600" : ""}>{t("chars", { count: post.char_count, max: post.max_chars })}</span>
        {post.warnings.length > 0 && (
          <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
            <TriangleAlert size={13} /> {t("warningCount", { count: post.warnings.length })}
          </span>
        )}
        {post.scheduled_at && (
          <span className="inline-flex items-center gap-1 font-medium text-accent">
            <CalendarClock size={13} />
            {format.dateTime(new Date(post.scheduled_at), { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      <footer className="mt-4 flex gap-2 border-t border-line pt-3">
        {post.status !== "approved" && (
          <motion.button
            type="button"
            disabled={pending}
            onClick={() => changeStatus("approved")}
            whileTap={{ scale: 0.92 }}
            className={`${buttonClass.success} relative flex-1 px-3 py-1.5`}
          >
            <Check size={15} /> {t("approve")}
            {burst > 0 && <Burst key={burst} />}
          </motion.button>
        )}
        {post.status !== "rejected" && (
          <motion.button
            type="button"
            disabled={pending}
            onClick={() => changeStatus("rejected")}
            whileTap={{ scale: 0.92 }}
            className={`${buttonClass.secondary} flex-1 px-3 py-1.5`}
          >
            <X size={15} /> {t("reject")}
          </motion.button>
        )}
        <Link href={`/posts/${post.id}`} className={`${buttonClass.ghost} px-2.5 py-1.5`} aria-label={t("open")}>
          <Pencil size={15} />
        </Link>
        <motion.button
          type="button"
          disabled={pending}
          onClick={handleDelete}
          whileTap={{ scale: 0.92 }}
          className={`${buttonClass.ghost} text-muted hover:text-rose-500 hover:bg-rose-500/10 px-2.5 py-1.5 transition-colors`}
          aria-label={t("delete")}
          title={t("delete")}
        >
          <Trash2 size={15} />
        </motion.button>
      </footer>
    </SpotlightCard>
  );
}
