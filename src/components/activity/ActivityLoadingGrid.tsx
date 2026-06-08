export function ActivityLoadingGrid() {
  return (
    <section className="grid grid-cols-3 gap-px px-4 py-4">
      {Array.from({ length: 9 }).map((_, index) => (
        <div
          key={index}
          className="aspect-square animate-pulse rounded-sm bg-zinc-100"
        />
      ))}
    </section>
  );
}
