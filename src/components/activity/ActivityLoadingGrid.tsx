export function ActivityLoadingGrid() {
  return (
    <section className="grid grid-cols-3 gap-2 px-4 py-4">
      {Array.from({ length: 9 }).map((_, index) => (
        <div
          key={index}
          className="aspect-square animate-pulse rounded-[14px] bg-white/70 shadow-sm"
        />
      ))}
    </section>
  );
}
