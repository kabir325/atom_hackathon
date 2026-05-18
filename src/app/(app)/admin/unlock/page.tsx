"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import { adminUnlockGoalSheet } from "@/lib/goals";

export default function AdminUnlockPage() {
  const { user } = useAuth();
  const { state, refresh } = useAppState();
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
        This page is for Admin.
      </div>
    );
  }

  const cycleId = state.activeCycleId;
  const sheets = state.goalSheets
    .filter((s) => s.cycleId === cycleId)
    .slice()
    .sort((a, b) => (b.lockedAt ?? "").localeCompare(a.lockedAt ?? ""));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="text-lg font-semibold text-zinc-900">Unlock Goals</div>
        <div className="mt-1 text-sm text-zinc-600">
          Unlock an approved sheet so it can be edited (admin-only).
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="py-2 pr-2">Employee</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Locked</th>
                <th className="py-2 pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sheets.map((s) => {
                const emp = state.users.find((u) => u.id === s.employeeId);
                return (
                  <tr key={s.id} className="border-t border-zinc-100 align-top">
                    <td className="py-2 pr-2">{emp?.email ?? s.employeeId}</td>
                    <td className="py-2 pr-2">{s.status}</td>
                    <td className="py-2 pr-2">{s.lockedAt ? s.lockedAt.replace("T", " ").slice(0, 19) : "—"}</td>
                    <td className="py-2 pr-2">
                      <button
                        className="h-9 rounded-md border border-zinc-200 px-3 text-xs hover:bg-zinc-50 disabled:opacity-50"
                        disabled={!s.lockedAt}
                        onClick={() => {
                          setError(null);
                          const res = adminUnlockGoalSheet({ actorId: user.id, sheetId: s.id });
                          if (!res.ok) setError(res.error);
                          refresh();
                        }}
                      >
                        Unlock
                      </button>
                    </td>
                  </tr>
                );
              })}

              {sheets.length === 0 ? (
                <tr>
                  <td className="py-6 text-sm text-zinc-600" colSpan={4}>
                    No goal sheets yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
