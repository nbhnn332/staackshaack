import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

/**
 * Returns a lazily-initialized Supabase client.
 * This avoids crashing at build time when env vars are placeholders.
 */
function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your_supabase")) {
    console.warn(
      "⚠️ Supabase credentials not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
    );
    // Return a dummy client that will fail gracefully on queries
    // This allows the build to succeed even without credentials
    _supabase = createClient("https://placeholder.supabase.co", "placeholder-key");
    return _supabase;
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}

// Export as a getter so it's lazily initialized
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdminClient(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("=== ADMIN CLIENT DEBUG ===");
  console.log("Service key loaded:", !!supabaseServiceKey);
  console.log("Starts with:", supabaseServiceKey?.substring(0, 20));
  console.log("==========================");

  if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes("your_supabase")) {
    console.error("⚠️ SUPABASE_SERVICE_ROLE_KEY not configured or Supabase URL invalid. Admin operations require a service role key.");
    throw new Error("Supabase admin client initialization failed due to missing service role key.");
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  return _supabaseAdmin;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdminClient();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
