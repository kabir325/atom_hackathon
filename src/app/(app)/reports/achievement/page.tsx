"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import { toCsv, downloadCsv } from "@/lib/csv";
import { buildAchievementReportRows } from "@/lib/reporting";
import { type Quarter } from "@/lib/types";

const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export default function AchievementReportPage() {
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

  const rows = buildAchievementReportRows(quarter);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-zinc-900">Achievement Report</div>
            <div className="mt-1 text-sm text-zinc-600">Exportable planned vs actual for the selected quarter.</div>
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
              onClick={() => {
                const csv = toCsv(rows);
                downloadCsv(`achievement_${quarter}.csv`, csv);
              }}
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="text-sm text-zinc-600">Rows: {rows.length}</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="py-2 pr-2">Employee</th>
                <th className="py-2 pr-2">Goal</th>
                <th className="py-2 pr-2">Target</th>
                <th className="py-2 pr-2">Actual</th>
                <th className="py-2 pr-2">Progress</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((r, idx) => (
                <tr key={idx} className="border-t border-zinc-100 align-top">
                  <td className="py-2 pr-2">
                    <div className="font-medium text-zinc-900">{String(r.employeeEmail)}</div>
                    <div className="text-xs text-zinc-500">{String(r.managerEmail)}</div>
                  </td>
                  <td className="py-2 pr-2">{String(r.goalTitle)}</td>
                  <td className="py-2 pr-2">{String(r.target)}</td>
                  <td className="py-2 pr-2">{String(r.actual)}</td>
                  <td className="py-2 pr-2">{String(r.progressPercent)}%</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="py-6 text-sm text-zinc-600" colSpan={5}>
                    No data.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {rows.length > 50 ? <div className="mt-3 text-xs text-zinc-500">Showing first 50 rows. Export CSV for full data.</div> : null}
      </div>
    </div>
  );
}
