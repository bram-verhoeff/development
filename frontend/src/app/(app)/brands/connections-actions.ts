"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import type { Platform } from "@/lib/types";

export type ConnectionResult = { error?: string; ok?: boolean };

const errorCode = (e: unknown) => (e instanceof ApiError ? e.code : "unknown_error");

/** Start het koppelen: de browser gaat naar de inlogpagina van het platform. */
export async function startConnection(brandId: number, platform: Platform): Promise<ConnectionResult> {
  let url: string;
  try {
    ({ authorization_url: url } = await apiFetch<{ authorization_url: string }>(
      `/brands/${brandId}/connections/${platform}/start`,
      { method: "POST" },
    ));
  } catch (e) {
    return { error: errorCode(e) };
  }
  redirect(url);
}

export async function disconnect(brandId: number, platform: Platform): Promise<ConnectionResult> {
  try {
    await apiFetch(`/brands/${brandId}/connections/${platform}`, { method: "DELETE" });
  } catch (e) {
    return { error: errorCode(e) };
  }
  revalidatePath(`/brands/${brandId}`);
  return { ok: true };
}
