"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import { getActiveCycle, getCurrentQuarter } from "@/lib/cycle";
import { buildNotifications, countUnread, getLastSeenAt } from "@/lib/notifications";
import { computeProgressPercent } from "@/lib/progress";
import { type AppState } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const { state } = useAppState();

  if (!user) return null;
  const cycle = getActiveCycle();
  const currentQuarter = getCurrentQuarter(cycle, new Date());

  const notifications = buildNotifications(state, user.id, user.role);
  const lastSeenAt = getLastSeenAt(user.id);
  const unread = countUnread(notifications, lastSeenAt);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
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
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="h-10 rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-900 hover:bg-amber-300 inline-flex items-center"
              href={user.role === "admin" ? "/admin/users" : user.role === "manager" ? "/manager/reviews" : "/employee/goals"}
            >
              {user.role === "admin" ? "Manage users" : user.role === "manager" ? "Review goals" : "My goals"}
            </Link>
            <Link
              className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 inline-flex items-center"
              href="/notifications"
            >
              Notifications {unread > 0 ? `(${unread})` : ""}
            </Link>
          </div>
        </div>
      </div>

      {user.role === "employee" ? (
        <EmployeeDashboard state={state} userId={user.id} currentQuarter={currentQuarter} />
      ) : user.role === "manager" ? (
        <ManagerDashboard state={state} userId={user.id} currentQuarter={currentQuarter} />
      ) : (
        <AdminDashboard state={state} currentQuarter={currentQuarter} />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <NotificationsCard items={notifications.slice(0, 6)} unread={unread} />
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="text-sm font-semibold text-zinc-900">Quick actions</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {user.role === "employee" ? (
              <>
                <Link className="h-10 rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-900 hover:bg-amber-300 inline-flex items-center" href="/employee/goals">
                  Create / edit goals
                </Link>
                <Link className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 inline-flex items-center" href="/employee/checkins">
                  Quarterly check-in
                </Link>
              </>
            ) : user.role === "manager" ? (
              <>
                <Link className="h-10 rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-900 hover:bg-amber-300 inline-flex items-center" href="/manager/reviews">
                  Review goal sheets
                </Link>
                <Link className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 inline-flex items-center" href="/manager/checkins">
                  Team check-ins
                </Link>
                <Link className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 inline-flex items-center" href="/manager/completion">
                  Completion overview
                </Link>
              </>
            ) : (
              <>
                <Link className="h-10 rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-900 hover:bg-amber-300 inline-flex items-center" href="/admin/users">
                  Users
                </Link>
                <Link className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 inline-flex items-center" href="/admin/shared-goals">
                  Shared KPIs
                </Link>
                <Link className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 inline-flex items-center" href="/admin/audit">
                  Audit trail
                </Link>
              </>
            )}
            <Link className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 inline-flex items-center" href="/settings">
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard(props: { state: AppState; userId: string; currentQuarter: string | null }) {
  const sheet =
    props.state.goalSheets.find((s) => s.employeeId === props.userId && s.cycleId === props.state.activeCycleId) ??
    null;
  const goals = sheet ? props.state.goals.filter((g) => g.sheetId === sheet.id) : [];
  const totalWeightage = goals.reduce((sum, g) => sum + (Number.isFinite(g.weightage) ? g.weightage : 0), 0);

  const rows = goals.map((g) => {
    const ach =
      props.currentQuarter
        ? props.state.achievements.find((a) => a.goalId === g.id && a.quarter === props.currentQuarter) ?? null
        : null;
    const actual = ach?.actual ?? "";
    const progress = actual ? computeProgressPercent({ uomType: g.uomType, target: g.target, actual }) : 0;
    const commentCount = props.state.goalComments.filter((c) => c.goalId === g.id).length;
    return { g, actual, progress: Math.round(progress), status: ach?.status ?? "", commentCount };
  });

  const approved = sheet?.status === "approved";
  const submitted = sheet?.status === "submitted";
  const returned = sheet?.status === "returned";

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="My goals" value={goals.length} hint="Up to 8 goals" />
        <StatCard label="Weightage used" value={`${totalWeightage}%`} hint="Must not exceed 100%" />
        <StatCard
          label="Status"
          value={sheet?.status ?? "not started"}
          hint={approved ? "Approved & locked" : submitted ? "Waiting for approval" : returned ? "Needs edits" : "Draft"}
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-zinc-900">My goals</div>
          <div className="flex items-center gap-2">
            <Link className="h-10 rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-900 hover:bg-amber-300 inline-flex items-center" href="/employee/goals">
              Edit goals
            </Link>
            <Link className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 inline-flex items-center" href="/employee/checkins">
              Quarterly check-in
            </Link>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="py-2 pr-2">Goal</th>
                <th className="py-2 pr-2">Weightage</th>
                <th className="py-2 pr-2">Target %</th>
                <th className="py-2 pr-2">Actual %</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Progress</th>
                <th className="py-2 pr-2">Comments</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.g.id} className="border-t border-zinc-100 align-top">
                  <td className="py-2 pr-2">
                    <div className="font-medium text-zinc-900">{r.g.title}</div>
                    <div className="text-xs text-zinc-500">{r.g.thrustArea}{r.g.isShared ? " • Shared" : ""}</div>
                  </td>
                  <td className="py-2 pr-2">{r.g.weightage}%</td>
                  <td className="py-2 pr-2">{r.g.target}</td>
                  <td className="py-2 pr-2">{r.actual}</td>
                  <td className="py-2 pr-2">{r.status}</td>
                  <td className="py-2 pr-2">{props.currentQuarter ? `${r.progress}%` : "—"}</td>
                  <td className="py-2 pr-2">{r.commentCount}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="py-6 text-sm text-zinc-600" colSpan={7}>
                    No goals yet. Create goals to get started.
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

function ManagerDashboard(props: { state: AppState; userId: string; currentQuarter: string | null }) {
  const employees = props.state.users
    .filter((u) => u.active && u.role === "employee" && u.managerId === props.userId)
    .slice()
    .sort((a, b) => a.email.localeCompare(b.email));
  const employeeIds = new Set(employees.map((e) => e.id));
  const sheets = props.state.goalSheets.filter((s) => s.cycleId === props.state.activeCycleId && employeeIds.has(s.employeeId));
  const pendingApprovals = sheets.filter((s) => s.status === "submitted").length;

  const rows = employees.map((e) => {
    const sheet = sheets.find((s) => s.employeeId === e.id) ?? null;
    const goals = sheet ? props.state.goals.filter((g) => g.sheetId === sheet.id) : [];
    const totalWeightage = goals.reduce((sum, g) => sum + (Number.isFinite(g.weightage) ? g.weightage : 0), 0);
    const weighted =
      props.currentQuarter && goals.length > 0
        ? goals.reduce(
            (acc, g) => {
              const ach = props.state.achievements.find((a) => a.goalId === g.id && a.quarter === props.currentQuarter) ?? null;
              if (!ach || !ach.actual.trim()) return acc;
              const progress = computeProgressPercent({ uomType: g.uomType, target: g.target, actual: ach.actual });
              return { sum: acc.sum + progress * g.weightage, w: acc.w + g.weightage };
            },
            { sum: 0, w: 0 },
          )
        : { sum: 0, w: 0 };
    const progress = weighted.w > 0 ? Math.round(weighted.sum / weighted.w) : 0;
    return {
      employee: e,
      sheetStatus: sheet?.status ?? "not started",
      goalsCount: goals.length,
      weightage: totalWeightage,
      progress,
    };
  });

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Team size" value={employees.length} hint="Direct reports" />
        <StatCard label="Pending approvals" value={pendingApprovals} hint="Submitted goal sheets" />
        <StatCard label="This quarter" value={props.currentQuarter ?? "—"} hint="Progress snapshot" />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-zinc-900">My team</div>
          <div className="flex items-center gap-2">
            <Link className="h-10 rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-900 hover:bg-amber-300 inline-flex items-center" href="/manager/reviews">
              Review goals
            </Link>
            <Link className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 inline-flex items-center" href="/manager/completion">
              Completion
            </Link>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="py-2 pr-2">Employee</th>
                <th className="py-2 pr-2">Sheet</th>
                <th className="py-2 pr-2">Goals</th>
                <th className="py-2 pr-2">Weightage</th>
                <th className="py-2 pr-2">Progress</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.employee.id} className="border-t border-zinc-100 align-top">
                  <td className="py-2 pr-2">
                    <div className="font-medium text-zinc-900">{r.employee.name}</div>
                    <div className="text-xs text-zinc-500">{r.employee.email}</div>
                  </td>
                  <td className="py-2 pr-2">
                    <span className={r.sheetStatus === "submitted" ? "font-semibold text-amber-700" : "text-zinc-900"}>
                      {r.sheetStatus}
                    </span>
                  </td>
                  <td className="py-2 pr-2">{r.goalsCount}</td>
                  <td className="py-2 pr-2">{r.weightage}%</td>
                  <td className="py-2 pr-2">{props.currentQuarter ? `${r.progress}%` : "—"}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="py-6 text-sm text-zinc-600" colSpan={5}>
                    No employees assigned to you yet. Ask Admin to set employees’ manager to your user.
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

function AdminDashboard(props: { state: AppState; currentQuarter: string | null }) {
  const activeUsers = props.state.users.filter((u) => u.active);
  const employees = activeUsers.filter((u) => u.role === "employee").length;
  const managers = activeUsers.filter((u) => u.role === "manager").length;
  const submittedSheets = props.state.goalSheets.filter((s) => s.cycleId === props.state.activeCycleId && s.status === "submitted").length;
  const audits = props.state.audit.length;
  const comments = props.state.goalComments.length;

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Employees" value={employees} hint="Active employees" />
        <StatCard label="Managers" value={managers} hint="Active managers" />
        <StatCard label="Pending approvals" value={submittedSheets} hint="Submitted sheets" />
        <StatCard label="Audit + comments" value={audits + comments} hint="Activity volume" />
      </div>
    </div>
  );
}

function StatCard(props: { label: string; value: string | number; hint: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-semibold text-zinc-900">{props.label}</div>
      <div className="mt-2 text-3xl font-semibold text-zinc-900">{props.value}</div>
      <div className="mt-1 text-xs text-zinc-500">{props.hint}</div>
    </div>
  );
}

function NotificationsCard(props: { items: Array<{ id: string; at: string; title: string; href: string }>; unread: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-zinc-900">Notifications</div>
        <Link className="text-xs font-semibold text-amber-700 hover:text-amber-800" href="/notifications">
          View all
        </Link>
      </div>
      <div className="mt-4 space-y-3">
        {props.items.map((i) => (
          <Link key={i.id} href={i.href} className="block rounded-xl border border-zinc-200 bg-zinc-50 p-3 hover:border-zinc-300">
            <div className="text-sm font-semibold text-zinc-900">{i.title}</div>
            <div className="mt-1 text-xs text-zinc-500">{i.at.replace("T", " ").slice(0, 19)}</div>
          </Link>
        ))}
        {props.items.length === 0 ? <div className="text-sm text-zinc-600">No notifications yet.</div> : null}
        {props.unread > 0 ? <div className="text-xs text-zinc-500">Unread: {props.unread}</div> : null}
      </div>
    </div>
  );
}
