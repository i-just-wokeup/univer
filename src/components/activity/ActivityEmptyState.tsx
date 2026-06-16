type ActivityEmptyStateProps = {
  message: string;
};

export function ActivityEmptyState({ message }: ActivityEmptyStateProps) {
  return (
    <section className="mx-4 mt-4 flex min-h-64 items-center justify-center rounded-[22px] border border-white/70 bg-white/82 px-6 text-center shadow-[var(--krew-card-shadow)]">
      <p className="text-sm font-semibold text-krew-muted">{message}</p>
    </section>
  );
}
