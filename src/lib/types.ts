export type Role = "admin" | "manager" | "employee";

export type UomType = "min" | "max" | "timeline" | "zero";

export type GoalSheetStatus = "draft" | "submitted" | "returned" | "approved";

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export type GoalStatus = "not_started" | "on_track" | "completed";

export type ThrustArea =
  | "Growth"
  | "Operational Excellence"
  | "Customer"
  | "People"
  | "Compliance"
  | "Other";

export type AuditEntity =
  | "user"
  | "cycle"
  | "goalSheet"
  | "goal"
  | "goalComment"
  | "achievement"
  | "checkin"
  | "sharedGoalGroup";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "submit"
  | "return"
  | "approve"
  | "lock"
  | "unlock";

export type AuditChange = {
  field: string;
  from: unknown;
  to: unknown;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  managerId?: string;
  active: boolean;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
};

export type CycleWindows = {
  goalSettingOpen: string;
  q1Open: string;
  q2Open: string;
  q3Open: string;
  q4Open: string;
};

export type Cycle = {
  id: string;
  label: string;
  windows: CycleWindows;
  createdAt: string;
};

export type GoalSheet = {
  id: string;
  employeeId: string;
  managerId: string;
  cycleId: string;
  status: GoalSheetStatus;
  lockedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  returnedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type SharedGoalGroup = {
  id: string;
  createdById: string;
  createdAt: string;
  title: string;
  description: string;
  thrustArea: ThrustArea;
  uomType: UomType;
  target: string;
  primaryOwnerId: string;
  recipientEmployeeIds: string[];
};

export type Goal = {
  id: string;
  sheetId: string;
  thrustArea: ThrustArea;
  title: string;
  description: string;
  uomType: UomType;
  target: string;
  weightage: number;
  isShared: boolean;
  sharedGroupId?: string;
  primaryOwnerId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Achievement = {
  id: string;
  goalId: string;
  quarter: Quarter;
  actual: string;
  status: GoalStatus;
  updatedAt: string;
  updatedById: string;
};

export type GoalComment = {
  id: string;
  goalId: string;
  authorId: string;
  message: string;
  createdAt: string;
};

export type ManagerCheckin = {
  id: string;
  employeeId: string;
  cycleId: string;
  quarter: Quarter;
  managerId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  entity: AuditEntity;
  entityId: string;
  action: AuditAction;
  at: string;
  actorId: string;
  changes?: AuditChange[];
  meta?: Record<string, unknown>;
};

export type Session = {
  userId: string;
  token: string;
  createdAt: string;
};

export type AppState = {
  version: 2;
  users: User[];
  cycles: Cycle[];
  activeCycleId: string;
  goalSheets: GoalSheet[];
  sharedGoalGroups: SharedGoalGroup[];
  goals: Goal[];
  achievements: Achievement[];
  goalComments: GoalComment[];
  checkins: ManagerCheckin[];
  audit: AuditLog[];
  session?: Session;
};

export type AppStateV1 = Omit<AppState, "version" | "goalComments"> & { version: 1 };
