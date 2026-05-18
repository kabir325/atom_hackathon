import { appendAudit } from "@/lib/audit";
import { nowIso } from "@/lib/id";
import { getState, updateState } from "@/lib/state";
import { type Cycle, type CycleWindows, type Quarter } from "@/lib/types";

export function getActiveCycle(): Cycle {
  const state = getState();
  const cycle = state.cycles.find((c) => c.id === state.activeCycleId);
  if (!cycle) throw new Error("Active cycle not found");
  return cycle;
}

export function getQuarterWindowStart(cycle: Cycle, quarter: Quarter) {
  switch (quarter) {
    case "Q1":
      return cycle.windows.q1Open;
    case "Q2":
      return cycle.windows.q2Open;
    case "Q3":
      return cycle.windows.q3Open;
    case "Q4":
      return cycle.windows.q4Open;
  }
}

export function getCurrentQuarter(cycle: Cycle, now = new Date()): Quarter | null {
  const t = now.getTime();
  const q1 = new Date(cycle.windows.q1Open).getTime();
  const q2 = new Date(cycle.windows.q2Open).getTime();
  const q3 = new Date(cycle.windows.q3Open).getTime();
  const q4 = new Date(cycle.windows.q4Open).getTime();

  const order: Array<{ q: Quarter; start: number }> = [
    { q: "Q1", start: q1 },
    { q: "Q2", start: q2 },
    { q: "Q3", start: q3 },
    { q: "Q4", start: q4 },
  ];
  order.sort((a, b) => a.start - b.start);

  const latest = order.filter((x) => x.start <= t).at(-1);
  return latest?.q ?? null;
}

export function canGoalSetting(now: Date, cycle: Cycle) {
  return now.getTime() >= new Date(cycle.windows.goalSettingOpen).getTime();
}

export function canCheckin(now: Date, cycle: Cycle, quarter: Quarter) {
  const start = new Date(getQuarterWindowStart(cycle, quarter)).getTime();
  return now.getTime() >= start;
}

export function updateCycleWindows(params: {
  actorId: string;
  cycleId: string;
  windows: CycleWindows;
  label?: string;
}) {
  const state = getState();
  const cycle = state.cycles.find((c) => c.id === params.cycleId);
  if (!cycle) return { ok: false as const, error: "Cycle not found" };

  updateState((prev) => ({
    ...prev,
    cycles: prev.cycles.map((c) =>
      c.id === params.cycleId
        ? { ...c, windows: params.windows, label: params.label ?? c.label, createdAt: c.createdAt }
        : c,
    ),
  }));

  appendAudit({
    entity: "cycle",
    entityId: params.cycleId,
    action: "update",
    actorId: params.actorId,
    meta: { updatedAt: nowIso() },
  });

  return { ok: true as const };
}

export function setActiveCycle(params: { actorId: string; cycleId: string }) {
  const state = getState();
  if (!state.cycles.some((c) => c.id === params.cycleId)) {
    return { ok: false as const, error: "Cycle not found" };
  }
  updateState((prev) => ({ ...prev, activeCycleId: params.cycleId }));
  appendAudit({
    entity: "cycle",
    entityId: params.cycleId,
    action: "update",
    actorId: params.actorId,
    meta: { activeCycleId: params.cycleId },
  });
  return { ok: true as const };
}
