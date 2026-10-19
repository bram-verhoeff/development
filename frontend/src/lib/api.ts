import "server-only";

import { createClient } from "@/lib/supabase/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Fout van de backend; `code` is een vertaalbare foutcode, bijv. "email_not_allowed". */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(`${status} ${code}`);
  }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw new ApiError(0, "backend_unreachable");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (typeof body.detail === "string") throw new ApiError(res.status, body.detail);
    throw new ApiError(res.status, res.status === 422 ? "validation_error" : "unknown_error");
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/** Aanroep namens de ingelogde gebruiker (server-side; het token gaat nooit via de browser naar de API). */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new ApiError(401, "not_authenticated");
  return request<T>(path, init, session.access_token);
}

/** Aanroep zonder login (bijv. de allowlist-check bij registratie). */
export function publicApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  return request<T>(path, init);
}
