"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { logout } from "@/app/(auth)/actions";

// Navigatie-items; de labels komen uit messages/<taal>.json
const items = [
  { href: "/", key: "dashboard" },
  { href: "/brands", key: "brands" },
  { href: "/generate", key: "generate" },
  { href: "/posts", key: "posts" },
  { href: "/calendar", key: "calendar" },
] as const;

export function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="flex flex-col border-b border-line bg-surface md:w-56 md:shrink-0 md:border-b-0 md:border-r">
      <div className="px-4 py-4 text-lg font-semibold tracking-tight">{t("app.name")}</div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:pb-0">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-accent-soft text-accent"
                : "text-muted hover:bg-background hover:text-foreground"
            }`}
          >
            {t(`nav.${item.key}`)}
          </Link>
        ))}
      </nav>
      <form action={logout} className="px-2 pb-3 md:mt-auto md:pb-4">
        <button
          type="submit"
          className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-muted hover:bg-background hover:text-foreground"
        >
          {t("nav.logout")}
        </button>
      </form>
    </aside>
  );
}
