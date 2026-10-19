"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

import { resetPassword } from "../actions";

// Bereikbaar via de herstellink uit de mail (die logt je eerst in via /auth/callback)
export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const [state, action] = useActionState(resetPassword, {});

  return (
    <form action={action} className="space-y-5">
      <h1 className="text-3xl font-bold">{t("reset.title")}</h1>
      {state.error && <Alert tone="error">{t(`errors.${state.error}`)}</Alert>}
      <Field
        label={t("newPassword")}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint={t("passwordHint")}
        required
      />
      <Field label={t("passwordConfirm")} name="passwordConfirm" type="password" autoComplete="new-password" required />
      <SubmitButton pendingLabel={t("busy")} variant="gradient">{t("reset.submit")}</SubmitButton>
    </form>
  );
}
