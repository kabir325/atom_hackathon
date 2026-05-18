import { newId, nowIso } from "@/lib/id";
import { randomSaltBase64, hashPassword } from "@/lib/password";
import { loadState, saveState } from "@/lib/storage";
import { type AppState, type Cycle, type CycleWindows, type User } from "@/lib/types";

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
    name: "Admin",
    role: "admin",
    active: true,
    passwordSalt: salt,
    passwordHash,
    createdAt: nowIso(),
  };

  const cycle: Cycle = {
    id: newId(),
    label: defaultCycleLabel(defaultWindowsForToday()),
    windows: defaultWindowsForToday(),
    createdAt: nowIso(),
  };

  const state: AppState = {
    version: 1,
    users: [admin],
    cycles: [cycle],
    activeCycleId: cycle.id,
    goalSheets: [],
    sharedGoalGroups: [],
    goals: [],
    achievements: [],
    checkins: [],
    audit: [],
  };

  saveState(state);
}

