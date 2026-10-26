"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { deletePosts } from "@/app/(app)/posts/actions";
import { buttonClass } from "@/components/ui/styles";
import { useToast } from "@/components/ui/Toast";

export function ClearRejectedButton({ postIds }: { postIds: number[] }) {
  const t = useTranslations("posts");
  const tErrors = useTranslations("errors");
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  if (postIds.length === 0) return null;

  const handleClear = () => {
    if (!confirm(t("clearRejectedConfirm", { count: postIds.length }))) return;
    startTransition(async () => {
      const result = await deletePosts(postIds);
      if (result.error) {
        toast(tErrors.has(result.error) ? tErrors(result.error) : tErrors("unknown_error"), "error");
      } else {
        toast(t("toast.bulkDeleted", { count: postIds.length }), "magic");
      }
    });
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClear}
      className={`${buttonClass.danger} inline-flex items-center gap-1.5 text-xs px-3 py-1.5`}
    >
      <Trash2 size={14} />
      {t("clearRejected")}
    </button>
  );
}
