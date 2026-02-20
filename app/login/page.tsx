"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Minimal cookie for middleware protection. Replace with httpOnly cookies
    // if you add server-side auth helpers in the future.
    if (data.session?.access_token) {
      document.cookie = `sb-access-token=${data.session.access_token}; Path=/; SameSite=Lax`;
    }

    setLoading(false);
    router.push("/admin/sessions");
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Admin Login</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
          Email
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
          Password
          <input
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}

