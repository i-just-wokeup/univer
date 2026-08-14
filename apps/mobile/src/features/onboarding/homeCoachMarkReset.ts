import { clearStoredHomeCoachMarkComplete } from "./homeCoachMarkStorage";

type HomeCoachMarkResetListener = (userId: string) => void;

const listeners = new Set<HomeCoachMarkResetListener>();

export async function resetHomeCoachMarksForDevelopment(
  userId: string,
): Promise<void> {
  if (!__DEV__ || !userId) {
    return;
  }

  await clearStoredHomeCoachMarkComplete(userId);
  listeners.forEach((listener) => listener(userId));
}

export function subscribeHomeCoachMarkReset(
  listener: HomeCoachMarkResetListener,
): () => void {
  if (!__DEV__) {
    return () => undefined;
  }

  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
