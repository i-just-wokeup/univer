"use client";

import { usePathname } from "next/navigation";

type SubLayoutContentProps = {
  children: React.ReactNode;
};

export function SubLayoutContent({ children }: SubLayoutContentProps) {
  const pathname = usePathname();
  const contentWidthClass =
    pathname === "/write" || pathname.startsWith("/settings")
      ? "max-w-[470px] lg:max-w-[720px]"
      : "max-w-[470px]";

  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col bg-background ${contentWidthClass}`}
    >
      {children}
    </div>
  );
}
