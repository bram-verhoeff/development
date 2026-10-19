import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseKey, supabaseUrl } from "./env";

// Supabase-client voor Server Components, Server Actions en Route Handlers (sessie via cookies)
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Aangeroepen vanuit een Server Component: daar kunnen geen cookies gezet worden.
          // Niet erg, want de proxy ververst de sessie al bij elk request.
        }
      },
    },
  });
}
