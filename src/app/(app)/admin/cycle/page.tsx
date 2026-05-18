"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import { setActiveCycle, updateCycleWindows } from "@/lib/cycle";

function isoToDateInput(iso: string) {
  return iso.slice(0, 10);
}

function dateInputToIso(value: string) {
  const [y, m, d] = value.split("-").map((x) => Number(x));
  if (!y || !m || !d) return new Date().toISOString();
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0)).toISOString();
}

export default function AdminCyclePage() {
  const { user } = useAuth();
  const { state, refresh } = useAppState();
  const [error, setError] = useState<string | null>(null);

  const active = state.cycles.find((c) => c.id === state.activeCycleId) ?? state.cycles[0];
  const [label, setLabel] = useState(active?.label ?? "");

  const [goalSettingOpen, setGoalSettingOpen] = useState(
    active ? isoToDateInput(active.windows.goalSettingOpen) : "",
  );
  const [q1Open, setQ1Open] = useState(active ? isoToDateInput(active.windows.q1Open) : "");
  const [q2Open, setQ2Open] = useState(active ? isoToDateInput(active.windows.q2Open) : "");
  const [q3Open, setQ3Open] = useState(active ? isoToDateInput(active.windows.q3Open) : "");
  const [q4Open, setQ4Open] = useState(active ? isoToDateInput(active.windows.q4Open) : "");

  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
        This page is for Admin.
      </div>
    );
  }

  if (!active) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
        No cycle found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="text-lg font-semibold text-zinc-900">Cycle Management</div>
        <div className="mt-1 text-sm text-zinc-600">Configure the quarterly windows enforced by the portal.</div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 md:col-span-2">
            <div className="text-sm font-medium text-zinc-700">Active cycle</div>
            <select
              className="h-10 rounded-md border border-zinc-200 px-3"
              value={state.activeCycleId}
              onChange={(e) => {
                setError(null);
                const nextId = e.target.value;
                const nextCycle = state.cycles.find((c) => c.id === nextId) ?? null;
                if (nextCycle) {
                  setLabel(nextCycle.label);
                  setGoalSettingOpen(isoToDateInput(nextCycle.windows.goalSettingOpen));
                  setQ1Open(isoToDateInput(nextCycle.windows.q1Open));
                  setQ2Open(isoToDateInput(nextCycle.windows.q2Open));
                  setQ3Open(isoToDateInput(nextCycle.windows.q3Open));
                  setQ4Open(isoToDateInput(nextCycle.windows.q4Open));
                }
                const res = setActiveCycle({ actorId: user.id, cycleId: nextId });
                if (!res.ok) setError(res.error);
                refresh();
              }}
            >
              {state.cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 md:col-span-2">
            <div className="text-sm font-medium text-zinc-700">Label</div>
            <input className="h-10 rounded-md border border-zinc-200 px-3" value={label} onChange={(e) => setLabel(e.target.value)} />
          </label>

          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-zinc-700">Goal setting opens</div>
            <input className="h-10 rounded-md border border-zinc-200 px-3" type="date" value={goalSettingOpen} onChange={(e) => setGoalSettingOpen(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-zinc-700">Q1 opens</div>
            <input className="h-10 rounded-md border border-zinc-200 px-3" type="date" value={q1Open} onChange={(e) => setQ1Open(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-zinc-700">Q2 opens</div>
            <input className="h-10 rounded-md border border-zinc-200 px-3" type="date" value={q2Open} onChange={(e) => setQ2Open(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-zinc-700">Q3 opens</div>
            <input className="h-10 rounded-md border border-zinc-200 px-3" type="date" value={q3Open} onChange={(e) => setQ3Open(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-zinc-700">Q4 / Annual opens</div>
            <input className="h-10 rounded-md border border-zinc-200 px-3" type="date" value={q4Open} onChange={(e) => setQ4Open(e.target.value)} />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button
            className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
            onClick={() => {
              setError(null);
              const res = updateCycleWindows({
                actorId: user.id,
                cycleId: active.id,
                label,
                windows: {
                  goalSettingOpen: dateInputToIso(goalSettingOpen),
                  q1Open: dateInputToIso(q1Open),
                  q2Open: dateInputToIso(q2Open),
                  q3Open: dateInputToIso(q3Open),
                  q4Open: dateInputToIso(q4Open),
                },
              });
              if (!res.ok) setError(res.error);
              refresh();
            }}
          >
            Save
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="text-sm font-semibold text-zinc-900">Schedule</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="py-2 pr-2">Period</th>
                <th className="py-2 pr-2">Window opens</th>
                <th className="py-2 pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="text-zinc-700">
              <tr className="border-t border-zinc-100">
                <td className="py-2 pr-2">Goal Setting</td>
                <td className="py-2 pr-2">{isoToDateInput(active.windows.goalSettingOpen)}</td>
                <td className="py-2 pr-2">Goal Creation, Submission & Approval</td>
              </tr>
              <tr className="border-t border-zinc-100">
                <td className="py-2 pr-2">Q1 Check-in</td>
                <td className="py-2 pr-2">{isoToDateInput(active.windows.q1Open)}</td>
                <td className="py-2 pr-2">Progress Update — Planned vs. Actual</td>
              </tr>
              <tr className="border-t border-zinc-100">
                <td className="py-2 pr-2">Q2 Check-in</td>
                <td className="py-2 pr-2">{isoToDateInput(active.windows.q2Open)}</td>
                <td className="py-2 pr-2">Progress Update — Planned vs. Actual</td>
              </tr>
              <tr className="border-t border-zinc-100">
                <td className="py-2 pr-2">Q3 Check-in</td>
                <td className="py-2 pr-2">{isoToDateInput(active.windows.q3Open)}</td>
                <td className="py-2 pr-2">Progress Update — Planned vs. Actual</td>
              </tr>
              <tr className="border-t border-zinc-100">
                <td className="py-2 pr-2">Q4 / Annual</td>
                <td className="py-2 pr-2">{isoToDateInput(active.windows.q4Open)}</td>
                <td className="py-2 pr-2">Final Achievement Capture</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
