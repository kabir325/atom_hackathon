import { newId, nowIso } from "@/lib/id";
import { updateState } from "@/lib/state";
import { type AuditAction, type AuditChange, type AuditEntity } from "@/lib/types";

export function appendAudit(entry: {
  entity: AuditEntity;
  entityId: string;
  action: AuditAction;
  actorId: string;
  changes?: AuditChange[];
  meta?: Record<string, unknown>;
}) {
  updateState((prev) => ({
    ...prev,
    audit: [
      {
        id: newId(),
        entity: entry.entity,
        entityId: entry.entityId,
        action: entry.action,
        at: nowIso(),
        actorId: entry.actorId,
        changes: entry.changes,
        meta: entry.meta,
      },
      ...prev.audit,
    ],
  }));
}

