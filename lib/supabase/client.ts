import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return dummy client or log warning in development
    return createBrowserClient<any>(
      "https://placeholder-gjtf.supabase.co",
      "placeholder-anon-key"
    );
  }

  return createBrowserClient<any>(supabaseUrl, supabaseAnonKey);
}
