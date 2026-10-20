"use client";

import { Clapperboard, Download, ImagePlus, LoaderCircle, Trash2, TriangleAlert, Wand2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

import { checkMedia, deleteMedia, generateMedia } from "@/app/(app)/posts/actions";
import { buttonClass, cardClass, inputClass } from "@/components/ui/styles";
import { useToast } from "@/components/ui/Toast";
import type { PostDetail, PostMedia } from "@/lib/types";

// Hoe vaak we vragen of een video al klaar is (Veo doet er meestal 1 à 3 minuten over)
const POLL_MS = 6000;

const QUICK = ["photo", "illustration", "flatlay", "people"] as const;

/** "4:5" → CSS aspect-ratio "4 / 5" */
const cssRatio = (ratio: string) => ratio.replace(":", " / ");

function MediaTile({ postId, media }: { postId: number; media: PostMedia }) {
  const t = useTranslations("media");
  const tErrors = useTranslations("errors");
  const toast = useToast();
  const [deleting, startDelete] = useTransition();

  // Video in de maak: zelf periodiek de status opvragen
  useEffect(() => {
    if (media.status !== "pending") return;
    const timer = setInterval(async () => {
      const result = await checkMedia(postId, media.id);
      if (result.media?.status === "ready") toast(t("videoReady"), "magic");
      if (result.media?.status === "failed") toast(t("videoFailed"), "error");
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [media.status, media.id, postId, t, toast]);

  const remove = () => {
    if (!confirm(t("deleteConfirm"))) return;
    startDelete(async () => {
      const result = await deleteMedia(postId, media.id);
      if (result.error) toast(tErrors.has(result.error) ? tErrors(result.error) : tErrors("unknown_error"), "error");
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: deleting ? 0.4 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative overflow-hidden rounded-xl border border-line bg-surface-2"
      style={{ aspectRatio: cssRatio(media.aspect_ratio) }}
    >
      {media.status === "ready" && media.url ? (
        media.kind === "video" ? (
          <video src={media.url} controls playsInline loop className="h-full w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- gegenereerd beeld uit Supabase Storage
          <img src={media.url} alt={t("altImage")} className="h-full w-full object-cover" />
        )
      ) : media.status === "pending" ? (
        <div className="relative flex h-full flex-col items-center justify-center gap-2 overflow-hidden p-3 text-center">
          <motion.div
            aria-hidden
            className="bg-brand-gradient absolute inset-0 opacity-20"
            animate={{ opacity: [0.12, 0.3, 0.12] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          />
          <Clapperboard size={26} className="relative text-accent" />
          <p className="relative text-xs font-semibold">{t("videoBusy")}</p>
          <p className="relative text-[11px] text-muted">{t("videoBusyHint")}</p>
          <LoaderCircle size={16} className="relative animate-spin text-accent" />
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-rose-600">
          <TriangleAlert size={22} />
          <p className="text-xs">{media.error && tErrors.has(media.error) ? tErrors(media.error) : t("failed")}</p>
        </div>
      )}

      {/* Acties bij hover (en altijd op touch) */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        {media.status === "ready" && media.url && (
          <a
            href={media.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("download")}
            className="rounded-lg bg-black/60 p-1.5 text-white backdrop-blur hover:bg-black/80"
          >
            <Download size={15} />
          </a>
        )}
        <button type="button" onClick={remove} aria-label={t("delete")} className="rounded-lg bg-black/60 p-1.5 text-white backdrop-blur hover:bg-black/80">
          <Trash2 size={15} />
        </button>
      </div>
      {media.instructions && (
        <p className="absolute right-0 bottom-0 left-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pt-4 pb-1.5 text-[11px] text-white">
          “{media.instructions}”
        </p>
      )}
    </motion.div>
  );
}

// Afbeeldingen en video's bij een post laten maken
export function MediaPanel({ post }: { post: PostDetail }) {
  const t = useTranslations("media");
  const tErrors = useTranslations("errors");
  const toast = useToast();
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState<PostMedia["kind"] | null>(null);
  const [, startTransition] = useTransition();

  const create = (kind: PostMedia["kind"]) => {
    if (kind === "video" && !confirm(t("videoConfirm"))) return;
    setBusy(kind);
    startTransition(async () => {
      const result = await generateMedia(post.id, kind, instructions);
      setBusy(null);
      if (result.error) toast(tErrors.has(result.error) ? tErrors(result.error) : tErrors("unknown_error"), "error");
      else toast(kind === "image" ? t("imageReady") : t("videoStarted"), "magic");
    });
  };

  return (
    <section className={`${cardClass} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-coral-soft text-coral">
              <Wand2 size={16} />
            </span>
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("description")}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {QUICK.map((key) => (
          <motion.button
            key={key}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setInstructions((current) => (current ? `${current.trim()} ${t(`quick.${key}`)}` : t(`quick.${key}`)))}
            className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs font-medium transition-colors hover:border-accent hover:text-accent"
          >
            + {t(`quickLabels.${key}`)}
          </motion.button>
        ))}
      </div>
      <input
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        maxLength={1000}
        placeholder={t("placeholder")}
        className={inputClass}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <motion.button type="button" disabled={busy !== null} onClick={() => create("image")} whileTap={{ scale: 0.96 }} className={buttonClass.gradient}>
          {busy === "image" ? <LoaderCircle size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          {busy === "image" ? t("imageBusy") : t("image")}
        </motion.button>
        <motion.button type="button" disabled={busy !== null} onClick={() => create("video")} whileTap={{ scale: 0.96 }} className={buttonClass.secondary}>
          {busy === "video" ? <LoaderCircle size={16} className="animate-spin" /> : <Clapperboard size={16} />}
          {t("video")}
        </motion.button>
      </div>

      {post.media.length > 0 && (
        <motion.div layout className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AnimatePresence initial={false}>
            {post.media.map((media) => (
              <MediaTile key={media.id} postId={post.id} media={media} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}
