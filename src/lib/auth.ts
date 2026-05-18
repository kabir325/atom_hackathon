import { appendAudit } from "@/lib/audit";
import { newId, nowIso } from "@/lib/id";
import { hashPassword, randomSaltBase64 } from "@/lib/password";
import { getState, updateState } from "@/lib/state";
import { type Role, type Session, type User } from "@/lib/types";

export function getCurrentUser(): User | null {
  const state = getState();
  const userId = state.session?.userId;
  if (!userId) return null;
  return state.users.find((u) => u.id === userId) ?? null;
}

export async function login(email: string, password: string) {
  const state = getState();
  const user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !user.active) return { ok: false as const, error: "Invalid credentials" };

  const computed = await hashPassword(password, user.passwordSalt);
  if (computed !== user.passwordHash) return { ok: false as const, error: "Invalid credentials" };

  const session: Session = { userId: user.id, token: newId(), createdAt: nowIso() };
  updateState((prev) => ({ ...prev, session }));
  return { ok: true as const, user };
}

export function logout() {
  updateState((prev) => {
    const next = { ...prev };
    delete next.session;
    return next;
  });
}

export async function createUser(params: {
  actorId: string;
  email: string;
  name: string;
  role: Role;
  password: string;
  managerId?: string;
}) {
  const state = getState();
  const normalizedEmail = params.email.trim().toLowerCase();
  if (!normalizedEmail) return { ok: false as const, error: "Email is required" };
  if (state.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return { ok: false as const, error: "Email already exists" };
  }
  if (!params.password || params.password.length < 6) {
    return { ok: false as const, error: "Password must be at least 6 characters" };
  }

  const salt = randomSaltBase64();
  const passwordHash = await hashPassword(params.password, salt);

  const user: User = {
    id: newId(),
    email: normalizedEmail,
    name: params.name.trim() || normalizedEmail,
    role: params.role,
    managerId: params.managerId,
    active: true,
    passwordSalt: salt,
    passwordHash,
    createdAt: nowIso(),
  };

  updateState((prev) => ({ ...prev, users: [...prev.users, user] }));
  appendAudit({
    entity: "user",
    entityId: user.id,
    action: "create",
    actorId: params.actorId,
    meta: { email: user.email, role: user.role },
  });
  return { ok: true as const, user };
}

export function updateUser(params: {
  actorId: string;
  userId: string;
  patch: Partial<Pick<User, "name" | "role" | "managerId" | "active" | "email">>;
}) {
  const prevState = getState();
  const prevUser = prevState.users.find((u) => u.id === params.userId);
  if (!prevUser) return { ok: false as const, error: "User not found" };

  const nextEmail = params.patch.email?.trim().toLowerCase();
  if (nextEmail && nextEmail !== prevUser.email.toLowerCase()) {
    if (prevState.users.some((u) => u.id !== prevUser.id && u.email.toLowerCase() === nextEmail)) {
      return { ok: false as const, error: "Email already exists" };
    }
  }

  const updated: User = {
    ...prevUser,
    ...params.patch,
    email: nextEmail ?? prevUser.email,
    name: params.patch.name?.trim() ?? prevUser.name,
  };

  updateState((prev) => ({
    ...prev,
    users: prev.users.map((u) => (u.id === updated.id ? updated : u)),
  }));

  appendAudit({
    entity: "user",
    entityId: updated.id,
    action: "update",
    actorId: params.actorId,
    changes: Object.entries(params.patch).map(([field, to]) => ({
      field,
      from: (prevUser as Record<string, unknown>)[field],
      to,
    })),
  });

  return { ok: true as const, user: updated };
}

export async function resetPassword(params: {
  actorId: string;
  userId: string;
  newPassword: string;
}) {
  if (!params.newPassword || params.newPassword.length < 6) {
    return { ok: false as const, error: "Password must be at least 6 characters" };
  }

  const state = getState();
  const user = state.users.find((u) => u.id === params.userId);
  if (!user) return { ok: false as const, error: "User not found" };

  const salt = randomSaltBase64();
  const passwordHash = await hashPassword(params.newPassword, salt);

  updateState((prev) => ({
    ...prev,
    users: prev.users.map((u) =>
      u.id === user.id ? { ...u, passwordSalt: salt, passwordHash } : u,
    ),
  }));

  appendAudit({
    entity: "user",
    entityId: user.id,
    action: "update",
    actorId: params.actorId,
    changes: [
      { field: "passwordHash", from: "redacted", to: "redacted" },
      { field: "passwordSalt", from: "redacted", to: "redacted" },
    ],
  });

  return { ok: true as const };
}

export async function changeMyPassword(params: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  if (!params.newPassword || params.newPassword.length < 6) {
    return { ok: false as const, error: "Password must be at least 6 characters" };
  }
  if (params.newPassword === params.currentPassword) {
    return { ok: false as const, error: "New password must be different" };
  }

  const state = getState();
  const user = state.users.find((u) => u.id === params.userId);
  if (!user || !user.active) return { ok: false as const, error: "User not found" };

  const computed = await hashPassword(params.currentPassword, user.passwordSalt);
  if (computed !== user.passwordHash) {
    return { ok: false as const, error: "Current password is incorrect" };
  }

  const salt = randomSaltBase64();
  const passwordHash = await hashPassword(params.newPassword, salt);

  updateState((prev) => ({
    ...prev,
    users: prev.users.map((u) =>
      u.id === user.id ? { ...u, passwordSalt: salt, passwordHash } : u,
    ),
  }));

  appendAudit({
    entity: "user",
    entityId: user.id,
    action: "update",
    actorId: user.id,
    changes: [
      { field: "passwordHash", from: "redacted", to: "redacted" },
      { field: "passwordSalt", from: "redacted", to: "redacted" },
    ],
  });

  return { ok: true as const };
}
