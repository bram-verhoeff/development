"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import type { PostDetail, PostMedia, PostStatus } from "@/lib/types";

export type ActionResult = { error?: string; ok?: boolean };

const errorCode = (e: unknown) => (e instanceof ApiError ? e.code : "unknown_error");

// Na elke wijziging de pagina's met posts verversen
function refresh(postId?: number) {
  revalidatePath("/posts");
  revalidatePath("/calendar");
  revalidatePath("/");
  if (postId) revalidatePath(`/posts/${postId}`);
}

async function run(postId: number, request: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await request();
  } catch (e) {
    return { error: errorCode(e) };
  }
  refresh(postId);
  return { ok: true };
}

export async function setPostStatus(postId: number, status: PostStatus): Promise<ActionResult> {
  return run(postId, () =>
    apiFetch<PostDetail>(`/posts/${postId}/status`, { method: "POST", body: JSON.stringify({ status }) }),
  );
}

export async function updatePost(postId: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const hashtags = String(formData.get("hashtags") ?? "")
    .split(/[\s,]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
  return run(postId, () =>
    apiFetch(`/posts/${postId}`, {
      method: "PATCH",
      body: JSON.stringify({
        hook: String(formData.get("hook") ?? ""),
        body: String(formData.get("body") ?? ""),
        hashtags,
      }),
    }),
  );
}

export async function regeneratePost(postId: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return run(postId, () =>
    apiFetch(`/posts/${postId}/regenerate`, {
      method: "POST",
      body: JSON.stringify({ instructions: String(formData.get("instructions") ?? "") }),
    }),
  );
}

/** `scheduledAt` is een ISO-string in UTC, of null om uit de kalender te halen. */
export async function schedulePost(postId: number, scheduledAt: string | null): Promise<ActionResult> {
  return run(postId, () =>
    apiFetch(`/posts/${postId}/schedule`, { method: "PUT", body: JSON.stringify({ scheduled_at: scheduledAt }) }),
  );
}

export async function restoreVersion(postId: number, versionId: number): Promise<ActionResult> {
  return run(postId, () => apiFetch(`/posts/${postId}/versions/${versionId}/restore`, { method: "POST" }));
}

export async function deletePost(postId: number, redirectAfter = false): Promise<ActionResult> {
  try {
    await apiFetch(`/posts/${postId}`, { method: "DELETE" });
  } catch (e) {
    return { error: errorCode(e) };
  }
  refresh();
  if (redirectAfter) {
    redirect("/posts");
  }
  return { ok: true };
}

export async function deletePosts(postIds: number[]): Promise<ActionResult> {
  try {
    await apiFetch("/posts/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ post_ids: postIds }),
    });
  } catch (e) {
    return { error: errorCode(e) };
  }
  refresh();
  return { ok: true };
}

/** Plaatst de post nu meteen op het gekoppelde account. */
export async function publishPost(postId: number): Promise<ActionResult> {
  return run(postId, () => apiFetch(`/posts/${postId}/publish`, { method: "POST" }));
}

/** LinkedIn: plaatsen op je eigen profiel (null) of op een gekoppelde bedrijfspagina. */
export async function setPublishAs(postId: number, publishAs: string | null): Promise<ActionResult> {
  return run(postId, () =>
    apiFetch(`/posts/${postId}/publish-as`, { method: "PUT", body: JSON.stringify({ publish_as: publishAs }) }),
  );
}

export type MediaResult = { error?: string; media?: PostMedia };

/** Afbeelding (direct klaar) of video (wordt op de achtergrond gemaakt) laten genereren. */
export async function generateMedia(postId: number, kind: PostMedia["kind"], instructions: string): Promise<MediaResult> {
  try {
    const media = await apiFetch<PostMedia>(`/posts/${postId}/media`, {
      method: "POST",
      body: JSON.stringify({ kind, instructions }),
    });
    refresh(postId);
    return { media };
  } catch (e) {
    return { error: errorCode(e) };
  }
}

/** Status van een video die nog gemaakt wordt; ververst de pagina zodra hij klaar of mislukt is. */
export async function checkMedia(postId: number, mediaId: number): Promise<MediaResult> {
  try {
    const media = await apiFetch<PostMedia>(`/posts/${postId}/media/${mediaId}`);
    if (media.status !== "pending") refresh(postId);
    return { media };
  } catch (e) {
    return { error: errorCode(e) };
  }
}

export async function deleteMedia(postId: number, mediaId: number): Promise<ActionResult> {
  return run(postId, () => apiFetch(`/posts/${postId}/media/${mediaId}`, { method: "DELETE" }));
}
