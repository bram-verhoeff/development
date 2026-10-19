"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import type { Brand } from "@/lib/types";

export type BrandFormState = { error?: string };

const errorCode = (e: unknown) => (e instanceof ApiError ? e.code : "unknown_error");

// Tekstvak met één item per regel → lijst
const lines = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

function toPayload(formData: FormData) {
  const website = String(formData.get("website_url") ?? "").trim();
  return {
    name: String(formData.get("name") ?? ""),
    website_url: website || null,
    target_audience: String(formData.get("target_audience") ?? ""),
    tone_of_voice: String(formData.get("tone_of_voice") ?? ""),
    usps: lines(formData.get("usps")),
    colors: formData.getAll("colors").map(String),
    avoid_terms: lines(formData.get("avoid_terms")),
    content_language: String(formData.get("content_language") ?? "nl"),
  };
}

/** Maakt een merk aan (brandId null) of werkt het bij, en verwerkt daarna het logo. */
export async function saveBrand(brandId: number | null, _prev: BrandFormState, formData: FormData): Promise<BrandFormState> {
  let brand: Brand;
  try {
    brand = await apiFetch<Brand>(brandId ? `/brands/${brandId}` : "/brands", {
      method: brandId ? "PUT" : "POST",
      body: JSON.stringify(toPayload(formData)),
    });
  } catch (e) {
    return { error: errorCode(e) };
  }

  const logo = formData.get("logo");
  try {
    if (logo instanceof File && logo.size > 0) {
      const upload = new FormData();
      upload.append("file", logo);
      await apiFetch(`/brands/${brand.id}/logo`, { method: "POST", body: upload });
    } else if (formData.get("remove_logo") === "on") {
      await apiFetch(`/brands/${brand.id}/logo`, { method: "DELETE" });
    }
  } catch (e) {
    // Het merk is wél opgeslagen; terug naar de bewerkpagina met de logofout
    revalidatePath("/brands");
    redirect(`/brands/${brand.id}?logoError=${errorCode(e)}`);
  }

  revalidatePath("/brands");
  redirect("/brands");
}

export async function deleteBrand(brandId: number) {
  await apiFetch(`/brands/${brandId}`, { method: "DELETE" });
  revalidatePath("/brands");
  redirect("/brands");
}
