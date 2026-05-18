"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Role } from "@/lib/types";

type NavItem = { href: string; label: string; roles: Role[] };

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["admin", "manager", "employee"] },

  { href: "/employee/goals", label: "My Goals", roles: ["employee"] },
  { href: "/employee/checkins", label: "My Check-ins", roles: ["employee"] },

  { href: "/manager/reviews", label: "Approvals", roles: ["manager"] },
  { href: "/manager/checkins", label: "Team Check-ins", roles: ["manager"] },
  { href: "/manager/shared-goals", label: "Shared Goals", roles: ["manager"] },

  { href: "/reports/achievement", label: "Achievement Report", roles: ["admin", "manager"] },
  { href: "/reports/completion", label: "Completion Dashboard", roles: ["admin", "manager"] },

  { href: "/admin/users", label: "Users", roles: ["admin"] },
  { href: "/admin/cycle", label: "Cycle", roles: ["admin"] },
  { href: "/admin/shared-goals", label: "Shared Goals", roles: ["admin"] },
  { href: "/admin/unlock", label: "Unlock Goals", roles: ["admin"] },
  { href: "/admin/audit", label: "Audit Trail", roles: ["admin"] },
  { href: "/settings", label: "Settings", roles: ["admin", "manager", "employee"] },
];

export default function Nav({ role }: { role: Role }) {
  const pathname = usePathname();
  const visible = ITEMS.filter((i) => i.roles.includes(role));

  return (
    <nav className="flex flex-col gap-1">
      {visible.map((item) => {
        const active =
          pathname === item.href || (pathname?.startsWith(item.href + "/") ?? false);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "rounded-lg px-3 py-2 text-sm font-medium",
              active
                ? "bg-amber-400 text-zinc-900"
                : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
