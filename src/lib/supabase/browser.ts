"use client";

import { createClient } from "@supabase/supabase-js";

import { getBrowserEnv } from "@/src/config/env";
import type { Database } from "@/src/types/database";

let browserClient: ReturnType<typeof createClient<Database>> | null = null;

export function getBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const env = getBrowserEnv();

  browserClient = createClient<Database>(
    env.supabaseUrl,
    env.supabasePublishableKey,
    {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storageKey: "banhang-auth",
      },
    },
  );

  return browserClient;
}
