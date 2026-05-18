"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => {
    const raw = searchParams.get("next");
    return raw && raw.startsWith("/") ? raw : "/dashboard";
  }, [searchParams]);

  const [email, setEmail] = useState("admin@atomquest.local");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  return (
    <div className="flex flex-1 items-center justify-center bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_60%,#f8fafc_100%)] p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-zinc-900 font-bold">
            a
          </div>
          <div className="flex flex-col">
            <div className="text-lg font-semibold text-zinc-900">atomberg</div>
            <div className="text-xs text-zinc-500">Goal Portal</div>
          </div>
        </div>

        <div className="mt-5 text-xl font-semibold text-zinc-900">Sign in</div>
        <div className="mt-1 text-sm text-zinc-600">
          Default admin: admin@atomquest.local / Admin@123
        </div>

        <form
          className="mt-6 flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            const res = await login(email, password);
            setLoading(false);
            if (!res.ok) {
              setError(res.error);
              return;
            }
            router.replace(nextPath);
          }}
        >
          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-zinc-700">Email</div>
            <input
              className="h-10 rounded-md border border-zinc-200 px-3 text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-zinc-700">Password</div>
            <input
              className="h-10 rounded-md border border-zinc-200 px-3 text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </label>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            className="mt-2 h-10 rounded-md bg-amber-400 text-sm font-semibold text-zinc-900 hover:bg-amber-300 disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
