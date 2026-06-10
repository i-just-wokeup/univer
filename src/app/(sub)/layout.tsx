import { NavItems } from "@/components/layout/NavItems";
import { SubLayoutBottomNav } from "@/components/layout/SubLayoutBottomNav";

type SubLayoutProps = {
  children: React.ReactNode;
};

export default function SubLayout({ children }: SubLayoutProps) {
  const logo = <span>UNIVER</span>;

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <NavItems logo={logo} variant="sidebar" />

        <div className="flex min-h-screen flex-1 flex-col lg:flex-row lg:items-stretch">
          <div className="flex min-h-screen flex-1 flex-col">
            <main className="flex flex-1 flex-col">
              <div className="mx-auto flex w-full max-w-[470px] flex-1 flex-col bg-white">
                {children}
              </div>
            </main>
            <SubLayoutBottomNav />
          </div>

          <aside className="hidden w-80 shrink-0 lg:block">
            <div className="sticky top-0 flex min-h-screen items-start pt-8">
              <div className="h-[420px] w-full bg-white" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
