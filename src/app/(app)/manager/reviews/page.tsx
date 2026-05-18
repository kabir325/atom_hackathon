"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import { approveGoalSheet, getGoalsForSheet, getTeamSheetsForManager, returnGoalSheet, updateGoal, validateGoals } from "@/lib/goals";
import { type GoalSheet } from "@/lib/types";

export default function ManagerReviewsPage() {
  const { user } = useAuth();
  const { state, refresh } = useAppState();
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;
  if (user.role !== "manager") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
        This page is for Managers.
      </div>
    );
  }

  const sheets = getTeamSheetsForManager(user.id).sort((a, b) => a.employeeId.localeCompare(b.employeeId));
  const selected = sheets.find((s) => s.id === selectedSheetId) ?? sheets.at(0) ?? null;

  const employee = selected ? state.users.find((u) => u.id === selected.employeeId) : null;
  const goals = selected ? getGoalsForSheet(selected.id) : [];
  const validation = validateGoals(goals);

  const submittedCount = sheets.filter((s) => s.status === "submitted").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-zinc-900">Goal Approvals</div>
            <div className="mt-1 text-sm text-zinc-600">Submitted pending: {submittedCount}</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-10 rounded-md border border-zinc-200 px-3"
              value={selected?.id ?? ""}
              onChange={(e) => setSelectedSheetId(e.target.value)}
            >
              {sheets.map((s) => {
                const emp = state.users.find((u) => u.id === s.employeeId);
                return (
                  <option key={s.id} value={s.id}>
                    {(emp?.name ?? emp?.email ?? s.employeeId) + ` • ${s.status}`}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      {!selected ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
          No team members assigned yet. Ask Admin to set Employee.managerId to your user.
        </div>
      ) : (
        <>
          <SheetHeader sheet={selected} employeeLabel={employee?.email ?? ""} validationOk={validation.ok} />

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-zinc-500">
                  <tr>
                    <th className="py-2 pr-2">Goal</th>
                    <th className="py-2 pr-2">UoM</th>
                    <th className="py-2 pr-2">Target</th>
                    <th className="py-2 pr-2">Weightage</th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((g) => (
                    <tr key={g.id} className="border-t border-zinc-100 align-top">
                      <td className="py-2 pr-2">
                        <div className="font-medium text-zinc-900">{g.title}</div>
                        <div className="text-xs text-zinc-500">{g.thrustArea}{g.isShared ? " • Shared" : ""}</div>
                      </td>
                      <td className="py-2 pr-2">
                        <div className="text-zinc-900">{g.uomType.toUpperCase()}</div>
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          className="h-9 w-40 rounded-md border border-zinc-200 px-2 disabled:bg-zinc-50"
                          disabled={selected.lockedAt || selected.status !== "submitted" || g.isShared}
                          value={g.target}
                          onChange={(e) => {
                            updateGoal({ actorId: user.id, goalId: g.id, patch: { target: e.target.value } });
                            refresh();
                          }}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          className="h-9 w-24 rounded-md border border-zinc-200 px-2 disabled:bg-zinc-50"
                          disabled={selected.lockedAt || selected.status !== "submitted"}
                          value={String(g.weightage)}
                          onChange={(e) => {
                            updateGoal({ actorId: user.id, goalId: g.id, patch: { weightage: Number(e.target.value) } });
                            refresh();
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                  {goals.length === 0 ? (
                    <tr>
                      <td className="py-6 text-sm text-zinc-600" colSpan={4}>
                        No goals in this sheet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {!validation.ok && selected.status === "submitted" ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {validation.errors.join(". ")}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                className="h-10 rounded-md border border-zinc-200 px-4 text-sm hover:bg-zinc-50 disabled:opacity-50"
                disabled={selected.status !== "submitted"}
                onClick={() => {
                  setError(null);
                  const res = returnGoalSheet({ actorId: user.id, sheetId: selected.id });
                  if (!res.ok) setError(res.error);
                  refresh();
                }}
              >
                Return for rework
              </button>
              <button
                className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                disabled={selected.status !== "submitted" || !validation.ok}
                onClick={() => {
                  setError(null);
                  const res = approveGoalSheet({ actorId: user.id, sheetId: selected.id });
                  if (!res.ok) setError(res.error);
                  refresh();
                }}
              >
                Approve & Lock
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SheetHeader(props: { sheet: GoalSheet; employeeLabel: string; validationOk: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-zinc-900">{props.employeeLabel || "Employee"}</div>
          <div className="mt-1 text-sm text-zinc-600">
            Status: <span className="font-medium text-zinc-900">{props.sheet.status}</span>
            {props.sheet.lockedAt ? <> • Locked</> : null}
          </div>
        </div>
        <div className="text-sm text-zinc-700">
          Validation:{" "}
          <span className={props.validationOk ? "font-semibold text-zinc-900" : "font-semibold text-amber-700"}>
            {props.validationOk ? "OK" : "Needs fixes"}
          </span>
        </div>
      </div>
    </div>
  );
}
