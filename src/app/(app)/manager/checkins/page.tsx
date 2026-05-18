"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import { getActiveCycle, getCurrentQuarter } from "@/lib/cycle";
import { computeProgressPercent } from "@/lib/progress";
import { upsertManagerCheckin } from "@/lib/checkins";
import { type Quarter } from "@/lib/types";

const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export default function ManagerCheckinsPage() {
  const { user } = useAuth();
  const { state, refresh } = useAppState();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cycle = getActiveCycle();
  const defaultQuarter = getCurrentQuarter(cycle, new Date()) ?? "Q1";
  const [quarter, setQuarter] = useState<Quarter>(defaultQuarter);

  const userId = user?.id ?? "";
  const isManager = user?.role === "manager";

  const teamEmployees = state.users
    .filter((u) => u.active && u.role === "employee" && u.managerId === userId)
    .sort((a, b) => a.email.localeCompare(b.email));

  const employeeId = selectedEmployeeId ?? teamEmployees.at(0)?.id ?? null;
  const employee = teamEmployees.find((e) => e.id === employeeId) ?? null;
  const sheet = employee
    ? state.goalSheets.find((s) => s.employeeId === employee.id && s.cycleId === state.activeCycleId) ?? null
    : null;

  const goals = sheet ? state.goals.filter((g) => g.sheetId === sheet.id) : [];
  const managerCheckin = employee
    ? state.checkins.find(
        (c) => c.employeeId === employee.id && c.cycleId === state.activeCycleId && c.quarter === quarter,
      ) ?? null
    : null;

  const [comment, setComment] = useState(() => managerCheckin?.comment ?? "");

  if (!user) return null;
  if (!isManager) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
        This page is for Managers.
      </div>
    );
  }

  const rows = goals.map((g) => {
    const ach = state.achievements.find((a) => a.goalId === g.id && a.quarter === quarter) ?? null;
    const actual = ach?.actual ?? "";
    const progress = actual ? computeProgressPercent({ uomType: g.uomType, target: g.target, actual }) : 0;
    return { g, actual, status: ach?.status ?? "", progress };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-zinc-900">Team Check-ins</div>
            <div className="mt-1 text-sm text-zinc-600">
              Active cycle: <span className="font-medium text-zinc-900">{cycle.label}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-10 rounded-md border border-zinc-200 px-3"
              value={employee?.id ?? ""}
              onChange={(e) => {
                const nextEmployeeId = e.target.value;
                setSelectedEmployeeId(nextEmployeeId);
                setError(null);
                const nextCheckin =
                  nextEmployeeId
                    ? state.checkins.find(
                        (c) => c.employeeId === nextEmployeeId && c.cycleId === state.activeCycleId && c.quarter === quarter,
                      ) ?? null
                    : null;
                setComment(nextCheckin?.comment ?? "");
              }}
            >
              {teamEmployees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} • {e.email}
                </option>
              ))}
            </select>

            <select
              className="h-10 rounded-md border border-zinc-200 px-3"
              value={quarter}
              onChange={(e) => {
                const q = e.target.value as Quarter;
                setQuarter(q);
                const nextCheckin =
                  employeeId
                    ? state.checkins.find(
                        (c) => c.employeeId === employeeId && c.cycleId === state.activeCycleId && c.quarter === q,
                      ) ?? null
                    : null;
                setComment(nextCheckin?.comment ?? "");
              }}
            >
              {QUARTERS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      {!employee ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
          No employees assigned to you yet.
        </div>
      ) : !sheet ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
          {employee.email} has not created a goal sheet yet.
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="text-sm font-semibold text-zinc-900">Planned vs Actual ({quarter})</div>
            <div className="mt-2 overflow-x-auto">
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
                  {rows.map((r) => (
                    <tr key={r.g.id} className="border-t border-zinc-100 align-top">
                      <td className="py-2 pr-2">
                        <div className="font-medium text-zinc-900">{r.g.title}</div>
                        <div className="text-xs text-zinc-500">
                          {r.g.uomType.toUpperCase()} • Weightage {r.g.weightage}%{r.g.isShared ? " • Shared" : ""}
                        </div>
                      </td>
                      <td className="py-2 pr-2">{r.g.target}</td>
                      <td className="py-2 pr-2">{r.actual}</td>
                      <td className="py-2 pr-2">{r.status}</td>
                      <td className="py-2 pr-2">{Math.round(r.progress)}%</td>
                    </tr>
                  ))}

                  {rows.length === 0 ? (
                    <tr>
                      <td className="py-6 text-sm text-zinc-600" colSpan={5}>
                        No goals.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="text-sm font-semibold text-zinc-900">Check-in Comment</div>
            <textarea
              className="mt-2 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Document the discussion..."
            />
            <div className="mt-3 flex items-center justify-end">
              <button
                className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
                onClick={() => {
                  setError(null);
                  const res = upsertManagerCheckin({
                    actorId: user.id,
                    employeeId: employee.id,
                    quarter,
                    comment,
                  });
                  if (!res.ok) setError(res.error);
                  refresh();
                }}
              >
                Save comment
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
