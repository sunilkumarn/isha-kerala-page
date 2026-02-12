import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for Next.js App Router Server Components.
 *
 * Uses server env vars when available; falls back to NEXT_PUBLIC vars so the
 * app can still run in simple setups.
 */
export function createSupabaseServerClient() {
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "";

  const key =
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  if (!url || !key) {
    // eslint-disable-next-line no-console
    console.warn(
      "Missing Supabase env vars. Set SUPABASE_URL + SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Request-scoped Supabase client that runs as the authenticated user by
 * attaching a JWT access token.
 *
 * This is the right choice for admin API routes when you rely on RLS.
 */
export function createSupabaseServerClientWithAccessToken(accessToken: string) {
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "";

  const key =
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  if (!url || !key) {
    // eslint-disable-next-line no-console
    console.warn(
      "Missing Supabase env vars. Set SUPABASE_URL + SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/**
 * Admin Supabase client that bypasses RLS using the service role key.
 * Use ONLY in trusted server code paths.
 */
export function createSupabaseAdminServerClient() {
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "";

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}


