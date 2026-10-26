"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";

export type GenerateState = { error?: string };

export const maxDuration = 60;

/** Laat Claude posts schrijven en stuurt door naar het overzicht van deze nieuwe posts. */
export async function generatePosts(_prev: GenerateState, formData: FormData): Promise<GenerateState> {
  const sourceType = String(formData.get("source_type") ?? "none");
  const payload = {
    brand_id: Number(formData.get("brand_id")),
    platforms: formData.getAll("platforms").map(String),
    posts_per_platform: Number(formData.get("posts_per_platform") ?? 3),
    source_type: sourceType,
    source_url: sourceType === "url" ? String(formData.get("source_url") ?? "").trim() || null : null,
    source_text: sourceType === "text" ? String(formData.get("source_text") ?? "").trim() || null : null,
    instructions: String(formData.get("instructions") ?? "").trim() || null,
  };
  if (!payload.brand_id) return { error: "choose_brand" };
  if (payload.platforms.length === 0) return { error: "choose_platform" };

  let runId: number;
  try {
    ({ run_id: runId } = await apiFetch<{ run_id: number }>("/generate", { method: "POST", body: JSON.stringify(payload) }));
  } catch (e) {
    return { error: e instanceof ApiError ? e.code : "unknown_error" };
  }

  revalidatePath("/posts");
  revalidatePath("/");
  redirect(`/posts?run=${runId}`);
}
