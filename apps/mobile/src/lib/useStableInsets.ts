import { useRef } from "react";
import {
  type EdgeInsets,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// SDK 54 Android 엣지투엣지에서 백그라운드 복귀 시 safe-area inset이 잠깐 0으로
// 빠지면서 입력창/상태바가 시스템바를 침범하는 문제를 막는다.
// 현재 값이 0이 아니면 그대로 쓰고, 0으로 빠진 순간에만 마지막 정상값으로 대체한다.
export function useStableInsets(): EdgeInsets {
  const insets = useSafeAreaInsets();
  const lastRef = useRef<EdgeInsets>(insets);

  function pick(current: number, key: keyof EdgeInsets) {
    if (current > 0) {
      lastRef.current[key] = current;
      return current;
    }
    return lastRef.current[key];
  }

  return {
    bottom: pick(insets.bottom, "bottom"),
    left: pick(insets.left, "left"),
    right: pick(insets.right, "right"),
    top: pick(insets.top, "top"),
  };
}
