"use client";

import { Save, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { updatePost } from "@/app/(app)/posts/actions";
import { Alert } from "@/components/ui/Alert";
import { PlatformIcon } from "@/components/ui/Badges";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cardClass, inputClass } from "@/components/ui/styles";
import type { PostDetail } from "@/lib/types";

const joinTags = (tags: string[]) => tags.join(" ");
const parseTags = (value: string) =>
  value
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

// Tekst bewerken met live teller en een voorbeeld zoals de post er ongeveer uit gaat zien
export function PostEditor({ post }: { post: PostDetail }) {
  const t = useTranslations("posts");
  const tErrors = useTranslations("errors");
  const [state, action] = useActionState(updatePost.bind(null, post.id), {});
  const [hook, setHook] = useState(post.hook);
  const [body, setBody] = useState(post.body);
  const [tags, setTags] = useState(joinTags(post.hashtags));

  const hashtags = parseTags(tags);
  const length = [hook.trim(), body.trim(), hashtags.join(" ")].filter(Boolean).join("\n\n").length;
  const ratio = Math.min(length / post.max_chars, 1);
  const over = length > post.max_chars;
  const dirty = hook !== post.hook || body !== post.body || joinTags(hashtags) !== joinTags(post.hashtags);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
      <form action={action} className={`${cardClass} space-y-4 p-5`}>
        <h2 className="text-lg font-semibold">{t("editor.title")}</h2>
        {state.error && <Alert tone="error">{tErrors.has(state.error) ? tErrors(state.error) : tErrors("unknown_error")}</Alert>}
        {state.ok && !dirty && <Alert tone="success">{t("editor.saved")}</Alert>}

        <label className="block">
          <span className="text-sm font-medium">{t("editor.hook")}</span>
          <textarea name="hook" rows={2} value={hook} onChange={(e) => setHook(e.target.value)} className={`${inputClass} font-semibold`} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("editor.body")}</span>
          <textarea name="body" rows={10} value={body} onChange={(e) => setBody(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("editor.hashtags")}</span>
          <input name="hashtags" value={tags} onChange={(e) => setTags(e.target.value)} className={`${inputClass} font-mono text-accent`} />
          <span className="mt-1 block text-xs text-muted">{t("editor.hashtagsHint")}</span>
        </label>

        <div>
          <div className="flex justify-between text-xs">
            <span className={over ? "font-semibold text-rose-600" : "text-muted"}>{t("chars", { count: length, max: post.max_chars })}</span>
            {over && <span className="font-semibold text-rose-600">{t("editor.tooLong")}</span>}
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className={`h-full rounded-full transition-all ${over ? "bg-rose-500" : ratio > 0.85 ? "bg-amber-500" : "bg-brand-gradient"}`}
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
        </div>

        {post.warnings.length > 0 && !dirty && (
          <ul className="space-y-1 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {post.warnings.map((w) => (
              <li key={w.code} className="flex gap-2">
                <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                {t(`warnings.${w.code}`, { max: w.max ?? 0, count: w.count ?? 0, terms: (w.terms ?? []).join(", ") })}
              </li>
            ))}
          </ul>
        )}

        <SubmitButton pendingLabel={t("editor.saving")} fullWidth={false}>
          <Save size={16} /> {t("editor.save")}
        </SubmitButton>
      </form>

      {/* Voorbeeldweergave */}
      <div className="xl:sticky xl:top-6 xl:self-start">
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{t("editor.preview")}</p>
        <div className={`${cardClass} overflow-hidden`}>
          <div className="flex items-center gap-3 border-b border-line p-4">
            <span className="bg-brand-gradient inline-flex h-10 w-10 items-center justify-center rounded-full font-bold text-white">
              {post.brand_name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{post.brand_name}</div>
              <div className="text-xs text-muted">{t("editor.previewMeta")}</div>
            </div>
            <PlatformIcon platform={post.platform} size={26} />
          </div>
          <div className="space-y-3 p-4 text-[15px] leading-relaxed">
            <p className="font-semibold whitespace-pre-line">{hook}</p>
            <p className="whitespace-pre-line">{body}</p>
            {hashtags.length > 0 && <p className="font-medium text-accent">{hashtags.join(" ")}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
