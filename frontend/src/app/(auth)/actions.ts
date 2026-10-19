"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError, publicApiFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; success?: boolean };

const MIN_PASSWORD_LENGTH = 8;

// Bekende Supabase-foutcodes; al het andere wordt "unknown"
const knownErrors = new Set([
  "invalid_credentials",
  "email_not_confirmed",
  "user_already_exists",
  "weak_password",
  "over_email_send_rate_limit",
  "over_request_rate_limit",
  "same_password",
]);

const toErrorCode = (code?: string) => (code && knownErrors.has(code) ? code : "unknown");

async function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "http://localhost:3000";
}

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: field(formData, "email"),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: toErrorCode(error.code) };
  redirect("/");
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) return { error: "password_too_short" };
  if (password !== String(formData.get("passwordConfirm") ?? "")) return { error: "passwords_do_not_match" };

  // Alleen genodigden mogen registreren (allowlist in de backend)
  try {
    const { allowed } = await publicApiFetch<{ allowed: boolean }>("/auth/allowed", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    if (!allowed) return { error: "email_not_allowed" };
  } catch (e) {
    return { error: e instanceof ApiError && e.status === 422 ? "invalid_email" : "backend_unreachable" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback` },
  });
  if (error) return { error: toErrorCode(error.code) };
  return { success: true };
}

export async function forgotPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(field(formData, "email"), {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: toErrorCode(error.code) };
  // Altijd succes tonen, zodat niet te achterhalen is welke adressen een account hebben
  return { success: true };
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) return { error: "password_too_short" };
  if (password !== String(formData.get("passwordConfirm") ?? "")) return { error: "passwords_do_not_match" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: toErrorCode(error.code) };
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
