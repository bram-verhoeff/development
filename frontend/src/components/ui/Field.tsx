import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { inputClass } from "./styles";

type Labelled = { label: string; hint?: string };

function Label({ htmlFor, label, hint, children }: Labelled & { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

// Label + invoerveld in de standaardstijl
export function Field({ label, hint, id, ...props }: Labelled & InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id ?? props.name;
  return (
    <Label htmlFor={inputId} label={label} hint={hint}>
      <input id={inputId} className={inputClass} {...props} />
    </Label>
  );
}

export function TextArea({ label, hint, id, ...props }: Labelled & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const inputId = id ?? props.name;
  return (
    <Label htmlFor={inputId} label={label} hint={hint}>
      <textarea id={inputId} rows={3} className={inputClass} {...props} />
    </Label>
  );
}

export function Select({ label, hint, id, children, ...props }: Labelled & SelectHTMLAttributes<HTMLSelectElement>) {
  const inputId = id ?? props.name;
  return (
    <Label htmlFor={inputId} label={label} hint={hint}>
      <select id={inputId} className={inputClass} {...props}>
        {children}
      </select>
    </Label>
  );
}
