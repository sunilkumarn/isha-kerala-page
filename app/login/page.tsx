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

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    // Smart Routing based on who is logging in
    const loggedInEmail = data.user?.email;
    
    if (loggedInEmail === "kavitha@ishakerala.com") {
      router.push("/schedule"); // Direct Kavitha to her schedule management page
    } else {
      router.push("/admin/sessions"); // Direct regular admins to the backend management dashboard
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="mb-6 text-2xl font-semibold text-[#1F2A63]">Admin Login</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
          Email
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#1F2A63] focus:outline-none"
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
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#1F2A63] focus:outline-none"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[#1F2A63] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#161e47] disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}