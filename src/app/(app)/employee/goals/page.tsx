"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import {
  addGoalComment,
  addGoal,
  deleteGoal,
  getCommentsForGoal,
  getGoalsForSheet,
  getOrCreateMySheet,
  submitGoalSheet,
  updateGoal,
  validateGoals,
} from "@/lib/goals";
import { type ThrustArea } from "@/lib/types";

const THRUST_AREAS: ThrustArea[] = [
  "Growth",
  "Operational Excellence",
  "Customer",
  "People",
  "Compliance",
  "Other",
];

export default function EmployeeGoalsPage() {
  const { user } = useAuth();
  const { state, refresh } = useAppState();
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [commentsGoalId, setCommentsGoalId] = useState<string | null>(null);

  if (!user) return null;
  if (user.role !== "employee") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
        This page is for Employees.
      </div>
    );
  }

  const sheet = getOrCreateMySheet(user.id);
  const goals = getGoalsForSheet(sheet.id);

  const totalWeightage = goals.reduce((s, g) => s + (Number.isFinite(g.weightage) ? g.weightage : 0), 0);
  const validation = validateGoals(goals);
  const canEdit = !sheet.lockedAt && (sheet.status === "draft" || sheet.status === "returned");

  const sharedHint = goals.some((g) => g.isShared)
    ? "Shared goals: you can change weightage only. Actuals update only by the primary owner."
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-zinc-900">My Goals</div>
            <div className="mt-1 text-sm text-zinc-600">
              Status: <span className="font-medium text-zinc-900">{sheet.status}</span>
              {sheet.lockedAt ? (
                <>
                  {" "}
                  • Locked
                </>
              ) : null}
            </div>
            {sharedHint ? <div className="mt-2 text-xs text-zinc-500">{sharedHint}</div> : null}
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-zinc-700">
              Total weightage:{" "}
              <span className={totalWeightage <= 100 ? "font-semibold text-zinc-900" : "font-semibold text-red-700"}>
                {totalWeightage}%
              </span>
            </div>
            <button
              className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              disabled={!canEdit}
              onClick={() => setAdding(true)}
            >
              Add goal
            </button>
            <button
              className="h-10 rounded-md border border-zinc-200 px-4 text-sm hover:bg-zinc-50 disabled:opacity-50"
              disabled={!canEdit}
              onClick={() => {
                setError(null);
                const res = submitGoalSheet({ actorId: user.id, sheetId: sheet.id });
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                refresh();
              }}
            >
              Submit
            </button>
          </div>
        </div>

        {!validation.ok && canEdit ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {validation.errors.join(". ")}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="py-2 pr-2">Thrust</th>
                <th className="py-2 pr-2">Title</th>
                <th className="py-2 pr-2">UoM</th>
                <th className="py-2 pr-2">Target</th>
                <th className="py-2 pr-2">Weightage</th>
                <th className="py-2 pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((g) => {
                const sharedReadOnly = g.isShared;
                const canEditRow = canEdit;
                return (
                  <tr key={g.id} className="border-t border-zinc-100 align-top">
                    <td className="py-2 pr-2">
                      <select
                        className="h-9 w-44 rounded-md border border-zinc-200 px-2 disabled:bg-zinc-50"
                        disabled={!canEditRow || (sharedReadOnly && true)}
                        value={g.thrustArea}
                        onChange={(e) => {
                          updateGoal({
                            actorId: user.id,
                            goalId: g.id,
                            patch: { thrustArea: e.target.value as ThrustArea },
                          });
                          refresh();
                        }}
                      >
                        {THRUST_AREAS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        className="h-9 w-72 rounded-md border border-zinc-200 px-2 disabled:bg-zinc-50"
                        disabled={!canEditRow || sharedReadOnly}
                        value={g.title}
                        onChange={(e) => {
                          updateGoal({ actorId: user.id, goalId: g.id, patch: { title: e.target.value } });
                          refresh();
                        }}
                      />
                      <textarea
                        className="mt-2 w-72 rounded-md border border-zinc-200 px-2 py-2 text-xs disabled:bg-zinc-50"
                        disabled={!canEditRow || sharedReadOnly}
                        value={g.description}
                        onChange={(e) => {
                          updateGoal({
                            actorId: user.id,
                            goalId: g.id,
                            patch: { description: e.target.value },
                          });
                          refresh();
                        }}
                        rows={2}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <div className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm font-semibold text-zinc-900">
                        %
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        className="h-9 w-40 rounded-md border border-zinc-200 px-2 disabled:bg-zinc-50"
                        disabled={!canEditRow || sharedReadOnly}
                        value={g.target}
                        onChange={(e) => {
                          updateGoal({ actorId: user.id, goalId: g.id, patch: { target: e.target.value } });
                          refresh();
                        }}
                        placeholder="Target % (0-100)"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        className="h-9 w-24 rounded-md border border-zinc-200 px-2 disabled:bg-zinc-50"
                        disabled={!canEditRow}
                        value={String(g.weightage)}
                        onChange={(e) => {
                          const weightage = Number(e.target.value);
                          updateGoal({ actorId: user.id, goalId: g.id, patch: { weightage } });
                          refresh();
                        }}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-2">
                        <button
                          className="h-9 rounded-md border border-zinc-200 px-3 text-xs hover:bg-zinc-50"
                          onClick={() => setCommentsGoalId(g.id)}
                        >
                          Comments{" "}
                          <span className="text-zinc-500">
                            ({state.goalComments.filter((c) => c.goalId === g.id).length})
                          </span>
                        </button>
                        <button
                          className="h-9 rounded-md border border-zinc-200 px-3 text-xs hover:bg-zinc-50 disabled:opacity-50"
                          disabled={!canEditRow || g.isShared}
                          onClick={() => {
                            deleteGoal({ actorId: user.id, goalId: g.id });
                            refresh();
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {goals.length === 0 ? (
                <tr>
                  <td className="py-6 text-sm text-zinc-600" colSpan={6}>
                    No goals yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {adding ? (
        <AddGoalDialog
          onClose={() => setAdding(false)}
          onCreate={(data) => {
            setError(null);
            const res = addGoal({
              actorId: user.id,
              sheetId: sheet.id,
              thrustArea: data.thrustArea,
              title: data.title,
              description: data.description,
              uomType: data.uomType,
              target: data.target,
              weightage: data.weightage,
            });
            if (!res.ok) setError(res.error);
            refresh();
            setAdding(false);
          }}
        />
      ) : null}

      {commentsGoalId ? (
        <CommentsDialog
          goalId={commentsGoalId}
          onClose={() => setCommentsGoalId(null)}
          onSend={(message) => {
            const res = addGoalComment({ actorId: user.id, goalId: commentsGoalId, message });
            if (!res.ok) setError(res.error);
            refresh();
          }}
          getAuthorLabel={(authorId) => state.users.find((u) => u.id === authorId)?.name ?? "User"}
          comments={getCommentsForGoal(commentsGoalId)}
          currentUserId={user.id}
        />
      ) : null}
    </div>
  );
}

function CommentsDialog(props: {
  goalId: string;
  comments: Array<{ id: string; authorId: string; message: string; createdAt: string }>;
  currentUserId: string;
  getAuthorLabel: (authorId: string) => string;
  onSend: (message: string) => void;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-base font-semibold text-zinc-900">Goal comments</div>
          <button className="text-sm font-semibold text-zinc-700 hover:text-zinc-900" onClick={props.onClose}>
            Close
          </button>
        </div>

        <div className="mt-4 max-h-[50vh] overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="space-y-3">
            {props.comments.map((c) => {
              const mine = c.authorId === props.currentUserId;
              return (
                <div key={c.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={[
                      "max-w-[80%] rounded-2xl px-3 py-2",
                      mine ? "bg-amber-400 text-zinc-900" : "bg-white border border-zinc-200 text-zinc-900",
                    ].join(" ")}
                  >
                    <div className="text-xs font-semibold opacity-80">
                      {props.getAuthorLabel(c.authorId)}
                    </div>
                    <div className="mt-1 text-sm whitespace-pre-wrap">{c.message}</div>
                    <div className="mt-1 text-[11px] opacity-70">
                      {c.createdAt.replace("T", " ").slice(0, 19)}
                    </div>
                  </div>
                </div>
              );
            })}
            {props.comments.length === 0 ? (
              <div className="text-sm text-zinc-600">No comments yet.</div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-end gap-2">
          <textarea
            className="min-h-[44px] flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a comment…"
          />
          <button
            className="h-11 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
            onClick={() => {
              const m = message.trim();
              if (!m) return;
              props.onSend(m);
              setMessage("");
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function AddGoalDialog(props: {
  onClose: () => void;
  onCreate: (data: {
    thrustArea: ThrustArea;
    title: string;
    description: string;
    uomType: "min";
    target: string;
    weightage: number;
  }) => void;
}) {
  const [thrustArea, setThrustArea] = useState<ThrustArea>("Growth");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [weightage, setWeightage] = useState(10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold text-zinc-900">Add Goal</div>
          <button className="text-sm text-zinc-600 hover:text-zinc-900" onClick={props.onClose}>
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-zinc-700">Thrust Area</div>
            <select
              className="h-10 rounded-md border border-zinc-200 px-3"
              value={thrustArea}
              onChange={(e) => setThrustArea(e.target.value as ThrustArea)}
            >
              {THRUST_AREAS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-zinc-700">Goal Title</div>
            <input
              className="h-10 rounded-md border border-zinc-200 px-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-zinc-700">Description</div>
            <textarea
              className="rounded-md border border-zinc-200 px-3 py-2"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-zinc-700">Target (%)</div>
            <input
              className="h-10 rounded-md border border-zinc-200 px-3"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="0-100"
            />
          </label>

          <label className="flex flex-col gap-1">
            <div className="text-sm font-medium text-zinc-700">Weightage</div>
            <input
              className="h-10 rounded-md border border-zinc-200 px-3"
              value={String(weightage)}
              onChange={(e) => setWeightage(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button className="h-10 rounded-md border border-zinc-200 px-4 text-sm hover:bg-zinc-50" onClick={props.onClose}>
            Cancel
          </button>
          <button
            className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
            onClick={() =>
              props.onCreate({ thrustArea, title, description, uomType: "min", target, weightage })
            }
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
