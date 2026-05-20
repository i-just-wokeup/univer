import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/AdminSidebar";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <AdminSidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-zinc-200 bg-white px-6 py-5 lg:px-8">
            <h2 className="text-xl font-bold text-zinc-950">UniVerse 관리자</h2>
          </header>
          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
