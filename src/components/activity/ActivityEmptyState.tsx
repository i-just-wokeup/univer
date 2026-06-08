type ActivityEmptyStateProps = {
  message: string;
};

export function ActivityEmptyState({ message }: ActivityEmptyStateProps) {
  return (
    <section className="flex min-h-64 items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-zinc-500">{message}</p>
    </section>
  );
}
