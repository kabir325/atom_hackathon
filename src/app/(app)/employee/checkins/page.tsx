"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import { getActiveCycle, getCurrentQuarter } from "@/lib/cycle";
import { getOrCreateMySheet } from "@/lib/goals";
import { upsertAchievement } from "@/lib/checkins";
import { computeProgressPercent } from "@/lib/progress";
import { type GoalStatus, type Quarter } from "@/lib/types";

const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];
const STATUSES: Array<{ value: GoalStatus; label: string }> = [
  { value: "not_started", label: "Not Started" },
  { value: "on_track", label: "On Track" },
  { value: "completed", label: "Completed" },
];

export default function EmployeeCheckinsPage() {
  const { user } = useAuth();
  const { state, refresh } = useAppState();
  const [error, setError] = useState<string | null>(null);
  const cycle = getActiveCycle();
  const defaultQuarter = getCurrentQuarter(cycle, new Date()) ?? "Q1";
  const [quarter, setQuarter] = useState<Quarter>(defaultQuarter);

  if (!user) return null;
  if (user.role !== "employee") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
        This page is for Employees.
      </div>
    );
  }

  const sheet = getOrCreateMySheet(user.id);
  const goals = state.goals.filter((g) => g.sheetId === sheet.id);

  const rows = goals.map((g) => {
    const ach = state.achievements.find((a) => a.goalId === g.id && a.quarter === quarter);
    const actual = ach?.actual ?? "";
    const status = ach?.status ?? "not_started";
    const progress = actual ? computeProgressPercent({ uomType: g.uomType, target: g.target, actual }) : 0;
    const canEditActual = !g.isShared || g.primaryOwnerId === user.id;
    return { g, actual, status, progress, canEditActual };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-zinc-900">My Check-ins</div>
            <div className="mt-1 text-sm text-zinc-600">
              Active cycle: <span className="font-medium text-zinc-900">{cycle.label}</span>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-zinc-700">Quarter</span>
            <select
              className="h-10 rounded-md border border-zinc-200 px-3"
              value={quarter}
              onChange={(e) => setQuarter(e.target.value as Quarter)}
            >
              {QUARTERS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </label>
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
                <th className="py-2 pr-2">Goal</th>
                <th className="py-2 pr-2">Target</th>
                <th className="py-2 pr-2">Actual</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Progress</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ g, actual, status, progress, canEditActual }) => (
                <tr key={g.id} className="border-t border-zinc-100 align-top">
                  <td className="py-2 pr-2">
                    <div className="font-medium text-zinc-900">{g.title}</div>
                    <div className="text-xs text-zinc-500">
                      {g.thrustArea} • {g.uomType.toUpperCase()} • Weightage {g.weightage}%
                      {g.isShared ? " • Shared" : ""}
                    </div>
                  </td>
                  <td className="py-2 pr-2">
                    <div className="text-zinc-900">{g.target}</div>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      className="h-9 w-40 rounded-md border border-zinc-200 px-2 disabled:bg-zinc-50"
                      value={actual}
                      disabled={!canEditActual}
                      onChange={(e) => {
                        setError(null);
                        const res = upsertAchievement({
                          actorId: user.id,
                          goalId: g.id,
                          quarter,
                          actual: e.target.value,
                          status,
                        });
                        if (!res.ok) setError(res.error);
                        refresh();
                      }}
                      placeholder={g.uomType === "timeline" ? "YYYY-MM-DD" : "e.g., 95"}
                    />
                    {!canEditActual ? (
                      <div className="mt-1 text-xs text-zinc-500">Primary owner updates this shared goal.</div>
                    ) : null}
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      className="h-9 w-40 rounded-md border border-zinc-200 px-2 disabled:bg-zinc-50"
                      value={status}
                      onChange={(e) => {
                        setError(null);
                        const nextStatus = e.target.value as GoalStatus;
                        const res = upsertAchievement({
                          actorId: user.id,
                          goalId: g.id,
                          quarter,
                          actual,
                          status: nextStatus,
                        });
                        if (!res.ok) setError(res.error);
                        refresh();
                      }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <div className="text-zinc-900">{Math.round(progress)}%</div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 ? (
                <tr>
                  <td className="py-6 text-sm text-zinc-600" colSpan={5}>
                    No goals found. Create goals first.
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
