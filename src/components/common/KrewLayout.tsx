import type { ReactNode } from "react";

type KrewPageProps = {
  children: ReactNode;
  className?: string;
};

type KrewPageHeaderProps = {
  action?: ReactNode;
  description?: string;
  title: string;
};

type KrewSurfaceProps = {
  children: ReactNode;
  className?: string;
};

type KrewSectionHeaderProps = {
  action?: ReactNode;
  className?: string;
  eyebrow?: string;
  title: string;
};

function cx(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

// KREW 카드 표면 공통 클래스. div/section/ul/label 등 요소 무관하게 재사용한다.
// (KrewSurface 컴포넌트가 안 맞는 자리에서는 이 상수를 className에 직접 붙인다.)
export const KREW_SURFACE_CLASS =
  "rounded-[22px] border border-white/70 bg-white/82 shadow-[var(--krew-card-shadow)]";

export function KrewPage({ children, className }: KrewPageProps) {
  return (
    <div className={cx("min-h-full bg-background px-4 pb-7 pt-4", className)}>
      {children}
    </div>
  );
}

export function KrewPageHeader({
  action,
  description,
  title,
}: KrewPageHeaderProps) {
  return (
    <header className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-black tracking-[-0.03em] text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-0.5 text-sm font-medium text-krew-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function KrewSurface({ children, className }: KrewSurfaceProps) {
  return (
    <section className={cx(KREW_SURFACE_CLASS, className)}>
      {children}
    </section>
  );
}

export function KrewSectionHeader({
  action,
  className,
  eyebrow,
  title,
}: KrewSectionHeaderProps) {
  return (
    <div className={cx("flex items-center justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="truncate text-sm font-extrabold text-foreground">
          {title}
        </h2>
        {eyebrow ? (
          <p className="mt-0.5 truncate text-xs font-medium text-krew-muted">
            {eyebrow}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
