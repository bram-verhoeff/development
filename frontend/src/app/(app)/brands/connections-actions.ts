"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import type { ConnectionKind } from "@/lib/types";

export type ConnectionResult = { error?: string; ok?: boolean };

const errorCode = (e: unknown) => (e instanceof ApiError ? e.code : "unknown_error");

/**
 * Start het koppelen: de browser gaat naar de inlogpagina van het platform.
 * `wizard`: onderdeel van "Alles koppelen"; na terugkomst gaat het volgende platform automatisch verder.
 */
export async function startConnection(brandId: number, platform: ConnectionKind, wizard = false): Promise<ConnectionResult> {
  let url: string;
  try {
    ({ authorization_url: url } = await apiFetch<{ authorization_url: string }>(
      `/brands/${brandId}/connections/${platform}/start${wizard ? "?wizard=true" : ""}`,
      { method: "POST" },
    ));
  } catch (e) {
    return { error: errorCode(e) };
  }
  redirect(url);
}

export async function disconnect(brandId: number, platform: ConnectionKind): Promise<ConnectionResult> {
  try {
    await apiFetch(`/brands/${brandId}/connections/${platform}`, { method: "DELETE" });
  } catch (e) {
    return { error: errorCode(e) };
  }
  revalidatePath(`/brands/${brandId}`);
  return { ok: true };
}

/** Standaardpagina voor nieuwe LinkedIn-posts van dit merk; null = eigen profiel. */
export async function setDefaultPage(brandId: number, pageId: string | null): Promise<ConnectionResult> {
  try {
    await apiFetch(`/brands/${brandId}/connections/linkedin_pages/default`, {
      method: "PUT",
      body: JSON.stringify({ page_id: pageId }),
    });
  } catch (e) {
    return { error: errorCode(e) };
  }
  revalidatePath(`/brands/${brandId}`);
  return { ok: true };
}
