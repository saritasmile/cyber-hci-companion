import { createClient } from "@supabase/supabase-js";

// Fallbacks prevent build-time crashes when env vars aren't set locally.
// NEXT_PUBLIC_ vars are baked in at build time and will be correct in production.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
