"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import { downloadCsv, toCsv } from "@/lib/csv";
import { buildCompletionDashboardRows } from "@/lib/reporting";
import { type Quarter } from "@/lib/types";

const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export default function CompletionDashboardPage() {
  const { user } = useAuth();
  useAppState();
  const [quarter, setQuarter] = useState<Quarter>("Q1");

  if (!user) return null;
  if (user.role === "employee") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
        Reports are available for Managers and Admin.
      </div>
    );
  }

  const rows = buildCompletionDashboardRows(quarter);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-zinc-900">Completion Dashboard</div>
            <div className="mt-1 text-sm text-zinc-600">
              Real-time view of employee updates and manager check-ins for the selected quarter.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="h-10 rounded-md border border-zinc-200 px-3" value={quarter} onChange={(e) => setQuarter(e.target.value as Quarter)}>
              {QUARTERS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
            <button
              className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
              onClick={() => downloadCsv(`completion_${quarter}.csv`, toCsv(rows))}
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="text-sm text-zinc-600">Employees: {rows.length}</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="py-2 pr-2">Employee</th>
                <th className="py-2 pr-2">Manager</th>
                <th className="py-2 pr-2">Goals</th>
                <th className="py-2 pr-2">Employee updated</th>
                <th className="py-2 pr-2">Manager check-in</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="border-t border-zinc-100 align-top">
                  <td className="py-2 pr-2">{String(r.employeeEmail)}</td>
                  <td className="py-2 pr-2">{String(r.managerEmail)}</td>
                  <td className="py-2 pr-2">{String(r.goalsStatus)}</td>
                  <td className="py-2 pr-2">{String(r.employeeUpdated)}</td>
                  <td className="py-2 pr-2">{String(r.managerCheckinDone)}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="py-6 text-sm text-zinc-600" colSpan={5}>
                    No employees.
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

