import BottomSheet from "@gorhom/bottom-sheet";
import { useCallback, useMemo, useRef, useState } from "react";
import type { ComponentRef } from "react";
import type { LayoutChangeEvent } from "react-native";

type UsePostMediaPickerSheetParams = {
  gridItemSize: number;
  previewAspectRatio: number;
  toolbarHeight: number;
  width: number;
};

export function usePostMediaPickerSheet({
  gridItemSize,
  previewAspectRatio,
  toolbarHeight,
  width,
}: UsePostMediaPickerSheetParams) {
  const sheetRef = useRef<ComponentRef<typeof BottomSheet>>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const previewHeight = width / previewAspectRatio;
  const minimumSheetHeight = toolbarHeight + gridItemSize;
  const collapsedSheetHeight = Math.min(
    Math.max(containerHeight - 1, 1),
    Math.max(minimumSheetHeight, containerHeight - previewHeight),
  );
  const snapPoints = useMemo(
    () => [collapsedSheetHeight, containerHeight],
    [collapsedSheetHeight, containerHeight],
  );

  const collapse = useCallback(() => {
    requestAnimationFrame(() => {
      sheetRef.current?.collapse();
    });
  }, []);

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    setContainerHeight((currentHeight) =>
      currentHeight === nextHeight ? currentHeight : nextHeight,
    );
  }, []);

  return {
    collapse,
    handleContainerLayout,
    isReady: containerHeight > 1,
    sheetRef,
    snapPoints,
  };
}
