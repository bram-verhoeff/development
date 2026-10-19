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
    <form action={action} className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">{t("login.title")}</h1>
        <p className="mt-1 text-muted">{t("login.subtitle")}</p>
      </div>
      {state.error && <Alert tone="error">{t(`errors.${state.error}`)}</Alert>}
      <Field label={t("email")} name="email" type="email" autoComplete="email" required />
      <Field label={t("password")} name="password" type="password" autoComplete="current-password" required />
      <div className="flex justify-end text-sm">
        <Link href="/forgot-password" className="font-medium text-accent hover:underline">
          {t("login.forgot")}
        </Link>
      </div>
      <SubmitButton pendingLabel={t("busy")} variant="gradient">
        {t("login.submit")}
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        {t("login.noAccount")}{" "}
        <Link href="/register" className="font-medium text-accent hover:underline">
          {t("login.toRegister")}
        </Link>
      </p>
    </form>
  );
}
