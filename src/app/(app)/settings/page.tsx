"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import { changeMyPassword } from "@/lib/auth";
import { clearState } from "@/lib/storage";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  useAppState();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-zinc-900 font-bold">
              a
            </div>
            <div className="flex flex-col">
              <div className="text-lg font-semibold text-zinc-900">Settings</div>
              <div className="text-sm text-zinc-600">{user.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              onClick={() => router.push("/dashboard")}
            >
              Back
            </button>
            <button
              className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-zinc-900">Change password</div>
          <div className="mt-1 text-sm text-zinc-600">Update your login password.</div>

          <div className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <div className="text-sm font-medium text-zinc-700">Current password</div>
              <input
                className="h-10 rounded-md border border-zinc-200 px-3 text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <div className="text-sm font-medium text-zinc-700">New password</div>
              <input
                className="h-10 rounded-md border border-zinc-200 px-3 text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>

            <button
              className="mt-2 h-10 rounded-md bg-amber-400 px-4 text-sm font-semibold text-zinc-900 hover:bg-amber-300 disabled:opacity-50"
              disabled={saving}
              onClick={async () => {
                setError(null);
                setSuccess(null);
                setSaving(true);
                const res = await changeMyPassword({
                  userId: user.id,
                  currentPassword,
                  newPassword,
                });
                setSaving(false);
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                setCurrentPassword("");
                setNewPassword("");
                setSuccess("Password updated");
              }}
            >
              {saving ? "Saving…" : "Save password"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-zinc-900">Local data</div>
          <div className="mt-1 text-sm text-zinc-600">
            This app stores data in this browser only. Use reset to start fresh.
          </div>

          <button
            className="mt-4 h-10 rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            onClick={() => {
              clearState();
              router.push("/login");
              window.location.reload();
            }}
          >
            Reset local data
          </button>
        </div>
      </div>
    </div>
  );
}

