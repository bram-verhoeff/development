"use client";

import { useFormStatus } from "react-dom";

import { buttonClass } from "./styles";

// Verzendknop die zichzelf uitschakelt zolang het formulier bezig is
export function SubmitButton({
  children,
  pendingLabel,
  fullWidth = true,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  fullWidth?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${buttonClass.primary} ${fullWidth ? "w-full" : ""}`}>
      {pending ? pendingLabel : children}
    </button>
  );
}
