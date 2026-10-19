"use client";

import { CalendarClock, CalendarX, Check, History, RotateCcw, Trash2, Undo2, WandSparkles, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useActionState, useRef, useState, useTransition } from "react";

import {
  deletePost,
  regeneratePost,
  restoreVersion,
  schedulePost,
  setPostStatus,
  type ActionResult,
} from "@/app/(app)/posts/actions";
import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badges";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { buttonClass, cardClass, inputClass } from "@/components/ui/styles";
import { utcIsoToZonedInput, zonedToUtcIso } from "@/lib/time";
import type { PostDetail } from "@/lib/types";

const QUICK_INSTRUCTIONS = ["shorter", "funnier", "newHook", "moreFormal", "addQuestion", "moreEmoji"] as const;

function useErrorText() {
  const t = useTranslations("errors");
  return (code?: string) => (code ? (t.has(code) ? t(code) : t("unknown_error")) : undefined);
}

// Rechterkolom: status, planning, herschrijven, versies en verwijderen
export function PostSidePanel({ post }: { post: PostDetail }) {
  return (
    <div className="space-y-5">
      <StatusCard post={post} />
      <ScheduleCard post={post} />
      <RegenerateCard post={post} />
      <VersionsCard post={post} />
      <DeleteCard post={post} />
    </div>
  );
}

function StatusCard({ post }: { post: PostDetail }) {
  const t = useTranslations("posts");
  const errorText = useErrorText();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult>({});
  const change = (status: PostDetail["status"]) => startTransition(async () => setResult(await setPostStatus(post.id, status)));

  return (
    <section className={`${cardClass} p-5`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("panel.status")}</h2>
        <StatusBadge status={post.status} scheduled={Boolean(post.scheduled_at)} />
      </div>
      {result.error && <div className="mt-3"><Alert tone="error">{errorText(result.error)}</Alert></div>}
      <div className="mt-4 flex flex-wrap gap-2">
        {post.status !== "approved" && (
          <button type="button" disabled={pending} onClick={() => change("approved")} className={`${buttonClass.success} flex-1`}>
            <Check size={16} /> {t("approve")}
          </button>
        )}
        {post.status !== "rejected" && (
          <button type="button" disabled={pending} onClick={() => change("rejected")} className={`${buttonClass.secondary} flex-1`}>
            <X size={16} /> {t("reject")}
          </button>
        )}
        {post.status !== "concept" && (
          <button type="button" disabled={pending} onClick={() => change("concept")} className={buttonClass.ghost}>
            <Undo2 size={16} /> {t("backToConcept")}
          </button>
        )}
      </div>
    </section>
  );
}

function ScheduleCard({ post }: { post: PostDetail }) {
  const t = useTranslations("posts");
  const format = useFormatter();
  const errorText = useErrorText();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const approved = post.status === "approved";

  const save = () => {
    const value = inputRef.current?.value;
    if (!value) return;
    startTransition(async () => setResult(await schedulePost(post.id, zonedToUtcIso(value))));
  };
  const clear = () => startTransition(async () => setResult(await schedulePost(post.id, null)));

  return (
    <section className={`${cardClass} p-5`}>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <CalendarClock size={18} className="text-accent" /> {t("panel.schedule")}
      </h2>
      {!approved ? (
        <p className="mt-2 text-sm text-muted">{t("panel.scheduleNeedsApproval")}</p>
      ) : (
        <>
          {post.scheduled_at && (
            <p className="mt-2 rounded-lg bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
              {format.dateTime(new Date(post.scheduled_at), { dateStyle: "full", timeStyle: "short" })}
            </p>
          )}
          {result.error && <div className="mt-3"><Alert tone="error">{errorText(result.error)}</Alert></div>}
          <label className="mt-3 block">
            <span className="text-sm font-medium">{t("panel.when")}</span>
            <input
              ref={inputRef}
              type="datetime-local"
              key={post.scheduled_at ?? "leeg"}
              defaultValue={post.scheduled_at ? utcIsoToZonedInput(post.scheduled_at) : ""}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-muted">{t("panel.timezoneHint")}</span>
          </label>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={pending} onClick={save} className={`${buttonClass.primary} flex-1`}>
              <CalendarClock size={16} /> {post.scheduled_at ? t("panel.reschedule") : t("panel.plan")}
            </button>
            {post.scheduled_at && (
              <button type="button" disabled={pending} onClick={clear} className={buttonClass.secondary} aria-label={t("panel.unschedule")}>
                <CalendarX size={16} />
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function RegenerateCard({ post }: { post: PostDetail }) {
  const t = useTranslations("posts");
  const errorText = useErrorText();
  const [state, action] = useActionState(regeneratePost.bind(null, post.id), {});
  const [instructions, setInstructions] = useState("");

  const addQuick = (key: (typeof QUICK_INSTRUCTIONS)[number]) => {
    const text = t(`quick.${key}`);
    setInstructions((current) => (current ? `${current.trim()} ${text}` : text));
  };

  return (
    <form action={action} className={`${cardClass} p-5`}>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <WandSparkles size={18} className="text-coral" /> {t("panel.regenerate")}
      </h2>
      <p className="mt-1 text-sm text-muted">{t("panel.regenerateHint")}</p>
      {state.error && <div className="mt-3"><Alert tone="error">{errorText(state.error)}</Alert></div>}
      {state.ok && <div className="mt-3"><Alert tone="success">{t("panel.regenerated")}</Alert></div>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {QUICK_INSTRUCTIONS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => addQuick(key)}
            className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs font-medium hover:border-accent hover:text-accent"
          >
            + {t(`quickLabels.${key}`)}
          </button>
        ))}
      </div>
      <textarea
        name="instructions"
        rows={3}
        maxLength={2000}
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder={t("panel.instructionsPlaceholder")}
        className={inputClass}
      />
      <div className="mt-3">
        <SubmitButton pendingLabel={t("panel.regenerating")} variant="gradient">
          <WandSparkles size={16} /> {t("panel.regenerateButton")}
        </SubmitButton>
      </div>
    </form>
  );
}

function VersionsCard({ post }: { post: PostDetail }) {
  const t = useTranslations("posts");
  const format = useFormatter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const versions = open ? post.versions : post.versions.slice(0, 3);

  return (
    <section className={`${cardClass} p-5`}>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <History size={18} className="text-muted" /> {t("panel.versions")}
      </h2>
      <ol className="mt-3 space-y-3">
        {versions.map((version, index) => (
          <li key={version.id} className="relative border-l-2 border-line pl-4">
            <span className={`absolute top-1.5 -left-[5px] h-2 w-2 rounded-full ${index === 0 ? "bg-accent" : "bg-line"}`} />
            <div className="flex items-center justify-between gap-2 text-xs text-muted">
              <span>
                <strong className="text-foreground">{t(`origin.${version.origin}`)}</strong> ·{" "}
                {format.dateTime(new Date(version.created_at), { dateStyle: "medium", timeStyle: "short" })}
              </span>
              {index > 0 && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(async () => void (await restoreVersion(post.id, version.id)))}
                  className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                >
                  <RotateCcw size={12} /> {t("panel.restore")}
                </button>
              )}
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm">{version.hook}</p>
            {version.instructions && <p className="mt-0.5 text-xs text-muted italic">“{version.instructions}”</p>}
          </li>
        ))}
      </ol>
      {post.versions.length > 3 && (
        <button type="button" onClick={() => setOpen(!open)} className="mt-3 text-sm font-medium text-accent hover:underline">
          {open ? t("panel.showLess") : t("panel.showAll", { count: post.versions.length })}
        </button>
      )}
    </section>
  );
}

function DeleteCard({ post }: { post: PostDetail }) {
  const t = useTranslations("posts");
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(t("panel.deleteConfirm"))) startTransition(() => deletePost(post.id));
      }}
      className={`${buttonClass.danger} w-full`}
    >
      <Trash2 size={16} /> {t("panel.delete")}
    </button>
  );
}
