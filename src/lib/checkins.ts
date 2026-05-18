import { appendAudit } from "@/lib/audit";
import { canCheckin, getActiveCycle } from "@/lib/cycle";
import { newId, nowIso } from "@/lib/id";
import { getState, updateState } from "@/lib/state";
import { type Achievement, type GoalStatus, type ManagerCheckin, type Quarter } from "@/lib/types";

export function upsertAchievement(params: {
  actorId: string;
  goalId: string;
  quarter: Quarter;
  actual: string;
  status: GoalStatus;
}) {
  const state = getState();
  const cycle = getActiveCycle();
  if (!canCheckin(new Date(), cycle, params.quarter)) {
    return { ok: false as const, error: "Check-in window is not open yet" };
  }

  const trimmedActual = params.actual.trim();
  if (trimmedActual) {
    const n = Number(trimmedActual);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      return { ok: false as const, error: "Actual must be a % between 0 and 100" };
    }
  }

  const goal = state.goals.find((g) => g.id === params.goalId);
  if (!goal) return { ok: false as const, error: "Goal not found" };

  const sheet = state.goalSheets.find((s) => s.id === goal.sheetId);
  if (!sheet) return { ok: false as const, error: "Goal sheet not found" };

  const actor = state.users.find((u) => u.id === params.actorId);
  if (!actor) return { ok: false as const, error: "Actor not found" };

  if (actor.role === "employee" && sheet.employeeId !== actor.id) {
    return { ok: false as const, error: "Not allowed" };
  }

  if (goal.isShared && goal.primaryOwnerId && params.actorId !== goal.primaryOwnerId) {
    return { ok: false as const, error: "Only the primary owner can update achievement" };
  }

  const existing = state.achievements.find(
    (a) => a.goalId === goal.id && a.quarter === params.quarter,
  );

  const updatedAt = nowIso();
  const next: Achievement = existing
    ? { ...existing, actual: params.actual, status: params.status, updatedAt, updatedById: actor.id }
    : {
        id: newId(),
        goalId: goal.id,
        quarter: params.quarter,
        actual: params.actual,
        status: params.status,
        updatedAt,
        updatedById: actor.id,
      };

  const isUpdate = Boolean(existing);
  updateState((prev) => ({
    ...prev,
    achievements: isUpdate
      ? prev.achievements.map((a) => (a.id === next.id ? next : a))
      : [...prev.achievements, next],
  }));

  appendAudit({
    entity: "achievement",
    entityId: next.id,
    action: isUpdate ? "update" : "create",
    actorId: actor.id,
    meta: { goalId: goal.id, quarter: params.quarter },
  });

  if (goal.isShared && goal.sharedGroupId) {
    syncSharedAchievement({
      actorId: actor.id,
      sharedGroupId: goal.sharedGroupId,
      quarter: params.quarter,
      actual: params.actual,
      status: params.status,
    });
  }

  return { ok: true as const, achievement: next };
}

function syncSharedAchievement(params: {
  actorId: string;
  sharedGroupId: string;
  quarter: Quarter;
  actual: string;
  status: GoalStatus;
}) {
  const state = getState();
  const goals = state.goals.filter((g) => g.isShared && g.sharedGroupId === params.sharedGroupId);
  if (goals.length === 0) return;

  updateState((prev) => {
    const nextAchievements = [...prev.achievements];
    for (const goal of goals) {
      const existing = nextAchievements.find((a) => a.goalId === goal.id && a.quarter === params.quarter);
      const updatedAt = nowIso();
      if (existing) {
        existing.actual = params.actual;
        existing.status = params.status;
        existing.updatedAt = updatedAt;
        existing.updatedById = params.actorId;
      } else {
        nextAchievements.push({
          id: newId(),
          goalId: goal.id,
          quarter: params.quarter,
          actual: params.actual,
          status: params.status,
          updatedAt,
          updatedById: params.actorId,
        });
      }
    }
    return { ...prev, achievements: nextAchievements };
  });
}

export function upsertManagerCheckin(params: {
  actorId: string;
  employeeId: string;
  quarter: Quarter;
  comment: string;
}) {
  const state = getState();
  const actor = state.users.find((u) => u.id === params.actorId);
  if (!actor || actor.role === "employee") return { ok: false as const, error: "Not allowed" };

  const cycleId = state.activeCycleId;
  const existing = state.checkins.find(
    (c) => c.employeeId === params.employeeId && c.cycleId === cycleId && c.quarter === params.quarter,
  );

  const updatedAt = nowIso();
  const next: ManagerCheckin = existing
    ? { ...existing, comment: params.comment, updatedAt }
    : {
        id: newId(),
        employeeId: params.employeeId,
        cycleId,
        quarter: params.quarter,
        managerId: actor.id,
        comment: params.comment,
        createdAt: updatedAt,
        updatedAt,
      };

  const isUpdate = Boolean(existing);
  updateState((prev) => ({
    ...prev,
    checkins: isUpdate ? prev.checkins.map((c) => (c.id === next.id ? next : c)) : [...prev.checkins, next],
  }));

  appendAudit({
    entity: "checkin",
    entityId: next.id,
    action: isUpdate ? "update" : "create",
    actorId: actor.id,
    meta: { employeeId: params.employeeId, quarter: params.quarter },
  });

  return { ok: true as const, checkin: next };
}

export function getAchievement(goalId: string, quarter: Quarter) {
  const state = getState();
  return state.achievements.find((a) => a.goalId === goalId && a.quarter === quarter) ?? null;
}
