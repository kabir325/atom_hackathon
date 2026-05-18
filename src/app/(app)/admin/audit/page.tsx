"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import { type AuditAction, type AuditEntity } from "@/lib/types";

export default function AdminAuditPage() {
  const { user } = useAuth();
  const { state } = useAppState();
  const [entity, setEntity] = useState<AuditEntity | "all">("all");
  const [action, setAction] = useState<AuditAction | "all">("all");

  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
        This page is for Admin.
      </div>
    );
  }

  const filtered = state.audit.filter((a) => {
    if (entity !== "all" && a.entity !== entity) return false;
    if (action !== "all" && a.action !== action) return false;
    return true;
  });

  const entities = Array.from(new Set(state.audit.map((a) => a.entity))).sort();
  const actions = Array.from(new Set(state.audit.map((a) => a.action))).sort();

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="text-lg font-semibold text-zinc-900">Audit Trail</div>
        <div className="mt-1 text-sm text-zinc-600">All tracked changes (most recent first).</div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            Entity
            <select className="h-9 rounded-md border border-zinc-200 px-2" value={entity} onChange={(e) => setEntity(e.target.value as AuditEntity | "all")}>
              <option value="all">All</option>
              {entities.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            Action
            <select className="h-9 rounded-md border border-zinc-200 px-2" value={action} onChange={(e) => setAction(e.target.value as AuditAction | "all")}>
              <option value="all">All</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="py-2 pr-2">Time</th>
                <th className="py-2 pr-2">Actor</th>
                <th className="py-2 pr-2">Entity</th>
                <th className="py-2 pr-2">Action</th>
                <th className="py-2 pr-2">Changes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const actor = state.users.find((u) => u.id === a.actorId);
                return (
                  <tr key={a.id} className="border-t border-zinc-100 align-top">
                    <td className="py-2 pr-2 whitespace-nowrap">{a.at.replace("T", " ").slice(0, 19)}</td>
                    <td className="py-2 pr-2">{actor?.email ?? a.actorId}</td>
                    <td className="py-2 pr-2">
                      <div className="font-medium text-zinc-900">{a.entity}</div>
                      <div className="text-xs text-zinc-500">{a.entityId}</div>
                    </td>
                    <td className="py-2 pr-2">{a.action}</td>
                    <td className="py-2 pr-2">
                      {a.changes && a.changes.length > 0 ? (
                        <div className="space-y-1">
                          {a.changes.slice(0, 4).map((c, idx) => (
                            <div key={idx} className="text-xs text-zinc-700">
                              <span className="font-medium">{c.field}</span>: {String(c.from ?? "")} → {String(c.to ?? "")}
                            </div>
                          ))}
                          {a.changes.length > 4 ? (
                            <div className="text-xs text-zinc-500">+{a.changes.length - 4} more</div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-500">—</div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 ? (
                <tr>
                  <td className="py-6 text-sm text-zinc-600" colSpan={5}>
                    No audit entries.
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
