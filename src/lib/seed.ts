import { newId, nowIso } from "@/lib/id";
import { randomSaltBase64, hashPassword } from "@/lib/password";
import { loadState, saveState } from "@/lib/storage";
import {
  type AppState,
  type Cycle,
  type CycleWindows,
  type Goal,
  type GoalSheet,
  type ManagerCheckin,
  type User,
} from "@/lib/types";

function defaultWindowsForToday(): CycleWindows {
  const today = new Date();
  const year = today.getUTCFullYear();
  const nextYear = year + 1;

  const d = (y: number, m: number, day: number) =>
    new Date(Date.UTC(y, m - 1, day, 0, 0, 0)).toISOString();

  return {
    goalSettingOpen: d(year, 5, 1),
    q1Open: d(year, 7, 1),
    q2Open: d(year, 10, 1),
    q3Open: d(nextYear, 1, 1),
    q4Open: d(nextYear, 3, 1),
  };
}

function defaultCycleLabel(windows: CycleWindows) {
  const y1 = new Date(windows.goalSettingOpen).getUTCFullYear();
  const y2 = new Date(windows.q4Open).getUTCFullYear();
  return `Cycle ${y1}-${y2}`;
}

export async function ensureSeeded() {
  if (typeof window === "undefined") return;
  const existing = loadState();
  if (existing?.version === 1) return;

  const adminId = newId();
  const salt = randomSaltBase64();
  const passwordHash = await hashPassword("Admin@123", salt);

  const admin: User = {
    id: adminId,
    email: "admin@atomquest.local",
    name: "Atomberg Admin",
    role: "admin",
    active: true,
    passwordSalt: salt,
    passwordHash,
    createdAt: nowIso(),
  };

  const managerId = newId();
  const managerSalt = randomSaltBase64();
  const managerHash = await hashPassword("Welcome@123", managerSalt);
  const manager: User = {
    id: managerId,
    email: "manager@atomquest.local",
    name: "Rahul (Manager)",
    role: "manager",
    active: true,
    passwordSalt: managerSalt,
    passwordHash: managerHash,
    createdAt: nowIso(),
  };

  const employeeIds = [newId(), newId(), newId()];
  const employeeEmails = ["priya@atomquest.local", "arjun@atomquest.local", "neha@atomquest.local"];
  const employeeNames = ["Priya (Employee)", "Arjun (Employee)", "Neha (Employee)"];
  const employeeUsers: User[] = [];
  for (let i = 0; i < employeeIds.length; i++) {
    const s = randomSaltBase64();
    const h = await hashPassword("Welcome@123", s);
    employeeUsers.push({
      id: employeeIds[i],
      email: employeeEmails[i],
      name: employeeNames[i],
      role: "employee",
      managerId,
      active: true,
      passwordSalt: s,
      passwordHash: h,
      createdAt: nowIso(),
    });
  }

  const cycle: Cycle = {
    id: newId(),
    label: defaultCycleLabel(defaultWindowsForToday()),
    windows: defaultWindowsForToday(),
    createdAt: nowIso(),
  };

  const sheets: GoalSheet[] = employeeUsers.map((e, idx) => ({
    id: newId(),
    employeeId: e.id,
    managerId,
    cycleId: cycle.id,
    status: idx === 0 ? "approved" : idx === 1 ? "submitted" : "draft",
    lockedAt: idx === 0 ? nowIso() : undefined,
    submittedAt: idx === 0 || idx === 1 ? nowIso() : undefined,
    approvedAt: idx === 0 ? nowIso() : undefined,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }));

  const goals: Goal[] = [];
  const add = (sheetId: string, g: Omit<Goal, "id" | "sheetId" | "createdAt" | "updatedAt">) => {
    goals.push({
      id: newId(),
      sheetId,
      ...g,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  };

  add(sheets[0].id, {
    thrustArea: "Growth",
    title: "Increase modern trade sell-through",
    description: "Improve sell-through in top 20 modern trade stores via merchandising and promoter coverage.",
    uomType: "min",
    target: "120",
    weightage: 30,
    isShared: false,
  });
  add(sheets[0].id, {
    thrustArea: "Operational Excellence",
    title: "Reduce service turnaround time (TAT)",
    description: "Reduce average TAT for service requests by process improvements and better routing.",
    uomType: "max",
    target: "72",
    weightage: 20,
    isShared: false,
  });
  add(sheets[0].id, {
    thrustArea: "Customer",
    title: "Improve NPS",
    description: "Drive improvements in customer experience across onboarding and post-install support.",
    uomType: "min",
    target: "60",
    weightage: 20,
    isShared: false,
  });
  add(sheets[0].id, {
    thrustArea: "Compliance",
    title: "Zero safety incidents",
    description: "Maintain zero safety incidents for the quarter.",
    uomType: "zero",
    target: "0",
    weightage: 30,
    isShared: false,
  });

  add(sheets[1].id, {
    thrustArea: "Growth",
    title: "Improve marketplace rating",
    description: "Increase average product ratings by improving listing content and reducing defects.",
    uomType: "min",
    target: "4.4",
    weightage: 40,
    isShared: false,
  });
  add(sheets[1].id, {
    thrustArea: "People",
    title: "Hire and onboard 2 associates",
    description: "Complete hiring and onboarding plan within the quarter.",
    uomType: "timeline",
    target: new Date().toISOString().slice(0, 10),
    weightage: 20,
    isShared: false,
  });
  add(sheets[1].id, {
    thrustArea: "Operational Excellence",
    title: "Reduce inventory variance",
    description: "Reduce warehouse inventory variance through cycle counts and reconciliation.",
    uomType: "max",
    target: "2",
    weightage: 40,
    isShared: false,
  });

  add(sheets[2].id, {
    thrustArea: "Customer",
    title: "Resolve priority tickets within SLA",
    description: "Ensure priority customer tickets are resolved within SLA targets.",
    uomType: "min",
    target: "95",
    weightage: 50,
    isShared: false,
  });
  add(sheets[2].id, {
    thrustArea: "Operational Excellence",
    title: "Reduce cost per installation",
    description: "Optimize installation routing to reduce cost per installation.",
    uomType: "max",
    target: "450",
    weightage: 50,
    isShared: false,
  });

  const checkins: ManagerCheckin[] = [
    {
      id: newId(),
      employeeId: employeeUsers[0].id,
      cycleId: cycle.id,
      quarter: "Q1",
      managerId,
      comment: "Good start. Focus on improving NPS drivers and keep TAT under control.",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ];

  const state: AppState = {
    version: 1,
    users: [admin, manager, ...employeeUsers],
    cycles: [cycle],
    activeCycleId: cycle.id,
    goalSheets: sheets,
    sharedGoalGroups: [],
    goals,
    achievements: [],
    checkins,
    audit: [
      { id: newId(), entity: "user", entityId: manager.id, action: "create", at: nowIso(), actorId: admin.id },
      { id: newId(), entity: "goalSheet", entityId: sheets[0].id, action: "approve", at: nowIso(), actorId: manager.id },
      { id: newId(), entity: "checkin", entityId: checkins[0].id, action: "create", at: nowIso(), actorId: manager.id },
    ],
  };

  saveState(state);
}
