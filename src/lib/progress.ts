import { type UomType } from "@/lib/types";

function toNumber(value: string) {
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

export function computeProgressPercent(params: {
  uomType: UomType;
  target: string;
  actual: string;
}) {
  const { uomType, target, actual } = params;

  if (uomType === "zero") {
    const a = toNumber(actual);
    if (a === null) return 0;
    return a === 0 ? 100 : 0;
  }

  if (uomType === "timeline") {
    const t = new Date(target).getTime();
    const a = new Date(actual).getTime();
    if (!Number.isFinite(t) || !Number.isFinite(a)) return 0;
    return a <= t ? 100 : 0;
  }

  const t = toNumber(target);
  const a = toNumber(actual);
  if (t === null || a === null) return 0;
  if (t === 0 || a === 0) return 0;

  if (uomType === "min") {
    const ratio = a / t;
    return Math.max(0, Math.min(1, ratio)) * 100;
  }

  const ratio = t / a;
  return Math.max(0, Math.min(1, ratio)) * 100;
}

