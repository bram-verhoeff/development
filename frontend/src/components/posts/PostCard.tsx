"use client";

import { CalendarClock, Check, Pencil, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { setPostStatus } from "@/app/(app)/posts/actions";
import { PlatformBadge, StatusBadge } from "@/components/ui/Badges";
import { buttonClass, cardClass } from "@/components/ui/styles";
import type { Post } from "@/lib/types";

// Compacte kaart met snelle goedkeur-/afwijsknoppen
export function PostCard({ post }: { post: Post }) {
  const t = useTranslations("posts");
  const tErrors = useTranslations("errors");
  const format = useFormatter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const changeStatus = (status: Post["status"]) =>
    startTransition(async () => {
      const result = await setPostStatus(post.id, status);
      setError(result.error);
    });

  const overLimit = post.char_count > post.max_chars;

  return (
    <article className={`${cardClass} flex flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${pending ? "opacity-60" : ""}`}>
      <header className="flex flex-wrap items-center gap-2">
        <PlatformBadge platform={post.platform} />
        <StatusBadge status={post.status} scheduled={Boolean(post.scheduled_at)} />
        <span className="ml-auto truncate text-xs text-muted">{post.brand_name}</span>
      </header>

      <Link href={`/posts/${post.id}`} className="mt-3 block flex-1">
        <p className="font-semibold leading-snug">{post.hook}</p>
        <p className="mt-1.5 line-clamp-4 text-sm whitespace-pre-line text-muted">{post.body}</p>
        {post.hashtags.length > 0 && (
          <p className="mt-2 line-clamp-1 text-xs font-medium text-accent">{post.hashtags.join(" ")}</p>
        )}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className={overLimit ? "font-semibold text-rose-600" : ""}>
          {t("chars", { count: post.char_count, max: post.max_chars })}
        </span>
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

      {error && <p className="mt-2 text-xs text-rose-600">{tErrors.has(error) ? tErrors(error) : tErrors("unknown_error")}</p>}

      <footer className="mt-4 flex gap-2 border-t border-line pt-3">
        {post.status !== "approved" && (
          <button type="button" disabled={pending} onClick={() => changeStatus("approved")} className={`${buttonClass.success} flex-1 px-3 py-1.5`}>
            <Check size={15} /> {t("approve")}
          </button>
        )}
        {post.status !== "rejected" && (
          <button type="button" disabled={pending} onClick={() => changeStatus("rejected")} className={`${buttonClass.secondary} flex-1 px-3 py-1.5`}>
            <X size={15} /> {t("reject")}
          </button>
        )}
        <Link href={`/posts/${post.id}`} className={`${buttonClass.ghost} px-3 py-1.5`} aria-label={t("open")}>
          <Pencil size={15} />
        </Link>
      </footer>
    </article>
  );
}
