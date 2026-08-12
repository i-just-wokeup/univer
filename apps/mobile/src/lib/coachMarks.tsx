import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type RefCallback,
} from "react";
import type { View } from "react-native";

export type CoachMarkRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type CoachMarkRegistryValue = {
  measureTarget: (targetId: string) => Promise<CoachMarkRect | null>;
  registerTarget: (targetId: string, node: View | null) => void;
  revision: number;
};

const CoachMarkRegistryContext = createContext<CoachMarkRegistryValue | null>(
  null,
);

export function CoachMarkRegistryProvider({ children }: PropsWithChildren) {
  const targetsRef = useRef(new Map<string, View>());
  const [revision, setRevision] = useState(0);

  const registerTarget = useCallback((targetId: string, node: View | null) => {
    const previous = targetsRef.current.get(targetId) ?? null;

    if (previous === node) {
      return;
    }

    if (node) {
      targetsRef.current.set(targetId, node);
    } else {
      targetsRef.current.delete(targetId);
    }

    setRevision((value) => value + 1);
  }, []);

  const measureTarget = useCallback(
    (targetId: string): Promise<CoachMarkRect | null> =>
      new Promise((resolve) => {
        const target = targetsRef.current.get(targetId);

        if (!target) {
          resolve(null);
          return;
        }

        target.measureInWindow((x, y, width, height) => {
          if (width <= 0 || height <= 0) {
            resolve(null);
            return;
          }

          resolve({ height, width, x, y });
        });
      }),
    [],
  );

  const value = useMemo(
    () => ({ measureTarget, registerTarget, revision }),
    [measureTarget, registerTarget, revision],
  );

  return (
    <CoachMarkRegistryContext.Provider value={value}>
      {children}
    </CoachMarkRegistryContext.Provider>
  );
}
export function useCoachMarkRegistry() {
  const context = useContext(CoachMarkRegistryContext);

  if (!context) {
    throw new Error(
      "useCoachMarkRegistry must be used within CoachMarkRegistryProvider",
    );
  }

  return context;
}

export function useCoachMarkTarget(targetId: string): RefCallback<View> {
  const { registerTarget } = useCoachMarkRegistry();

  return useCallback(
    (node) => {
      registerTarget(targetId, node);
    },
    [registerTarget, targetId],
  );
}
