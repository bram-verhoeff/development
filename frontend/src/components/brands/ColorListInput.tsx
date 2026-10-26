"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { buttonClass, inputClass } from "@/components/ui/styles";

const HEX = /^#[0-9a-fA-F]{6}$/;

// Lijst van merkkleuren: kleurkiezer + hexcode per rij; verstuurd als meerdere "colors"-velden
export function ColorListInput({ initial }: { initial: string[] }) {
  const t = useTranslations("brands.form");
  const [colors, setColors] = useState<string[]>(initial);

  const update = (index: number, value: string) => setColors((list) => list.map((c, i) => (i === index ? value : c)));

  return (
    <fieldset>
      <legend className="text-sm font-medium">{t("colors")}</legend>
      <div className="mt-1 space-y-2">
        {colors.map((color, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="color"
              aria-label={t("colorPicker")}
              value={HEX.test(color) ? color : "#000000"}
              onChange={(e) => update(index, e.target.value.toUpperCase())}
              className="h-9 w-11 shrink-0 cursor-pointer rounded border border-line bg-surface p-1"
            />
            <input
              name="colors"
              value={color}
              onChange={(e) => update(index, e.target.value)}
              pattern="#[0-9a-fA-F]{6}"
              title={t("colorFormat")}
              required
              className={`${inputClass} mt-0 font-mono`}
            />
            <button
              type="button"
              onClick={() => setColors((list) => list.filter((_, i) => i !== index))}
              className="shrink-0 rounded-md px-2 py-2 text-sm text-muted hover:text-foreground"
              aria-label={t("removeColor")}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {colors.length < 10 && (
        <button type="button" onClick={() => setColors((list) => [...list, "#0F7F75"])} className={`${buttonClass.secondary} mt-2`}>
          {t("addColor")}
        </button>
      )}
    </fieldset>
  );
}
