"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/layout/nav";
import { useAuth } from "@/components/auth/auth-context";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="flex flex-1 min-h-full bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_60%,#f8fafc_100%)]">
      <aside className="w-64 border-r border-zinc-200 bg-white/80 backdrop-blur p-4 hidden md:flex md:flex-col md:gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-3 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400 text-zinc-900 font-bold">
            a
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-semibold text-zinc-900">atomberg</div>
            <div className="text-xs text-zinc-500">Goal Portal</div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-2">
          <div className="px-2 pb-2 text-xs font-semibold text-zinc-500">NAVIGATION</div>
          <Nav role={user.role} />
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="text-xs text-zinc-500">Signed in as</div>
          <div className="mt-1 text-sm font-semibold text-zinc-900 truncate">{user.email}</div>
          <div className="mt-1 inline-flex w-fit rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">
            {user.role.toUpperCase()}
          </div>
        </div>

        <div className="flex-1" />

        <button
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          Logout
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white/70 backdrop-blur px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400 text-zinc-900 font-bold md:hidden">
              a
            </div>
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-zinc-900">Goal Setting & Tracking</div>
              <div className="text-xs text-zinc-500">ATOMQUEST</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 shadow-sm">
              <div className="h-6 w-6 rounded-full bg-amber-400" />
              <div className="text-sm text-zinc-700">
                Signed in as <span className="font-semibold text-zinc-900">{user.email}</span>
              </div>
              <div className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">
                {user.role.toUpperCase()}
              </div>
            </div>

            <Link
              href="/settings"
              className="inline-flex rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 max-md:px-2 max-md:text-xs"
            >
              Settings
            </Link>
            <button
              className="inline-flex rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 max-md:px-2 max-md:text-xs"
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              Logout
            </button>

            <button
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 md:hidden"
              onClick={() => router.push("/dashboard")}
            >
              Menu
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
