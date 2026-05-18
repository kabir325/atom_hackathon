import { computeProgressPercent } from "@/lib/progress";
import { getState } from "@/lib/state";
import { type Quarter } from "@/lib/types";

export function buildAchievementReportRows(quarter: Quarter) {
  const state = getState();
  const cycleId = state.activeCycleId;

  const rows: Record<string, unknown>[] = [];

  for (const sheet of state.goalSheets.filter((s) => s.cycleId === cycleId)) {
    const employee = state.users.find((u) => u.id === sheet.employeeId);
    const manager = state.users.find((u) => u.id === sheet.managerId);
    const goals = state.goals.filter((g) => g.sheetId === sheet.id);

    for (const goal of goals) {
      const ach = state.achievements.find((a) => a.goalId === goal.id && a.quarter === quarter);
      const actual = ach?.actual ?? "";
      const progress = actual ? computeProgressPercent({ uomType: goal.uomType, target: goal.target, actual }) : 0;

      rows.push({
        cycle: state.cycles.find((c) => c.id === cycleId)?.label ?? cycleId,
        quarter,
        employeeEmail: employee?.email ?? "",
        employeeName: employee?.name ?? "",
        managerEmail: manager?.email ?? "",
        thrustArea: goal.thrustArea,
        goalTitle: goal.title,
        uomType: goal.uomType,
        target: goal.target,
        weightage: goal.weightage,
        actual,
        status: ach?.status ?? "",
        progressPercent: Math.round(progress),
        isShared: goal.isShared ? "yes" : "no",
      });
    }
  }

  return rows;
}

export function buildCompletionDashboardRows(quarter: Quarter) {
  const state = getState();
  const cycleId = state.activeCycleId;

  const rows: Record<string, unknown>[] = [];
  const cycleLabel = state.cycles.find((c) => c.id === cycleId)?.label ?? cycleId;

  for (const user of state.users.filter((u) => u.active && u.role === "employee")) {
    const sheet = state.goalSheets.find((s) => s.employeeId === user.id && s.cycleId === cycleId);
    const goals = sheet ? state.goals.filter((g) => g.sheetId === sheet.id) : [];
    const hasAnyAchievement = goals.some((g) =>
      state.achievements.some((a) => a.goalId === g.id && a.quarter === quarter && a.actual.trim() !== ""),
    );
    const managerComment = state.checkins.find(
      (c) => c.employeeId === user.id && c.cycleId === cycleId && c.quarter === quarter,
    );

    rows.push({
      cycle: cycleLabel,
      quarter,
      employeeEmail: user.email,
      employeeName: user.name,
      managerEmail: sheet ? state.users.find((m) => m.id === sheet.managerId)?.email ?? "" : "",
      goalsStatus: sheet?.status ?? "not_started",
      employeeUpdated: hasAnyAchievement ? "yes" : "no",
      managerCheckinDone: managerComment?.comment.trim() ? "yes" : "no",
    });
  }

  return rows;
}

