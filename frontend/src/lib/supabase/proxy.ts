import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseKey, supabaseUrl } from "./env";

// Pagina's die zonder login bereikbaar zijn
const publicPaths = ["/login", "/register", "/forgot-password", "/auth", "/privacy"];
// Pagina's waar een ingelogde gebruiker niets te zoeken heeft
const guestOnlyPaths = ["/login", "/register", "/forgot-password"];

const matches = (pathname: string, paths: string[]) =>
  paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/** Ververst de Supabase-sessie en stuurt bezoekers zonder login naar /login. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  // No-cache-headers bij ververste sessiecookies, zodat een CDN nooit een sessie aan een ander serveert
  let cacheHeaders: Record<string, string> = {};

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        cacheHeaders = { ...cacheHeaders, ...headers };
        Object.entries(cacheHeaders).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Controleert het token (en ververst het zo nodig). Geen code tussen createServerClient en deze aanroep.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    // Ververste sessiecookies meenemen in de redirect
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    Object.entries(cacheHeaders).forEach(([key, value]) => redirect.headers.set(key, value));
    return redirect;
  };

  if (!isLoggedIn && !matches(pathname, publicPaths)) return redirectTo("/login");
  if (isLoggedIn && matches(pathname, guestOnlyPaths)) return redirectTo("/");

  return response;
}
