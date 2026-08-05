import { X } from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  fontSize,
  fontWeight,
  useTheme,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type PostMediaPickerHeaderProps = {
  canContinue: boolean;
  isPreparing: boolean;
  onClose: () => void;
  onNext: () => void;
};

export function PostMediaPickerHeader({
  canContinue,
  isPreparing,
  onClose,
  onNext,
}: PostMediaPickerHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="게시물 작성 닫기"
        accessibilityRole="button"
        disabled={isPreparing}
        hitSlop={8}
        onPress={onClose}
        style={({ pressed }) => [
          styles.sideButton,
          pressed ? styles.pressed : null,
        ]}
      >
        <X color={colors.text} size={26} strokeWidth={2.4} />
      </Pressable>

      <Text numberOfLines={1} style={styles.title}>
        새 게시물
      </Text>

      <Pressable
        accessibilityLabel="선택한 사진으로 다음 단계 이동"
        accessibilityRole="button"
        disabled={!canContinue}
        hitSlop={8}
        onPress={onNext}
        style={({ pressed }) => [
          styles.sideButton,
          pressed && canContinue ? styles.pressed : null,
        ]}
      >
        {isPreparing ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : (
          <Text
            style={[
              styles.nextText,
              !canContinue ? styles.nextTextDisabled : null,
            ]}
          >
            다음
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  header: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.accentSoft,
    paddingHorizontal: 12,
  },
  sideButton: {
    minHeight: 44,
    minWidth: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: c.text,
    fontSize: fontSize.title,
    fontWeight: fontWeight.heavy,
    textAlign: "center",
  },
  nextText: {
    color: c.accent,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
  nextTextDisabled: {
    color: c.textFaint,
  },
  pressed: {
    opacity: 0.6,
  },
});
