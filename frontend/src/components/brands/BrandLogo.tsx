import type { Brand } from "@/lib/types";

// Logo van een merk, of de eerste letter in de eerste merkkleur als er geen logo is
export function BrandLogo({ brand, size = 48 }: { brand: Pick<Brand, "name" | "logo_url" | "colors">; size?: number }) {
  if (brand.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- extern logo uit Supabase Storage, klein en al geoptimaliseerd
      <img
        src={brand.logo_url}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-md border border-line bg-white object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-md text-lg font-semibold text-white"
      style={{ width: size, height: size, background: brand.colors[0] ?? "var(--accent)" }}
    >
      {brand.name.charAt(0).toUpperCase()}
    </div>
  );
}
