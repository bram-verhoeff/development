"use client";

import { CalendarClock, CalendarX, Check, History, RotateCcw, Trash2, Undo2, WandSparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useFormatter, useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

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
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { buttonClass, cardClass, inputClass } from "@/components/ui/styles";
import { useToast } from "@/components/ui/Toast";
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
    <Stagger className="space-y-5" delay={0.1} step={0.07}>
      <StaggerItem>
        <StatusCard post={post} />
      </StaggerItem>
      <StaggerItem>
        <ScheduleCard post={post} />
      </StaggerItem>
      <StaggerItem>
        <RegenerateCard post={post} />
      </StaggerItem>
      <StaggerItem>
        <VersionsCard post={post} />
      </StaggerItem>
      <StaggerItem>
        <DeleteCard post={post} />
      </StaggerItem>
    </Stagger>
  );
}

function StatusCard({ post }: { post: PostDetail }) {
  const t = useTranslations("posts");
  const errorText = useErrorText();
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const [result, setResult] = useState<ActionResult>({});
  const change = (status: PostDetail["status"]) =>
    startTransition(async () => {
      const r = await setPostStatus(post.id, status);
      setResult(r);
      if (r.ok) toast(t(`toast.${status}`), status === "approved" ? "success" : "magic");
    });

  return (
    <section className={`${cardClass} p-5`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("panel.status")}</h2>
        <StatusBadge status={post.status} scheduled={Boolean(post.scheduled_at)} />
      </div>
      {result.error && <div className="mt-3"><Alert tone="error">{errorText(result.error)}</Alert></div>}
      <div className="mt-4 flex flex-wrap gap-2">
        {post.status !== "approved" && (
          <motion.button
            type="button"
            disabled={pending}
            onClick={() => change("approved")}
            whileTap={{ scale: 0.94 }}
            className={`${buttonClass.success} flex-1`}
          >
            <Check size={16} /> {t("approve")}
          </motion.button>
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

  const toast = useToast();
  const save = () => {
    const value = inputRef.current?.value;
    if (!value) return;
    startTransition(async () => {
      const r = await schedulePost(post.id, zonedToUtcIso(value));
      setResult(r);
      if (r.ok) toast(t("toast.scheduled"));
    });
  };
  const clear = () =>
    startTransition(async () => {
      const r = await schedulePost(post.id, null);
      setResult(r);
      if (r.ok) toast(t("toast.unscheduled"), "magic");
    });

  return (
    <section className={`${cardClass} p-5`}>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <CalendarClock size={18} className="text-accent" /> {t("panel.schedule")}
      </h2>
      {!approved ? (
        <p className="mt-2 text-sm text-muted">{t("panel.scheduleNeedsApproval")}</p>
      ) : (
        <>
          <AnimatePresence initial={false}>
            {post.scheduled_at && (
              <motion.p
                key={post.scheduled_at}
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden rounded-lg bg-accent-soft px-3 py-2 text-sm font-medium text-accent"
              >
                {format.dateTime(new Date(post.scheduled_at), { dateStyle: "full", timeStyle: "short" })}
              </motion.p>
            )}
          </AnimatePresence>
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
  const toast = useToast();
  const [state, setState] = useState<ActionResult>({});
  const [instructions, setInstructions] = useState("");

  // Async form-actie: useFormStatus (in SubmitButton) ziet zo dat hij bezig is
  const action = async (formData: FormData) => {
    const result = await regeneratePost(post.id, {}, formData);
    setState(result);
    if (result.ok) {
      toast(t("toast.regenerated"), "magic");
      setInstructions("");
    }
  };

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
      <div className="mt-3 flex flex-wrap gap-1.5">
        {QUICK_INSTRUCTIONS.map((key) => (
          <motion.button
            key={key}
            type="button"
            onClick={() => addQuick(key)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.92 }}
            className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs font-medium transition-colors hover:border-accent hover:text-accent"
          >
            + {t(`quickLabels.${key}`)}
          </motion.button>
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
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const versions = open ? post.versions : post.versions.slice(0, 3);
  const restore = (versionId: number) =>
    startTransition(async () => {
      const r = await restoreVersion(post.id, versionId);
      if (r.ok) toast(t("toast.restored"), "magic");
    });

  return (
    <section className={`${cardClass} p-5`}>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <History size={18} className="text-muted" /> {t("panel.versions")}
      </h2>
      <ol className="mt-3 space-y-3">
        <AnimatePresence initial={false}>
          {versions.map((version, index) => (
          <motion.li
            key={version.id}
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="relative border-l-2 border-line pl-4"
          >
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
                  onClick={() => restore(version.id)}
                  className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                >
                  <RotateCcw size={12} /> {t("panel.restore")}
                </button>
              )}
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm">{version.hook}</p>
            {version.instructions && <p className="mt-0.5 text-xs text-muted italic">“{version.instructions}”</p>}
          </motion.li>
          ))}
        </AnimatePresence>
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
