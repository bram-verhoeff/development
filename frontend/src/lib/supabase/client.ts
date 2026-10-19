import { createBrowserClient } from "@supabase/ssr";

import { supabaseKey, supabaseUrl } from "./env";

// Supabase-client voor Client Components
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}
