"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import { createUser, resetPassword, updateUser } from "@/lib/auth";
import { type Role } from "@/lib/types";

const ROLES: Role[] = ["employee", "manager", "admin"];

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { state, refresh } = useAppState();
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const [managerId, setManagerId] = useState<string>("");
  const [password, setPassword] = useState("Welcome@123");

  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
        This page is for Admin.
      </div>
    );
  }

  const managers = state.users
    .filter((u) => u.active && u.role === "manager")
    .slice()
    .sort((a, b) => a.email.localeCompare(b.email));

  const users = state.users.slice().sort((a, b) => a.email.localeCompare(b.email));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-zinc-900">Users</div>
            <div className="mt-1 text-sm text-zinc-600">Create and manage accounts.</div>
          </div>
          <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            {users.length} total
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="text-sm font-semibold text-zinc-900">Create user</div>
          <div className="mt-1 text-sm text-zinc-600">Add an Employee, Manager, or Admin account.</div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-1">
            <label className="flex flex-col gap-1">
              <div className="text-sm font-medium text-zinc-700">Email</div>
              <input
                className="h-10 rounded-md border border-zinc-200 px-3 text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@company.com"
              />
            </label>
            <label className="flex flex-col gap-1">
              <div className="text-sm font-medium text-zinc-700">Name</div>
              <input
                className="h-10 rounded-md border border-zinc-200 px-3 text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </label>
            <label className="flex flex-col gap-1">
              <div className="text-sm font-medium text-zinc-700">Role</div>
              <select
                className="h-10 rounded-md border border-zinc-200 px-3 text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <div className="text-sm font-medium text-zinc-700">Manager (for employee)</div>
              <select
                className="h-10 rounded-md border border-zinc-200 px-3 text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-zinc-50"
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                disabled={role !== "employee"}
              >
                <option value="">None</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 md:col-span-2 lg:col-span-1">
              <div className="text-sm font-medium text-zinc-700">Initial password</div>
              <input
                className="h-10 rounded-md border border-zinc-200 px-3 text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-end">
            <button
              className="h-10 rounded-md bg-amber-400 px-4 text-sm font-semibold text-zinc-900 hover:bg-amber-300"
              onClick={async () => {
                setError(null);
                const res = await createUser({
                  actorId: user.id,
                  email,
                  name,
                  role,
                  password,
                  managerId: role === "employee" ? managerId || undefined : undefined,
                });
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                setEmail("");
                setName("");
                setRole("employee");
                setManagerId("");
                setPassword("Welcome@123");
                refresh();
              }}
            >
              Create user
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-zinc-900">All users</div>
            <div className="text-xs text-zinc-500">Inline editing enabled</div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="py-2 pr-2">Email</th>
                <th className="py-2 pr-2">Name</th>
                <th className="py-2 pr-2">Role</th>
                <th className="py-2 pr-2">Manager</th>
                <th className="py-2 pr-2">Active</th>
                <th className="py-2 pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-zinc-100 align-top">
                  <td className="py-2 pr-2">{u.email}</td>
                  <td className="py-2 pr-2">
                    <input
                      className="h-9 w-44 rounded-md border border-zinc-200 px-2 text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      value={u.name}
                      onChange={(e) => {
                        updateUser({ actorId: user.id, userId: u.id, patch: { name: e.target.value } });
                        refresh();
                      }}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      className="h-9 w-32 rounded-md border border-zinc-200 px-2 text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      value={u.role}
                      onChange={(e) => {
                        updateUser({ actorId: user.id, userId: u.id, patch: { role: e.target.value as Role } });
                        refresh();
                      }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      className="h-9 w-44 rounded-md border border-zinc-200 px-2 text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-zinc-50"
                      disabled={u.role !== "employee"}
                      value={u.managerId ?? ""}
                      onChange={(e) => {
                        updateUser({
                          actorId: user.id,
                          userId: u.id,
                          patch: { managerId: e.target.value || undefined },
                        });
                        refresh();
                      }}
                    >
                      <option value="">None</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.email}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="checkbox"
                      checked={u.active}
                      onChange={(e) => {
                        updateUser({ actorId: user.id, userId: u.id, patch: { active: e.target.checked } });
                        refresh();
                      }}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <button
                      className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                      onClick={async () => {
                        setError(null);
                        const res = await resetPassword({
                          actorId: user.id,
                          userId: u.id,
                          newPassword: "Welcome@123",
                        });
                        if (!res.ok) setError(res.error);
                        refresh();
                      }}
                    >
                      Reset password
                    </button>
                  </td>
                </tr>
              ))}

              {users.length === 0 ? (
                <tr>
                  <td className="py-6 text-sm text-zinc-600" colSpan={6}>
                    No users.
                  </td>
                </tr>
              ) : null}
            </tbody>
            </table>
        </div>
        </div>
      </div>
    </div>
  );
}
