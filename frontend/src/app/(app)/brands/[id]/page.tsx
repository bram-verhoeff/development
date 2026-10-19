import { notFound } from "next/navigation";

import { BrandForm } from "@/components/brands/BrandForm";
import { DeleteBrandButton } from "@/components/brands/DeleteBrandButton";
import { ApiError, apiFetch } from "@/lib/api";
import type { Brand } from "@/lib/types";

export default async function EditBrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ logoError?: string }>;
}) {
  const [{ id }, { logoError }] = await Promise.all([params, searchParams]);

  let brand: Brand;
  try {
    brand = await apiFetch<Brand>(`/brands/${Number(id)}`);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 422)) notFound();
    throw e;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{brand.name}</h1>
        <DeleteBrandButton brandId={brand.id} brandName={brand.name} />
      </div>
      <BrandForm brand={brand} logoError={logoError} />
    </div>
  );
}
