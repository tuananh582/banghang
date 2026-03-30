"use client";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { mapAuthErrorMessage } from "@/src/lib/errors/mapSupabaseError";
import { getBrowserSupabaseClient } from "@/src/lib/supabase/browser";

export async function getCurrentSession() {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(mapAuthErrorMessage(error.message));
  }

  return data.session;
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(mapAuthErrorMessage(error.message));
  }

  return data.session;
}

export async function signOutCurrentUser() {
  const supabase = getBrowserSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(mapAuthErrorMessage(error.message));
  }
}

export function subscribeToAuthChanges(
  listener: (event: AuthChangeEvent, session: Session | null) => void,
) {
  const supabase = getBrowserSupabaseClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(listener);

  return subscription;
}
