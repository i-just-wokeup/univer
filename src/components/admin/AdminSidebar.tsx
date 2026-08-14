"use client";

import { BadgeCheck, BarChart3, Flag, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_NAV_ITEMS = [
  {
    href: "/admin",
    icon: BarChart3,
    label: "대시보드",
  },
  {
    href: "/admin/reports",
    icon: Flag,
    label: "신고 관리",
  },
  {
    href: "/admin/users",
    icon: Users,
    label: "유저 관리",
  },
  {
    href: "/admin/promotions",
    icon: BadgeCheck,
    label: "승격 신청",
  },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-zinc-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Admin
            </p>
            <h1 className="mt-1 text-lg font-bold text-zinc-950">UniVerse 관리자</h1>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 px-4 py-5">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
