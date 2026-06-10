"use client";

import { usePathname } from "next/navigation";

import { NavItems } from "@/components/layout/NavItems";

export function SubLayoutBottomNav() {
  const pathname = usePathname();

  if (pathname === "/write") {
    return null;
  }

  return <NavItems variant="bottom" />;
}
