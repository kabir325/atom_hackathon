"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import { createSharedGoalGroup } from "@/lib/goals";
import { type ThrustArea, type UomType } from "@/lib/types";

const THRUST_AREAS: ThrustArea[] = [
  "Growth",
  "Operational Excellence",
  "Customer",
  "People",
  "Compliance",
  "Other",
];

const UOM_TYPES: Array<{ value: UomType; label: string }> = [
  { value: "min", label: "Min (Higher is better)" },
  { value: "max", label: "Max (Lower is better)" },
  { value: "timeline", label: "Timeline" },
  { value: "zero", label: "Zero-based" },
];

export default function AdminSharedGoalsPage() {
  const { user } = useAuth();
  const { state, refresh } = useAppState();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thrustArea, setThrustArea] = useState<ThrustArea>("Operational Excellence");
  const [uomType, setUomType] = useState<UomType>("min");
  const [target, setTarget] = useState("");
  const [primaryOwnerId, setPrimaryOwnerId] = useState<string>("");
  const [recipientEmployeeIds, setRecipientEmployeeIds] = useState<string[]>([]);

  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
        This page is for Admin.
      </div>
    );
  }

  const employees = state.users
    .filter((u) => u.active && u.role === "employee")
    .slice()
    .sort((a, b) => a.email.localeCompare(b.email));

  const groups = state.sharedGoalGroups.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="text-lg font-semibold text-zinc-900">Shared Goals (Admin)</div>
        <div className="mt-1 text-sm text-zinc-600">
          Push a departmental KPI to multiple employees. Recipients can edit weightage only.
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-zinc-700">Title</div>
            <input className="h-10 rounded-md border border-zinc-200 px-3" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-zinc-700">Thrust Area</div>
            <select className="h-10 rounded-md border border-zinc-200 px-3" value={thrustArea} onChange={(e) => setThrustArea(e.target.value as ThrustArea)}>
              {THRUST_AREAS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 md:col-span-2">
            <div className="text-sm font-medium text-zinc-700">Description</div>
            <textarea className="rounded-md border border-zinc-200 px-3 py-2 text-sm" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>

          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-zinc-700">UoM Type</div>
            <select className="h-10 rounded-md border border-zinc-200 px-3" value={uomType} onChange={(e) => setUomType(e.target.value as UomType)}>
              {UOM_TYPES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-zinc-700">Target</div>
            <input className="h-10 rounded-md border border-zinc-200 px-3" value={target} onChange={(e) => setTarget(e.target.value)} placeholder={uomType === "timeline" ? "YYYY-MM-DD" : "e.g., 120"} />
          </label>

          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-zinc-700">Primary owner</div>
            <select className="h-10 rounded-md border border-zinc-200 px-3" value={primaryOwnerId} onChange={(e) => setPrimaryOwnerId(e.target.value)}>
              <option value="">Select</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.email}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1 md:col-span-2">
            <div className="text-sm font-medium text-zinc-700">Recipients</div>
            <div className="flex flex-wrap gap-2">
              {employees.map((e) => {
                const checked = recipientEmployeeIds.includes(e.id);
                return (
                  <label key={e.id} className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(ev) => {
                        const on = ev.target.checked;
                        setRecipientEmployeeIds((prev) => (on ? [...prev, e.id] : prev.filter((x) => x !== e.id)));
                      }}
                    />
                    {e.email}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button
            className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
            onClick={() => {
              setError(null);
              const res = createSharedGoalGroup({
                actorId: user.id,
                title,
                description,
                thrustArea,
                uomType,
                target,
                primaryOwnerId,
                recipientEmployeeIds,
              });
              if (!res.ok) {
                setError(res.error);
                return;
              }
              setTitle("");
              setDescription("");
              setTarget("");
              setPrimaryOwnerId("");
              setRecipientEmployeeIds([]);
              refresh();
            }}
          >
            Push shared goal
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="text-sm font-semibold text-zinc-900">All shared goal groups</div>
        <div className="mt-3 space-y-3">
          {groups.map((g) => {
            const owner = state.users.find((u) => u.id === g.primaryOwnerId);
            return (
              <div key={g.id} className="rounded-lg border border-zinc-200 p-4">
                <div className="font-medium text-zinc-900">{g.title}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  Owner {owner?.email ?? ""} • {g.thrustArea} • {g.uomType.toUpperCase()} • Target {g.target} • Recipients {g.recipientEmployeeIds.length}
                </div>
              </div>
            );
          })}
          {groups.length === 0 ? <div className="text-sm text-zinc-600">No shared goals yet.</div> : null}
        </div>
      </div>
    </div>
  );
}
