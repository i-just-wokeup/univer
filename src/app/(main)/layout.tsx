import { MainLayoutShell } from "@/components/layout/MainLayoutShell";

type MainLayoutProps = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  return <MainLayoutShell>{children}</MainLayoutShell>;
}
