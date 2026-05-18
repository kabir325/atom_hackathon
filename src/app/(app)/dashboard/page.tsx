"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import { getActiveCycle, getCurrentQuarter } from "@/lib/cycle";
import { computeProgressPercent } from "@/lib/progress";

export default function DashboardPage() {
  const { user } = useAuth();
  const { state } = useAppState();

  if (!user) return null;
  const cycle = getActiveCycle();
  const currentQuarter = getCurrentQuarter(cycle, new Date());

  const activeUsers = state.users.filter((u) => u.active);
  const employees = activeUsers.filter((u) => u.role === "employee");
  const managers = activeUsers.filter((u) => u.role === "manager");

  const cycleSheets = state.goalSheets.filter((s) => s.cycleId === state.activeCycleId);
  const draftSheets = cycleSheets.filter((s) => s.status === "draft").length;
  const submittedSheets = cycleSheets.filter((s) => s.status === "submitted").length;
  const approvedSheets = cycleSheets.filter((s) => s.status === "approved").length;
  const returnedSheets = cycleSheets.filter((s) => s.status === "returned").length;

  const mySheet =
    state.goalSheets.find((s) => s.employeeId === user.id && s.cycleId === state.activeCycleId) ??
    null;
  const myGoals = mySheet ? state.goals.filter((g) => g.sheetId === mySheet.id) : [];
  const myTotalWeightage = myGoals.reduce((sum, g) => sum + (Number.isFinite(g.weightage) ? g.weightage : 0), 0);

  const myQuarterAchievementsCount =
    mySheet && currentQuarter
      ? myGoals.filter((g) =>
          state.achievements.some(
            (a) => a.goalId === g.id && a.quarter === currentQuarter && a.actual.trim() !== "",
          ),
        ).length
      : 0;

  const myQuarterProgressAvg =
    mySheet && currentQuarter && myGoals.length > 0
      ? Math.round(
          myGoals.reduce((sum, g) => {
            const a =
              state.achievements.find((x) => x.goalId === g.id && x.quarter === currentQuarter) ?? null;
            if (!a || !a.actual.trim()) return sum;
            return sum + computeProgressPercent({ uomType: g.uomType, target: g.target, actual: a.actual });
          }, 0) / myGoals.length,
        )
      : 0;

  const teamEmployees =
    user.role === "manager"
      ? employees.filter((e) => e.managerId === user.id)
      : [];
  const teamEmployeeIds = new Set(teamEmployees.map((e) => e.id));
  const teamSheets =
    user.role === "manager"
      ? cycleSheets.filter((s) => teamEmployeeIds.has(s.employeeId))
      : [];
  const teamPendingApprovals = teamSheets.filter((s) => s.status === "submitted").length;
  const teamApproved = teamSheets.filter((s) => s.status === "approved").length;

  const managerQuarterCheckinsDone =
    user.role === "manager" && currentQuarter
      ? teamEmployees.filter((e) =>
          state.checkins.some(
            (c) =>
              c.employeeId === e.id &&
              c.cycleId === state.activeCycleId &&
              c.quarter === currentQuarter &&
              c.comment.trim() !== "",
          ),
        ).length
      : 0;

  const myManagerCheckinDone =
    user.role === "employee" && currentQuarter
      ? state.checkins.some(
          (c) =>
            c.employeeId === user.id &&
            c.cycleId === state.activeCycleId &&
            c.quarter === currentQuarter &&
            c.comment.trim() !== "",
        )
      : false;

  const auditCount = state.audit.length;
  const sharedGroupsCount = state.sharedGoalGroups.length;
  const goalsCount = state.goals.length;
  const achievementsCount = state.achievements.length;
  const checkinsCount = state.checkins.length;

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
            {user.role === "admin" ? (
              <Link className="h-10 rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-900 hover:bg-amber-300 inline-flex items-center" href="/admin/users">
                Manage users
              </Link>
            ) : user.role === "manager" ? (
              <Link className="h-10 rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-900 hover:bg-amber-300 inline-flex items-center" href="/manager/reviews">
                Review goals
              </Link>
            ) : (
              <Link className="h-10 rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-900 hover:bg-amber-300 inline-flex items-center" href="/employee/goals">
                Update goals
              </Link>
            )}
            <Link className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 inline-flex items-center" href="/settings">
              Settings
            </Link>
          </div>
        </div>
      </div>

      {user.role === "admin" ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Employees" value={employees.length} hint="Active employees" />
            <StatCard label="Managers" value={managers.length} hint="Active managers" />
            <StatCard label="Audit entries" value={auditCount} hint="Tracked changes" />
            <StatCard label="Shared goal groups" value={sharedGroupsCount} hint="Pushed KPIs" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-zinc-900">Cycle snapshot</div>
                <div className="text-xs text-zinc-500">{cycle.label}</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <MiniStat label="Draft" value={draftSheets} />
                <MiniStat label="Submitted" value={submittedSheets} />
                <MiniStat label="Approved" value={approvedSheets} />
                <MiniStat label="Returned" value={returnedSheets} />
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <MiniStat label="Goals" value={goalsCount} />
                <MiniStat label="Achievements" value={achievementsCount} />
                <MiniStat label="Manager check-ins" value={checkinsCount} />
              </div>
            </div>

            <RecentActivity items={state.audit.slice(0, 6).map((a) => ({
              id: a.id,
              primary: `${a.entity} • ${a.action}`,
              secondary: a.at.replace("T", " ").slice(0, 19),
            }))} />
          </div>
        </>
      ) : user.role === "manager" ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Team size" value={teamEmployees.length} hint="Direct reports" />
            <StatCard label="Pending approvals" value={teamPendingApprovals} hint="Submitted goal sheets" />
            <StatCard label="Approved sheets" value={teamApproved} hint="Locked sheets" />
            <StatCard
              label="Check-ins done"
              value={currentQuarter ? managerQuarterCheckinsDone : 0}
              hint={currentQuarter ? `${currentQuarter} comments saved` : "No active quarter yet"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="text-sm font-semibold text-zinc-900">Team completion (this cycle)</div>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <MiniStat label="Draft" value={teamSheets.filter((s) => s.status === "draft").length} />
                <MiniStat label="Submitted" value={teamSheets.filter((s) => s.status === "submitted").length} />
                <MiniStat label="Approved" value={teamSheets.filter((s) => s.status === "approved").length} />
                <MiniStat label="Returned" value={teamSheets.filter((s) => s.status === "returned").length} />
              </div>
              <div className="mt-4 text-xs text-zinc-500">
                Tip: set managers for employees in Admin → Users to populate your team automatically.
              </div>
            </div>

            <RecentActivity items={state.audit.slice(0, 6).map((a) => ({
              id: a.id,
              primary: `${a.entity} • ${a.action}`,
              secondary: a.at.replace("T", " ").slice(0, 19),
            }))} />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="My goals" value={myGoals.length} hint="Max 8 goals" />
            <StatCard label="Weightage total" value={`${myTotalWeightage}%`} hint="Must equal 100%" />
            <StatCard label="Sheet status" value={mySheet?.status ?? "not started"} hint={mySheet?.lockedAt ? "Locked" : "Editable"} />
            <StatCard
              label="This quarter"
              value={currentQuarter ? `${myQuarterAchievementsCount}/${myGoals.length}` : "—"}
              hint={currentQuarter ? "Goals updated with actuals" : "No active quarter yet"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-zinc-900">My progress</div>
                <div className="text-xs text-zinc-500">{currentQuarter ?? "—"}</div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <MiniStat label="Avg progress" value={currentQuarter ? `${myQuarterProgressAvg}%` : "—"} />
                <MiniStat label="Shared goals" value={myGoals.filter((g) => g.isShared).length} />
                <MiniStat label="Manager check-in" value={currentQuarter ? (myManagerCheckinDone ? "Done" : "Pending") : "—"} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link className="h-10 rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-900 hover:bg-amber-300 inline-flex items-center" href="/employee/checkins">
                  Update quarterly actuals
                </Link>
                <Link className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 inline-flex items-center" href="/employee/goals">
                  Edit / submit goals
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-zinc-900">What to do next</div>
              <div className="mt-3 space-y-2 text-sm text-zinc-700">
                <div>1) Add goals so weightage totals 100%</div>
                <div>2) Submit for manager approval</div>
                <div>3) Update quarterly actuals when the window opens</div>
              </div>
            </div>
          </div>
        </>
      )}
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

function MiniStat(props: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="text-xs font-semibold text-zinc-500">{props.label.toUpperCase()}</div>
      <div className="mt-1 text-lg font-semibold text-zinc-900">{props.value}</div>
    </div>
  );
}

function RecentActivity(props: { items: Array<{ id: string; primary: string; secondary: string }> }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-zinc-900">Recent activity</div>
        <Link className="text-xs font-semibold text-amber-700 hover:text-amber-800" href="/admin/audit">
          View all
        </Link>
      </div>
      <div className="mt-4 space-y-3">
        {props.items.map((i) => (
          <div key={i.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-sm font-semibold text-zinc-900">{i.primary}</div>
            <div className="mt-1 text-xs text-zinc-500">{i.secondary}</div>
          </div>
        ))}
        {props.items.length === 0 ? <div className="text-sm text-zinc-600">No activity yet.</div> : null}
      </div>
    </div>
  );
}
