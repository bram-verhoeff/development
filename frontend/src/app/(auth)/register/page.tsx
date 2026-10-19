"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

import { register } from "../actions";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const [state, action] = useActionState(register, {});

  if (state.success) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold">{t("register.title")}</h1>
        <Alert tone="success">{t("register.checkEmail")}</Alert>
        <Link href="/login" className="block text-sm text-accent hover:underline">
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <h1 className="text-lg font-semibold">{t("register.title")}</h1>
      <p className="text-sm text-muted">{t("register.inviteOnly")}</p>
      {state.error && <Alert tone="error">{t(`errors.${state.error}`)}</Alert>}
      <Field label={t("email")} name="email" type="email" autoComplete="email" required />
      <Field
        label={t("password")}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint={t("passwordHint")}
        required
      />
      <Field label={t("passwordConfirm")} name="passwordConfirm" type="password" autoComplete="new-password" required />
      <SubmitButton pendingLabel={t("busy")}>{t("register.submit")}</SubmitButton>
      <Link href="/login" className="block text-sm text-accent hover:underline">
        {t("register.toLogin")}
      </Link>
    </form>
  );
}
