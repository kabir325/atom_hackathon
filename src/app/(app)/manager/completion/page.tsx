"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import { getActiveCycle, getCurrentQuarter } from "@/lib/cycle";
import { computeProgressPercent } from "@/lib/progress";
import { type Quarter } from "@/lib/types";

const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export default function ManagerCompletionPage() {
  const { user } = useAuth();
  const { state } = useAppState();
  const cycle = getActiveCycle();
  const defaultQuarter = getCurrentQuarter(cycle, new Date()) ?? "Q1";
  const [quarter, setQuarter] = useState<Quarter>(defaultQuarter);

  if (!user) return null;
  if (user.role !== "manager") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm text-sm text-zinc-700">
        This page is for Managers.
      </div>
    );
  }

  const teamEmployees = state.users
    .filter((u) => u.active && u.role === "employee" && u.managerId === user.id)
    .slice()
    .sort((a, b) => a.email.localeCompare(b.email));
  const teamEmployeeIds = new Set(teamEmployees.map((e) => e.id));
  const sheets = state.goalSheets.filter((s) => s.cycleId === state.activeCycleId && teamEmployeeIds.has(s.employeeId));

  const rows = sheets.flatMap((sheet) => {
    const emp = teamEmployees.find((e) => e.id === sheet.employeeId);
    const goals = state.goals.filter((g) => g.sheetId === sheet.id);
    return goals.map((g) => {
      const ach = state.achievements.find((a) => a.goalId === g.id && a.quarter === quarter) ?? null;
      const actual = ach?.actual ?? "";
      const progress = actual ? computeProgressPercent({ uomType: g.uomType, target: g.target, actual }) : 0;
      return {
        id: g.id,
        employeeEmail: emp?.email ?? sheet.employeeId,
        sheetStatus: sheet.status,
        goalTitle: g.title,
        weightage: g.weightage,
        target: g.target,
        actual,
        status: ach?.status ?? "",
        progress: Math.round(progress),
        isShared: g.isShared,
      };
    });
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-zinc-900">Completion</div>
            <div className="mt-1 text-sm text-zinc-600">
              Progress overview for your team (cycle: <span className="font-medium text-zinc-900">{cycle.label}</span>)
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-zinc-700">Quarter</span>
            <select
              className="h-10 rounded-md border border-zinc-200 px-3 text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
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
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-zinc-600">Rows: {rows.length}</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="py-2 pr-2">Employee</th>
                <th className="py-2 pr-2">Sheet</th>
                <th className="py-2 pr-2">Goal</th>
                <th className="py-2 pr-2">Target %</th>
                <th className="py-2 pr-2">Actual %</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Progress</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-zinc-100 align-top">
                  <td className="py-2 pr-2">{r.employeeEmail}</td>
                  <td className="py-2 pr-2">{r.sheetStatus}</td>
                  <td className="py-2 pr-2">
                    <div className="font-medium text-zinc-900">{r.goalTitle}</div>
                    <div className="text-xs text-zinc-500">
                      Weight {r.weightage}%{r.isShared ? " • Shared" : ""}
                    </div>
                  </td>
                  <td className="py-2 pr-2">{r.target}</td>
                  <td className="py-2 pr-2">{r.actual}</td>
                  <td className="py-2 pr-2">{r.status}</td>
                  <td className="py-2 pr-2">{r.progress}%</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="py-6 text-sm text-zinc-600" colSpan={7}>
                    No data yet.
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

