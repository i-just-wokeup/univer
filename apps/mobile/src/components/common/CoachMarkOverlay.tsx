import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from "react-native";

import type { CoachMarkRect } from "../../lib/coachMarks";
import { colors, fontSize, fontWeight } from "../../lib/theme";

type CoachMarkOverlayProps = {
  isLastStep: boolean;
  message: string;
  onNext: () => void;
  onSkip: () => void;
  stepIndex: number;
  targetRect: CoachMarkRect | null;
  totalSteps: number;
  visible: boolean;
};

const EDGE_GAP = 16;
const HIGHLIGHT_PADDING = 6;
const TOOLTIP_ESTIMATED_HEIGHT = 152;
const TOOLTIP_GAP = 12;
const TOOLTIP_MAX_WIDTH = 340;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function CoachMarkOverlay({
  isLastStep,
  message,
  onNext,
  onSkip,
  stepIndex,
  targetRect,
  totalSteps,
  visible,
}: CoachMarkOverlayProps) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const [tooltipHeight, setTooltipHeight] = useState(
    TOOLTIP_ESTIMATED_HEIGHT,
  );

  const layout = useMemo(() => {
    if (!targetRect) {
      return null;
    }

    const left = clamp(targetRect.x - HIGHLIGHT_PADDING, 0, screenWidth);
    const top = clamp(targetRect.y - HIGHLIGHT_PADDING, 0, screenHeight);
    const right = clamp(
      targetRect.x + targetRect.width + HIGHLIGHT_PADDING,
      0,
      screenWidth,
    );
    const bottom = clamp(
      targetRect.y + targetRect.height + HIGHLIGHT_PADDING,
      0,
      screenHeight,
    );
    const tooltipWidth = Math.min(
      TOOLTIP_MAX_WIDTH,
      screenWidth - EDGE_GAP * 2,
    );
    const tooltipLeft = clamp(
      (left + right) / 2 - tooltipWidth / 2,
      EDGE_GAP,
      screenWidth - tooltipWidth - EDGE_GAP,
    );
    const placeBelow = (top + bottom) / 2 < screenHeight / 2;
    const preferredTop = placeBelow
      ? bottom + TOOLTIP_GAP
      : top - tooltipHeight - TOOLTIP_GAP;
    const tooltipTop = clamp(
      preferredTop,
      EDGE_GAP,
      screenHeight - tooltipHeight - EDGE_GAP,
    );

    return {
      bottom,
      height: bottom - top,
      left,
      right,
      top,
      tooltipLeft,
      tooltipTop,
      tooltipWidth,
      width: right - left,
    };
  }, [screenHeight, screenWidth, targetRect, tooltipHeight]);

  const handleTooltipLayout = (event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;

    if (nextHeight !== tooltipHeight) {
      setTooltipHeight(nextHeight);
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onSkip}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible && layout !== null}
    >
      {layout ? (
        <View accessibilityViewIsModal style={styles.overlay}>
          <View
            style={[styles.scrim, styles.topScrim, { height: layout.top }]}
          />
          <View
            style={[
              styles.scrim,
              {
                height: layout.height,
                left: 0,
                top: layout.top,
                width: layout.left,
              },
            ]}
          />
          <View
            style={[
              styles.scrim,
              {
                height: layout.height,
                left: layout.right,
                right: 0,
                top: layout.top,
              },
            ]}
          />
          <View
            style={[
              styles.scrim,
              {
                bottom: 0,
                left: 0,
                right: 0,
                top: layout.bottom,
              },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.highlight,
              {
                height: layout.height,
                left: layout.left,
                top: layout.top,
                width: layout.width,
              },
            ]}
          />
          <View
            accessibilityLabel={`${stepIndex + 1}/${totalSteps}. ${message}`}
            onLayout={handleTooltipLayout}
            style={[
              styles.tooltip,
              {
                left: layout.tooltipLeft,
                top: layout.tooltipTop,
                width: layout.tooltipWidth,
              },
            ]}
          >
            <Text style={styles.progress}>
              {stepIndex + 1}/{totalSteps}
            </Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={onSkip}
                style={({ pressed }) => [
                  styles.skipButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.skipText}>건너뛰기</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onNext}
                style={({ pressed }) => [
                  styles.nextButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.nextText}>
                  {isLastStep ? "시작하기" : "다음"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scrim: {
    position: "absolute",
    backgroundColor: colors.scrimHeavy,
  },
  topScrim: {
    top: 0,
    right: 0,
    left: 0,
  },
  highlight: {
    position: "absolute",
    borderColor: colors.white,
    borderRadius: 10,
    borderWidth: 2,
  },
  tooltip: {
    position: "absolute",
    borderRadius: 14,
    backgroundColor: colors.white,
    padding: 16,
  },
  progress: {
    color: colors.black,
    fontSize: fontSize.label,
    fontWeight: fontWeight.semibold,
    opacity: 0.55,
  },
  message: {
    marginTop: 8,
    color: colors.black,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.bold,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 18,
  },
  skipButton: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  skipText: {
    color: colors.black,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semibold,
    opacity: 0.6,
  },
  nextButton: {
    minHeight: 40,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.black,
    paddingHorizontal: 18,
  },
  nextText: {
    color: colors.white,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.bold,
  },
  pressed: {
    opacity: 0.72,
  },
});
