import type { ComponentProps, ReactNode } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ModalProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemedStyles, type ThemeColors } from "../../lib/theme";

type AnimatedViewStyle = ComponentProps<typeof Animated.View>["style"];

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  animationType?: ModalProps["animationType"];
  statusBarTranslucent?: boolean;
  dismissOnBackdropPress?: boolean;
  onBackdropPress?: () => void;
  backdropLabel?: string;
  backdropStyle?: AnimatedViewStyle;
  containerStyle?: StyleProp<ViewStyle>;
  sheetStyle?: AnimatedViewStyle;
  safeAreaBottom?: boolean;
  bottomPadding?: number;
  showHandle?: boolean;
  handleStyle?: StyleProp<ViewStyle>;
  overlayContent?: ReactNode;
};

// 제스처·열림 상태는 호출부 소유다. 껍데기는 Animated 값을 초기화하지 않는다.
export function BottomSheet({
  visible,
  onClose,
  children,
  animationType = "slide",
  statusBarTranslucent = false,
  dismissOnBackdropPress = true,
  onBackdropPress = onClose,
  backdropLabel = "닫기",
  backdropStyle,
  containerStyle,
  sheetStyle,
  safeAreaBottom = true,
  bottomPadding = 12,
  showHandle = false,
  handleStyle,
  overlayContent,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);

  return (
    <Modal
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent={statusBarTranslucent}
      transparent
      visible={visible}
    >
      <View accessibilityViewIsModal style={[styles.container, containerStyle]}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          {dismissOnBackdropPress ? (
            <Pressable
              accessibilityLabel={backdropLabel}
              accessibilityRole="button"
              onPress={onBackdropPress}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            styles.corners,
            safeAreaBottom
              ? { paddingBottom: Math.max(insets.bottom, bottomPadding) }
              : null,
          ]}
        >
          {showHandle ? <View style={[styles.handle, handleStyle]} /> : null}
          {children}
        </Animated.View>
        {overlayContent}
      </View>
    </Modal>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: c.scrimMed,
  },
  sheet: {
    backgroundColor: c.navBackground,
  },
  corners: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: c.overlayInkStrong,
  },
});
