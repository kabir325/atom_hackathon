"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import { addGoalComment, approveGoalSheet, getCommentsForGoal, getGoalsForSheet, getTeamSheetsForManager, returnGoalSheet, updateGoal, validateGoals } from "@/lib/goals";
import { type GoalSheet } from "@/lib/types";

export default function ManagerReviewsPage() {
  const { user } = useAuth();
  const { state, refresh } = useAppState();
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commentsGoalId, setCommentsGoalId] = useState<string | null>(null);

  if (!user) return null;
  if (user.role !== "manager") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
        This page is for Managers.
      </div>
    );
  }

  const sheets = getTeamSheetsForManager(user.id).sort((a, b) => a.employeeId.localeCompare(b.employeeId));
  const selected = sheets.find((s) => s.id === selectedSheetId) ?? sheets.at(0) ?? null;

  const employee = selected ? state.users.find((u) => u.id === selected.employeeId) : null;
  const goals = selected ? getGoalsForSheet(selected.id) : [];
  const validation = validateGoals(goals);

  const submittedCount = sheets.filter((s) => s.status === "submitted").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-zinc-900">Goal Approvals</div>
            <div className="mt-1 text-sm text-zinc-600">Submitted pending: {submittedCount}</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-10 rounded-md border border-zinc-200 px-3"
              value={selected?.id ?? ""}
              onChange={(e) => setSelectedSheetId(e.target.value)}
            >
              {sheets.map((s) => {
                const emp = state.users.find((u) => u.id === s.employeeId);
                return (
                  <option key={s.id} value={s.id}>
                    {(emp?.name ?? emp?.email ?? s.employeeId) + ` • ${s.status}`}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      {!selected ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
          No team members assigned yet. Ask Admin to set Employee.managerId to your user.
        </div>
      ) : (
        <>
          <SheetHeader sheet={selected} employeeLabel={employee?.email ?? ""} validationOk={validation.ok} />

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-zinc-500">
                  <tr>
                    <th className="py-2 pr-2">Goal</th>
                    <th className="py-2 pr-2">UoM</th>
                    <th className="py-2 pr-2">Target</th>
                    <th className="py-2 pr-2">Weightage</th>
                    <th className="py-2 pr-2">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((g) => (
                    <tr key={g.id} className="border-t border-zinc-100 align-top">
                      <td className="py-2 pr-2">
                        <div className="font-medium text-zinc-900">{g.title}</div>
                        <div className="text-xs text-zinc-500">{g.thrustArea}{g.isShared ? " • Shared" : ""}</div>
                      </td>
                      <td className="py-2 pr-2">
                        <div className="text-zinc-900">%</div>
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          className="h-9 w-40 rounded-md border border-zinc-200 px-2 disabled:bg-zinc-50"
                          disabled={Boolean(selected.lockedAt) || selected.status !== "submitted" || g.isShared}
                          value={g.target}
                          onChange={(e) => {
                            updateGoal({ actorId: user.id, goalId: g.id, patch: { target: e.target.value } });
                            refresh();
                          }}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          className="h-9 w-24 rounded-md border border-zinc-200 px-2 disabled:bg-zinc-50"
                          disabled={Boolean(selected.lockedAt) || selected.status !== "submitted"}
                          value={String(g.weightage)}
                          onChange={(e) => {
                            updateGoal({ actorId: user.id, goalId: g.id, patch: { weightage: Number(e.target.value) } });
                            refresh();
                          }}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <button
                          className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                          onClick={() => setCommentsGoalId(g.id)}
                        >
                          Open{" "}
                          <span className="text-zinc-500">
                            ({state.goalComments.filter((c) => c.goalId === g.id).length})
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {goals.length === 0 ? (
                    <tr>
                      <td className="py-6 text-sm text-zinc-600" colSpan={5}>
                        No goals in this sheet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {!validation.ok && selected.status === "submitted" ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {validation.errors.join(". ")}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                className="h-10 rounded-md border border-zinc-200 px-4 text-sm hover:bg-zinc-50 disabled:opacity-50"
                disabled={selected.status !== "submitted"}
                onClick={() => {
                  setError(null);
                  const res = returnGoalSheet({ actorId: user.id, sheetId: selected.id });
                  if (!res.ok) setError(res.error);
                  refresh();
                }}
              >
                Return for rework
              </button>
              <button
                className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                disabled={selected.status !== "submitted" || !validation.ok}
                onClick={() => {
                  setError(null);
                  const res = approveGoalSheet({ actorId: user.id, sheetId: selected.id });
                  if (!res.ok) setError(res.error);
                  refresh();
                }}
              >
                Approve & Lock
              </button>
            </div>
          </div>
        </>
      )}

      {commentsGoalId ? (
        <CommentsDialog
          goalId={commentsGoalId}
          onClose={() => setCommentsGoalId(null)}
          onSend={(message) => {
            setError(null);
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

function SheetHeader(props: { sheet: GoalSheet; employeeLabel: string; validationOk: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-zinc-900">{props.employeeLabel || "Employee"}</div>
          <div className="mt-1 text-sm text-zinc-600">
            Status: <span className="font-medium text-zinc-900">{props.sheet.status}</span>
            {props.sheet.lockedAt ? <> • Locked</> : null}
          </div>
        </div>
        <div className="text-sm text-zinc-700">
          Validation:{" "}
          <span className={props.validationOk ? "font-semibold text-zinc-900" : "font-semibold text-amber-700"}>
            {props.validationOk ? "OK" : "Needs fixes"}
          </span>
        </div>
      </div>
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
                    <div className="text-xs font-semibold opacity-80">{props.getAuthorLabel(c.authorId)}</div>
                    <div className="mt-1 text-sm whitespace-pre-wrap">{c.message}</div>
                    <div className="mt-1 text-[11px] opacity-70">
                      {c.createdAt.replace("T", " ").slice(0, 19)}
                    </div>
                  </div>
                </div>
              );
            })}
            {props.comments.length === 0 ? <div className="text-sm text-zinc-600">No comments yet.</div> : null}
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
