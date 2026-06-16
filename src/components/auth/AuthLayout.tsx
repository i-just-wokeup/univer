import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  className?: string;
};

type AuthHeaderProps = {
  description?: string;
  title: string;
};

type AuthKrewMarkProps = {
  subtitle?: string;
};

function cx(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export const AUTH_INPUT_CLASS =
  "mt-2 h-12 w-full rounded-[18px] border border-white/80 bg-white/90 px-4 text-sm font-semibold text-foreground shadow-sm outline-none transition placeholder:text-krew-faint focus:border-krew-accent-ring focus:bg-white disabled:bg-white/60 read-only:bg-white/65 read-only:text-krew-muted";

export const AUTH_LABEL_CLASS =
  "text-sm font-extrabold text-krew-muted";

export const AUTH_PRIMARY_BUTTON_CLASS =
  "flex h-12 w-full items-center justify-center rounded-[18px] bg-krew-accent px-4 text-sm font-extrabold text-white shadow-[var(--krew-accent-glow)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-white/70 disabled:text-krew-faint disabled:shadow-none";

export const AUTH_SECONDARY_BUTTON_CLASS =
  "flex h-12 w-full items-center justify-center rounded-[18px] border border-white/85 bg-white/90 px-4 text-sm font-extrabold text-foreground shadow-sm transition hover:text-krew-accent disabled:cursor-not-allowed disabled:opacity-60";

export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <main
      className={cx(
        "flex min-h-screen justify-center bg-background px-5 py-8 text-foreground",
        className,
      )}
    >
      <div className="flex min-h-[calc(100vh-4rem)] w-full max-w-sm flex-col">
        {children}
      </div>
    </main>
  );
}

export function AuthKrewMark({ subtitle }: AuthKrewMarkProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-krew-accent text-4xl font-black text-white shadow-[var(--krew-accent-glow)]">
        K
      </div>
      <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-krew-accent">
        KREW
      </h1>
      {subtitle ? (
        <p className="mt-4 text-sm font-semibold leading-6 text-krew-muted">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function AuthHeader({ description, title }: AuthHeaderProps) {
  return (
    <header className="pt-8">
      <h1 className="text-2xl font-black tracking-[-0.03em] text-foreground">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 text-sm font-semibold leading-6 text-krew-muted">
          {description}
        </p>
      ) : null}
    </header>
  );
}

export function AuthCard({ children, className }: AuthShellProps) {
  return (
    <section
      className={cx(
        "rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[var(--krew-card-shadow)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function AuthErrorMessage({ message }: { message: string }) {
  return (
    <p className="rounded-[18px] border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-semibold text-red-600">
      {message}
    </p>
  );
}
