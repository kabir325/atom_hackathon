"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import { getActiveCycle, getCurrentQuarter } from "@/lib/cycle";

export default function DashboardPage() {
  const { user } = useAuth();
  const { state } = useAppState();

  if (!user) return null;
  const cycle = getActiveCycle();
  const currentQuarter = getCurrentQuarter(cycle, new Date());

  const mySheet = state.goalSheets.find(
    (s) => s.employeeId === user.id && s.cycleId === state.activeCycleId,
  );

  const quickLinks =
    user.role === "admin"
      ? [
          { href: "/admin/users", label: "Manage Users" },
          { href: "/admin/cycle", label: "Cycle Windows" },
          { href: "/admin/shared-goals", label: "Push Shared Goals" },
          { href: "/reports/achievement", label: "Achievement Report" },
          { href: "/admin/audit", label: "Audit Trail" },
        ]
      : user.role === "manager"
        ? [
            { href: "/manager/reviews", label: "Goal Approvals" },
            { href: "/manager/checkins", label: "Team Check-ins" },
            { href: "/manager/shared-goals", label: "Shared Goals" },
            { href: "/reports/completion", label: "Completion Dashboard" },
          ]
        : [
            { href: "/employee/goals", label: "Create / Submit Goals" },
            { href: "/employee/checkins", label: "Quarterly Updates" },
          ];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="text-lg font-semibold text-zinc-900">Dashboard</div>
        <div className="mt-1 text-sm text-zinc-600">
          Active cycle: <span className="font-medium text-zinc-900">{cycle.label}</span>
          {currentQuarter ? (
            <>
              {" "}
              • Current quarter: <span className="font-medium text-zinc-900">{currentQuarter}</span>
            </>
          ) : null}
        </div>
        {user.role === "employee" ? (
          <div className="mt-3 text-sm text-zinc-700">
            Goal sheet status:{" "}
            <span className="font-medium text-zinc-900">{mySheet?.status ?? "not started"}</span>
            {mySheet?.lockedAt ? (
              <>
                {" "}
                • Locked
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {quickLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-300"
          >
            <div className="text-sm font-semibold text-zinc-900">{l.label}</div>
            <div className="mt-1 text-xs text-zinc-500">Open</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

