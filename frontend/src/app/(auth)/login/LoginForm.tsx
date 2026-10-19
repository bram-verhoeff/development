"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

import { login } from "../actions";

export function LoginForm({ initialError }: { initialError?: string }) {
  const t = useTranslations("auth");
  const [state, action] = useActionState(login, { error: initialError });

  return (
    <form action={action} className="space-y-4">
      <h1 className="text-lg font-semibold">{t("login.title")}</h1>
      {state.error && <Alert tone="error">{t(`errors.${state.error}`)}</Alert>}
      <Field label={t("email")} name="email" type="email" autoComplete="email" required />
      <Field label={t("password")} name="password" type="password" autoComplete="current-password" required />
      <SubmitButton pendingLabel={t("busy")}>{t("login.submit")}</SubmitButton>
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-accent hover:underline">
          {t("login.forgot")}
        </Link>
        <Link href="/register" className="text-accent hover:underline">
          {t("login.toRegister")}
        </Link>
      </div>
    </form>
  );
}
