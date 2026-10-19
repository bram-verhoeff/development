"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { buttonClass } from "./styles";

// Verzendknop die zichzelf uitschakelt (met draaiend icoon) zolang het formulier bezig is
export function SubmitButton({
  children,
  pendingLabel,
  fullWidth = true,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  fullWidth?: boolean;
  variant?: keyof typeof buttonClass;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${buttonClass[variant]} ${fullWidth ? "w-full" : ""}`}>
      {pending && <LoaderCircle size={16} className="animate-spin" />}
      {pending ? pendingLabel : children}
    </button>
  );
}
