"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-context";
import { useAppState } from "@/components/state/use-app-state";
import { buildNotifications, countUnread, getLastSeenAt, markAllReadNow } from "@/lib/notifications";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { state } = useAppState();

  if (!user) return null;

  const items = buildNotifications(state, user.id, user.role);
  const lastSeenAt = getLastSeenAt(user.id);
  const unread = countUnread(items, lastSeenAt);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-zinc-900">Notifications</div>
            <div className="mt-1 text-sm text-zinc-600">
              Unread: <span className="font-semibold text-zinc-900">{unread}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="h-10 rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-900 hover:bg-amber-300"
              onClick={() => markAllReadNow(user.id)}
            >
              Mark all read
            </button>
            <Link
              className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 inline-flex items-center"
              href="/dashboard"
            >
              Back
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          {items.map((n) => {
            const isUnread = !lastSeenAt || n.at > lastSeenAt;
            return (
              <Link
                key={n.id}
                href={n.href}
                className={[
                  "block rounded-xl border p-4 hover:border-zinc-300",
                  isUnread ? "border-amber-200 bg-amber-50" : "border-zinc-200 bg-white",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-zinc-900">{n.title}</div>
                  <div className="text-xs text-zinc-500 whitespace-nowrap">
                    {n.at.replace("T", " ").slice(0, 19)}
                  </div>
                </div>
              </Link>
            );
          })}
          {items.length === 0 ? <div className="text-sm text-zinc-600">No notifications.</div> : null}
        </div>
      </div>
    </div>
  );
}

