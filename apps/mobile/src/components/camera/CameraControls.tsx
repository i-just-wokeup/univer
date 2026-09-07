import type { CameraType, FlashMode } from "expo-camera";
import { SwitchCamera, X, Zap, ZapOff } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type CameraControlsProps = {
  bottomLeftSlot?: ReactNode;
  facing: CameraType;
  flash: FlashMode;
  isCameraReady: boolean;
  isCapturing: boolean;
  onCapture: () => void;
  onClose: () => void;
  onSwitchCamera: () => void;
  onToggleFlash: () => void;
};

export function CameraControls({
  bottomLeftSlot,
  facing,
  flash,
  isCameraReady,
  isCapturing,
  onCapture,
  onClose,
  onSwitchCamera,
  onToggleFlash,
}: CameraControlsProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const shutterDisabled = !isCameraReady || isCapturing;

  return (
    <>
      <SafeAreaView edges={["top"]} style={styles.topControls}>
        <Pressable
          accessibilityLabel="카메라 닫기"
          accessibilityRole="button"
          hitSlop={10}
          onPress={onClose}
          style={({ pressed }) => [
            styles.iconButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <X color={colors.onMediaGlyph} size={27} strokeWidth={2.5} />
        </Pressable>
        {facing === "back" ? (
          <Pressable
            accessibilityLabel={
              flash === "on" ? "플래시 끄기" : "플래시 켜기"
            }
            accessibilityRole="button"
            hitSlop={10}
            onPress={onToggleFlash}
            style={({ pressed }) => [
              styles.iconButton,
              pressed ? styles.pressed : null,
            ]}
          >
            {flash === "on" ? (
              <Zap
                color={colors.onMediaGlyph}
                fill={colors.onMediaGlyph}
                size={24}
              />
            ) : (
              <ZapOff
                color={colors.onMediaGlyph}
                size={24}
                strokeWidth={2.4}
              />
            )}
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </SafeAreaView>

      <SafeAreaView edges={["bottom"]} style={styles.bottomControls}>
        {bottomLeftSlot ?? <View style={styles.controlPlaceholder} />}
        <Pressable
          accessibilityLabel="사진 촬영"
          accessibilityRole="button"
          disabled={shutterDisabled}
          onPress={onCapture}
          style={({ pressed }) => [
            styles.captureOuter,
            shutterDisabled ? styles.disabled : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <View style={styles.captureInner} />
        </Pressable>
        <Pressable
          accessibilityLabel="전후면 카메라 전환"
          accessibilityRole="button"
          disabled={isCapturing}
          onPress={onSwitchCamera}
          style={({ pressed }) => [
            styles.sideButton,
            isCapturing ? styles.disabled : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <SwitchCamera
            color={colors.onMediaGlyph}
            size={28}
            strokeWidth={2.2}
          />
        </Pressable>
      </SafeAreaView>
    </>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    topControls: {
      position: "absolute",
      top: 0,
      right: 0,
      left: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 8,
      paddingHorizontal: 16,
    },
    iconButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 22,
      backgroundColor: c.scrimWeak,
    },
    iconPlaceholder: {
      width: 44,
      height: 44,
    },
    bottomControls: {
      position: "absolute",
      right: 0,
      bottom: 0,
      left: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 32,
      paddingBottom: 20,
    },
    controlPlaceholder: {
      width: 52,
      height: 52,
    },
    sideButton: {
      width: 52,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 26,
      backgroundColor: c.scrimWeak,
    },
    captureOuter: {
      width: 78,
      height: 78,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 39,
      borderWidth: 4,
      borderColor: c.onMediaBorder,
      backgroundColor: c.onMediaFill,
    },
    captureInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.onMediaFillStrong,
    },
    disabled: {
      opacity: 0.45,
    },
    pressed: {
      opacity: 0.72,
    },
  });
