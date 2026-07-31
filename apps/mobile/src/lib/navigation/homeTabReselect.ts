type HomeTabReselectListener = () => void;

const listeners = new Set<HomeTabReselectListener>();

export function emitHomeTabReselect(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeHomeTabReselect(
  listener: HomeTabReselectListener,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
