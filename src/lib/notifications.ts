import { type AppState, type AuditLog, type Role } from "@/lib/types";

export type NotificationItem = {
  id: string;
  at: string;
  title: string;
  href: string;
};

const LAST_SEEN_PREFIX = "atomquest.notifications.lastSeen.";

export function getLastSeenAt(userId: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_SEEN_PREFIX + userId);
}

export function setLastSeenAt(userId: string, iso: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_SEEN_PREFIX + userId, iso);
}

export function markAllReadNow(userId: string) {
  setLastSeenAt(userId, new Date().toISOString());
}

function auditAt(a: AuditLog) {
  return a.at;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((x) => typeof x === "string") as string[];
}

export function buildNotifications(state: AppState, userId: string, role: Role): NotificationItem[] {
  const cycleId = state.activeCycleId;
  const mySheetIds = state.goalSheets
    .filter((s) => s.cycleId === cycleId && s.employeeId === userId)
    .map((s) => s.id);
  const myGoalIds = new Set(state.goals.filter((g) => mySheetIds.includes(g.sheetId)).map((g) => g.id));

  const teamEmployeeIds =
    role === "manager"
      ? new Set(state.users.filter((u) => u.active && u.role === "employee" && u.managerId === userId).map((u) => u.id))
      : new Set<string>();
  const teamSheetIds =
    role === "manager"
      ? new Set(state.goalSheets.filter((s) => s.cycleId === cycleId && teamEmployeeIds.has(s.employeeId)).map((s) => s.id))
      : new Set<string>();
  const teamGoalIds =
    role === "manager"
      ? new Set(state.goals.filter((g) => teamSheetIds.has(g.sheetId)).map((g) => g.id))
      : new Set<string>();

  const items: NotificationItem[] = [];

  for (const a of state.audit) {
    if (role === "employee") {
      if (a.entity === "goalSheet" && mySheetIds.includes(a.entityId) && (a.action === "approve" || a.action === "return" || a.action === "unlock")) {
        items.push({
          id: a.id,
          at: auditAt(a),
          title: a.action === "approve" ? "Manager approved your goals" : a.action === "return" ? "Manager returned your goals for rework" : "Admin unlocked your goals",
          href: "/employee/goals",
        });
      }
      if (a.entity === "sharedGoalGroup" && a.action === "create") {
        const recipients = asStringArray(a.meta?.recipientEmployeeIds);
        const ownerId = typeof a.meta?.primaryOwnerId === "string" ? (a.meta.primaryOwnerId as string) : null;
        if (recipients.includes(userId) || ownerId === userId) {
          items.push({
            id: a.id,
            at: auditAt(a),
            title: `Shared KPI assigned: ${String(a.meta?.title ?? "New shared goal")}`,
            href: "/employee/goals",
          });
        }
      }
      if (a.entity === "goalComment" && a.action === "create") {
        const goalId = typeof a.meta?.goalId === "string" ? (a.meta.goalId as string) : null;
        if (goalId && myGoalIds.has(goalId) && a.actorId !== userId) {
          items.push({
            id: a.id,
            at: auditAt(a),
            title: "New comment on your goal",
            href: "/employee/goals",
          });
        }
      }
    }

    if (role === "manager") {
      if (a.entity === "goalSheet" && a.action === "submit" && teamSheetIds.has(a.entityId)) {
        items.push({
          id: a.id,
          at: auditAt(a),
          title: "New goal sheet submitted for approval",
          href: "/manager/reviews",
        });
      }
      if (a.entity === "goalComment" && a.action === "create") {
        const goalId = typeof a.meta?.goalId === "string" ? (a.meta.goalId as string) : null;
        if (goalId && teamGoalIds.has(goalId) && a.actorId !== userId) {
          items.push({
            id: a.id,
            at: auditAt(a),
            title: "New comment from employee",
            href: "/manager/reviews",
          });
        }
      }
    }

    if (role === "admin") {
      if (a.entity === "goalSheet" && (a.action === "submit" || a.action === "approve" || a.action === "return")) {
        items.push({
          id: a.id,
          at: auditAt(a),
          title: `Goal sheet ${a.action}`,
          href: "/admin/audit",
        });
      }
    }
  }

  items.sort((x, y) => y.at.localeCompare(x.at));
  return items.slice(0, 50);
}

export function countUnread(items: NotificationItem[], lastSeenAt: string | null) {
  if (!lastSeenAt) return items.length;
  return items.filter((i) => i.at > lastSeenAt).length;
}

