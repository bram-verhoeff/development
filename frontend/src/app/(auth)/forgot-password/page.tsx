"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

import { forgotPassword } from "../actions";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [state, action] = useActionState(forgotPassword, {});

  return (
    <form action={action} className="space-y-4">
      <h1 className="text-lg font-semibold">{t("forgot.title")}</h1>
      {state.success ? (
        <Alert tone="success">{t("forgot.sent")}</Alert>
      ) : (
        <>
          <p className="text-sm text-muted">{t("forgot.intro")}</p>
          {state.error && <Alert tone="error">{t(`errors.${state.error}`)}</Alert>}
          <Field label={t("email")} name="email" type="email" autoComplete="email" required />
          <SubmitButton pendingLabel={t("busy")}>{t("forgot.submit")}</SubmitButton>
        </>
      )}
      <Link href="/login" className="block text-sm text-accent hover:underline">
        {t("backToLogin")}
      </Link>
    </form>
  );
}
