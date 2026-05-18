import { appendAudit } from "@/lib/audit";
import { canGoalSetting, getActiveCycle } from "@/lib/cycle";
import { newId, nowIso } from "@/lib/id";
import { getState, updateState } from "@/lib/state";
import {
  type Goal,
  type GoalSheet,
  type GoalSheetStatus,
  type SharedGoalGroup,
  type ThrustArea,
  type UomType,
} from "@/lib/types";

export function getOrCreateMySheet(employeeId: string) {
  const state = getState();
  const cycleId = state.activeCycleId;
  const existing = state.goalSheets.find((s) => s.employeeId === employeeId && s.cycleId === cycleId);
  if (existing) return existing;

  const employee = state.users.find((u) => u.id === employeeId);
  if (!employee) throw new Error("Employee not found");
  const managerId =
    employee.managerId ??
    state.users.find((u) => u.role === "manager" && u.active)?.id ??
    state.users.find((u) => u.role === "admin" && u.active)?.id ??
    employeeId;

  const sheet: GoalSheet = {
    id: newId(),
    employeeId,
    managerId,
    cycleId,
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  updateState((prev) => ({ ...prev, goalSheets: [...prev.goalSheets, sheet] }));
  return sheet;
}

export function getGoalsForSheet(sheetId: string) {
  const state = getState();
  return state.goals.filter((g) => g.sheetId === sheetId);
}

export function validateGoals(goals: Goal[]) {
  const errors: string[] = [];
  if (goals.length === 0) errors.push("Add at least 1 goal");
  if (goals.length > 8) errors.push("Maximum 8 goals allowed");

  const total = goals.reduce((sum, g) => sum + (Number.isFinite(g.weightage) ? g.weightage : 0), 0);
  if (total !== 100) errors.push("Total weightage must equal 100%");

  const minViolations = goals.filter((g) => g.weightage < 10);
  if (minViolations.length > 0) errors.push("Each goal must have at least 10% weightage");

  const emptyTitles = goals.filter((g) => !g.title.trim());
  if (emptyTitles.length > 0) errors.push("Each goal must have a title");

  const emptyTargets = goals.filter((g) => !g.target.trim());
  if (emptyTargets.length > 0) errors.push("Each goal must have a target");

  return { ok: errors.length === 0, errors };
}

function ensureEditable(sheet: GoalSheet, actorId: string) {
  const state = getState();
  const actor = state.users.find((u) => u.id === actorId);
  if (!actor) return { ok: false as const, error: "Actor not found" };

  if (sheet.lockedAt) {
    if (actor.role !== "admin") return { ok: false as const, error: "Goals are locked" };
  }

  if (sheet.status === "submitted") {
    if (actor.role !== "manager" && actor.role !== "admin") {
      return { ok: false as const, error: "Submitted sheet can only be edited by manager/admin" };
    }
  }

  if (sheet.status === "approved" && !sheet.lockedAt) {
    if (actor.role !== "admin") return { ok: false as const, error: "Only admin can edit" };
  }

  return { ok: true as const, actor };
}

export function addGoal(params: {
  actorId: string;
  sheetId: string;
  thrustArea: ThrustArea;
  title: string;
  description: string;
  uomType: UomType;
  target: string;
  weightage: number;
}) {
  const state = getState();
  const sheet = state.goalSheets.find((s) => s.id === params.sheetId);
  if (!sheet) return { ok: false as const, error: "Goal sheet not found" };

  const guard = ensureEditable(sheet, params.actorId);
  if (!guard.ok) return guard;

  const existing = state.goals.filter((g) => g.sheetId === sheet.id);
  if (existing.length >= 8) return { ok: false as const, error: "Maximum 8 goals allowed" };

  const goal: Goal = {
    id: newId(),
    sheetId: sheet.id,
    thrustArea: params.thrustArea,
    title: params.title,
    description: params.description,
    uomType: params.uomType,
    target: params.target,
    weightage: params.weightage,
    isShared: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  updateState((prev) => ({
    ...prev,
    goals: [...prev.goals, goal],
    goalSheets: prev.goalSheets.map((s) => (s.id === sheet.id ? { ...s, updatedAt: nowIso() } : s)),
  }));

  appendAudit({
    entity: "goal",
    entityId: goal.id,
    action: "create",
    actorId: params.actorId,
    meta: { sheetId: sheet.id },
  });

  return { ok: true as const, goal };
}

export function updateGoal(params: {
  actorId: string;
  goalId: string;
  patch: Partial<Pick<Goal, "thrustArea" | "title" | "description" | "uomType" | "target" | "weightage">>;
}) {
  const state = getState();
  const goal = state.goals.find((g) => g.id === params.goalId);
  if (!goal) return { ok: false as const, error: "Goal not found" };
  const sheet = state.goalSheets.find((s) => s.id === goal.sheetId);
  if (!sheet) return { ok: false as const, error: "Goal sheet not found" };

  const guard = ensureEditable(sheet, params.actorId);
  if (!guard.ok) return guard;

  if (goal.isShared) {
    const actor = guard.actor;
    if (actor.role === "employee") {
      const patchKeys = Object.keys(params.patch);
      const nonWeightage = patchKeys.filter((k) => k !== "weightage");
      if (nonWeightage.length > 0) {
        return { ok: false as const, error: "Shared goal fields are read-only" };
      }
    }
  }

  const updated: Goal = { ...goal, ...params.patch, updatedAt: nowIso() };

  updateState((prev) => ({
    ...prev,
    goals: prev.goals.map((g) => (g.id === goal.id ? updated : g)),
    goalSheets: prev.goalSheets.map((s) => (s.id === sheet.id ? { ...s, updatedAt: nowIso() } : s)),
  }));

  appendAudit({
    entity: "goal",
    entityId: goal.id,
    action: "update",
    actorId: params.actorId,
    changes: Object.entries(params.patch).map(([field, to]) => ({
      field,
      from: (goal as Record<string, unknown>)[field],
      to,
    })),
    meta: sheet.lockedAt ? { lockedAt: sheet.lockedAt } : undefined,
  });

  return { ok: true as const, goal: updated };
}

export function deleteGoal(params: { actorId: string; goalId: string }) {
  const state = getState();
  const goal = state.goals.find((g) => g.id === params.goalId);
  if (!goal) return { ok: false as const, error: "Goal not found" };
  const sheet = state.goalSheets.find((s) => s.id === goal.sheetId);
  if (!sheet) return { ok: false as const, error: "Goal sheet not found" };

  const guard = ensureEditable(sheet, params.actorId);
  if (!guard.ok) return guard;

  updateState((prev) => ({
    ...prev,
    goals: prev.goals.filter((g) => g.id !== goal.id),
    achievements: prev.achievements.filter((a) => a.goalId !== goal.id),
    goalSheets: prev.goalSheets.map((s) => (s.id === sheet.id ? { ...s, updatedAt: nowIso() } : s)),
  }));

  appendAudit({
    entity: "goal",
    entityId: goal.id,
    action: "delete",
    actorId: params.actorId,
    meta: { sheetId: sheet.id },
  });

  return { ok: true as const };
}

export function submitGoalSheet(params: { actorId: string; sheetId: string }) {
  const state = getState();
  const sheet = state.goalSheets.find((s) => s.id === params.sheetId);
  if (!sheet) return { ok: false as const, error: "Goal sheet not found" };

  const cycle = getActiveCycle();
  if (!canGoalSetting(new Date(), cycle)) {
    return { ok: false as const, error: "Goal setting window is not open yet" };
  }

  if (sheet.employeeId !== params.actorId) return { ok: false as const, error: "Not allowed" };
  if (sheet.lockedAt) return { ok: false as const, error: "Goals are locked" };

  const goals = state.goals.filter((g) => g.sheetId === sheet.id);
  const validation = validateGoals(goals);
  if (!validation.ok) return { ok: false as const, error: validation.errors.join(". ") };

  const nextStatus: GoalSheetStatus = "submitted";
  updateState((prev) => ({
    ...prev,
    goalSheets: prev.goalSheets.map((s) =>
      s.id === sheet.id
        ? { ...s, status: nextStatus, submittedAt: nowIso(), updatedAt: nowIso() }
        : s,
    ),
  }));

  appendAudit({
    entity: "goalSheet",
    entityId: sheet.id,
    action: "submit",
    actorId: params.actorId,
    meta: { cycleId: sheet.cycleId },
  });

  return { ok: true as const };
}

export function returnGoalSheet(params: { actorId: string; sheetId: string }) {
  const state = getState();
  const sheet = state.goalSheets.find((s) => s.id === params.sheetId);
  if (!sheet) return { ok: false as const, error: "Goal sheet not found" };

  const actor = state.users.find((u) => u.id === params.actorId);
  if (!actor) return { ok: false as const, error: "Actor not found" };
  if (actor.role !== "manager" && actor.role !== "admin") {
    return { ok: false as const, error: "Not allowed" };
  }
  if (sheet.status !== "submitted") return { ok: false as const, error: "Sheet is not submitted" };

  updateState((prev) => ({
    ...prev,
    goalSheets: prev.goalSheets.map((s) =>
      s.id === sheet.id ? { ...s, status: "returned", returnedAt: nowIso(), updatedAt: nowIso() } : s,
    ),
  }));

  appendAudit({
    entity: "goalSheet",
    entityId: sheet.id,
    action: "return",
    actorId: params.actorId,
    meta: { cycleId: sheet.cycleId },
  });

  return { ok: true as const };
}

export function approveGoalSheet(params: { actorId: string; sheetId: string }) {
  const state = getState();
  const sheet = state.goalSheets.find((s) => s.id === params.sheetId);
  if (!sheet) return { ok: false as const, error: "Goal sheet not found" };

  const actor = state.users.find((u) => u.id === params.actorId);
  if (!actor) return { ok: false as const, error: "Actor not found" };
  if (actor.role !== "manager" && actor.role !== "admin") {
    return { ok: false as const, error: "Not allowed" };
  }
  if (sheet.status !== "submitted") return { ok: false as const, error: "Sheet is not submitted" };

  const goals = state.goals.filter((g) => g.sheetId === sheet.id);
  const validation = validateGoals(goals);
  if (!validation.ok) return { ok: false as const, error: validation.errors.join(". ") };

  updateState((prev) => ({
    ...prev,
    goalSheets: prev.goalSheets.map((s) =>
      s.id === sheet.id
        ? {
            ...s,
            status: "approved",
            approvedAt: nowIso(),
            lockedAt: nowIso(),
            updatedAt: nowIso(),
          }
        : s,
    ),
  }));

  appendAudit({
    entity: "goalSheet",
    entityId: sheet.id,
    action: "approve",
    actorId: params.actorId,
    meta: { lockedAt: nowIso(), cycleId: sheet.cycleId },
  });

  return { ok: true as const };
}

export function adminUnlockGoalSheet(params: { actorId: string; sheetId: string }) {
  const state = getState();
  const actor = state.users.find((u) => u.id === params.actorId);
  if (!actor || actor.role !== "admin") return { ok: false as const, error: "Not allowed" };

  const sheet = state.goalSheets.find((s) => s.id === params.sheetId);
  if (!sheet) return { ok: false as const, error: "Goal sheet not found" };

  updateState((prev) => ({
    ...prev,
    goalSheets: prev.goalSheets.map((s) =>
      s.id === sheet.id ? { ...s, lockedAt: undefined, updatedAt: nowIso() } : s,
    ),
  }));

  appendAudit({
    entity: "goalSheet",
    entityId: sheet.id,
    action: "unlock",
    actorId: params.actorId,
    meta: { previousLockedAt: sheet.lockedAt },
  });

  return { ok: true as const };
}

export function createSharedGoalGroup(params: {
  actorId: string;
  title: string;
  description: string;
  thrustArea: ThrustArea;
  uomType: UomType;
  target: string;
  primaryOwnerId: string;
  recipientEmployeeIds: string[];
}) {
  const state = getState();
  const actor = state.users.find((u) => u.id === params.actorId);
  if (!actor) return { ok: false as const, error: "Actor not found" };
  if (actor.role !== "admin" && actor.role !== "manager") {
    return { ok: false as const, error: "Not allowed" };
  }

  const primaryOwner = state.users.find((u) => u.id === params.primaryOwnerId);
  if (!primaryOwner || primaryOwner.role !== "employee" || !primaryOwner.active) {
    return { ok: false as const, error: "Primary owner must be an active employee" };
  }

  if (!params.title.trim()) return { ok: false as const, error: "Title is required" };
  if (!params.target.trim()) return { ok: false as const, error: "Target is required" };
  if (params.recipientEmployeeIds.length === 0) {
    return { ok: false as const, error: "Select at least 1 recipient" };
  }

  const group: SharedGoalGroup = {
    id: newId(),
    createdById: params.actorId,
    createdAt: nowIso(),
    title: params.title,
    description: params.description,
    thrustArea: params.thrustArea,
    uomType: params.uomType,
    target: params.target,
    primaryOwnerId: params.primaryOwnerId,
    recipientEmployeeIds: params.recipientEmployeeIds,
  };

  const cycleId = state.activeCycleId;
  const allEmployeeIds = Array.from(
    new Set([params.primaryOwnerId, ...params.recipientEmployeeIds]),
  );
  const ensuredSheets = allEmployeeIds.map((empId) => getOrCreateMySheet(empId));

  const goalsToCreate: Goal[] = ensuredSheets.map((sheet) => ({
    id: newId(),
    sheetId: sheet.id,
    thrustArea: group.thrustArea,
    title: group.title,
    description: group.description,
    uomType: group.uomType,
    target: group.target,
    weightage: 10,
    isShared: true,
    sharedGroupId: group.id,
    primaryOwnerId: group.primaryOwnerId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }));

  updateState((prev) => ({
    ...prev,
    sharedGoalGroups: [...prev.sharedGoalGroups, group],
    goals: [...prev.goals, ...goalsToCreate],
    goalSheets: prev.goalSheets.map((s) =>
      ensuredSheets.some((x) => x.id === s.id)
        ? { ...s, cycleId: cycleId, updatedAt: nowIso() }
        : s,
    ),
  }));

  appendAudit({
    entity: "sharedGoalGroup",
    entityId: group.id,
    action: "create",
    actorId: params.actorId,
    meta: { employeeCount: allEmployeeIds.length },
  });

  return { ok: true as const, group };
}

export function getTeamSheetsForManager(managerId: string) {
  const state = getState();
  const cycleId = state.activeCycleId;
  return state.goalSheets.filter((s) => s.cycleId === cycleId && s.managerId === managerId);
}

export function getSheetById(sheetId: string) {
  const state = getState();
  return state.goalSheets.find((s) => s.id === sheetId) ?? null;
}
