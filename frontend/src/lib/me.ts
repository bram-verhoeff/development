import "server-only";

import { cache } from "react";

import { ApiError, apiFetch } from "@/lib/api";

export type Me = { id: string; email: string };
export type MeResult = { me: Me; error?: never } | { me?: never; error: string };

/** De ingelogde gebruiker volgens de backend; één aanroep per request (React cache). */
export const getMe = cache(async (): Promise<MeResult> => {
  try {
    return { me: await apiFetch<Me>("/me") };
  } catch (e) {
    return { error: e instanceof ApiError ? e.code : "unknown_error" };
  }
});
