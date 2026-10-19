"use client";

import { Building2, CalendarDays, FileText, LayoutDashboard, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { logout } from "@/app/(auth)/actions";
import { Logo } from "@/components/ui/Logo";

// Navigatie-items; de labels komen uit messages/<taal>.json
const items = [
  { href: "/", key: "dashboard", Icon: LayoutDashboard },
  { href: "/generate", key: "generate", Icon: Sparkles },
  { href: "/posts", key: "posts", Icon: FileText },
  { href: "/calendar", key: "calendar", Icon: CalendarDays },
  { href: "/brands", key: "brands", Icon: Building2 },
] as const;

export function Sidebar({ email }: { email: string }) {
  const t = useTranslations();
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="relative flex flex-col overflow-hidden bg-nav text-nav-foreground md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0">
      {/* Zachte gloed in de hoek */}
      <div aria-hidden className="bg-brand-gradient pointer-events-none absolute -top-24 -left-24 h-56 w-56 rounded-full opacity-25 blur-3xl" />

      <div className="relative flex items-center justify-between px-5 py-5">
        <Link href="/" aria-label={t("app.name")}>
          <Logo light />
        </Link>
      </div>

      <nav className="relative flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
        {items.map(({ href, key, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition ${
                active ? "bg-white/10 text-white shadow-inner" : "hover:bg-white/5 hover:text-white"
              }`}
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition ${
                  active ? "bg-brand-gradient text-white shadow-md shadow-black/30" : "bg-white/5 text-nav-foreground group-hover:text-white"
                }`}
              >
                <Icon size={16} />
              </span>
              {t(`nav.${key}`)}
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-auto hidden border-t border-white/10 p-4 md:block">
        <div className="truncate text-xs text-nav-foreground/80" title={email}>
          {email}
        </div>
        <form action={logout} className="mt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-white/5 hover:text-white"
          >
            <LogOut size={15} /> {t("nav.logout")}
          </button>
        </form>
      </div>
      {/* Op telefoon: uitloggen rechtsboven */}
      <form action={logout} className="absolute top-5 right-4 md:hidden">
        <button type="submit" aria-label={t("nav.logout")} className="rounded-lg p-2 hover:bg-white/10">
          <LogOut size={18} />
        </button>
      </form>
    </aside>
  );
}
