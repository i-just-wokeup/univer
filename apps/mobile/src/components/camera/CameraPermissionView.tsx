import type { PermissionResponse } from "expo-camera";
import { X } from "lucide-react-native";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fontSize,
  fontWeight,
  useTheme,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type CameraPermissionViewProps = {
  alternativeSlot?: ReactNode;
  onClose: () => void;
  onRequestPermission: () => void;
  permission: PermissionResponse | null;
};

export function CameraPermissionView({
  alternativeSlot,
  onClose,
  onRequestPermission,
  permission,
}: CameraPermissionViewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <SafeAreaView style={styles.screen}>
      <Pressable
        accessibilityLabel="카메라 닫기"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onClose}
        style={styles.closeButton}
      >
        <X color={colors.onMediaGlyph} size={27} strokeWidth={2.5} />
      </Pressable>
      <View style={styles.content}>
        {!permission ? (
          <ActivityIndicator color={colors.onMediaGlyph} size="large" />
        ) : (
          <>
            <Text style={styles.title}>카메라 권한이 필요합니다</Text>
            <Text style={styles.description}>
              사진을 촬영하려면 카메라 접근을 허용해 주세요.
            </Text>
            <Pressable
              accessibilityLabel={
                permission.canAskAgain ? "카메라 권한 허용" : "앱 설정 열기"
              }
              accessibilityRole="button"
              onPress={() => {
                if (permission.canAskAgain) {
                  onRequestPermission();
                  return;
                }
                void Linking.openSettings();
              }}
              style={({ pressed }) => [
                styles.permissionButton,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.permissionButtonText}>
                {permission.canAskAgain
                  ? "카메라 권한 허용"
                  : "설정에서 권한 허용"}
              </Text>
            </Pressable>
            {alternativeSlot}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.black,
    },
    closeButton: {
      position: "absolute",
      top: 8,
      left: 16,
      zIndex: 1,
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 22,
      backgroundColor: c.scrimWeak,
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 32,
    },
    title: {
      color: c.white,
      fontSize: fontSize.heading,
      fontWeight: fontWeight.bold,
      textAlign: "center",
    },
    description: {
      color: c.onMediaText,
      fontSize: fontSize.bodySmall,
      fontWeight: fontWeight.regular,
      lineHeight: 21,
      textAlign: "center",
    },
    permissionButton: {
      marginTop: 8,
      borderRadius: 12,
      backgroundColor: c.onMediaFillStrong,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    permissionButtonText: {
      color: c.black,
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
    },
    pressed: {
      opacity: 0.72,
    },
  });
