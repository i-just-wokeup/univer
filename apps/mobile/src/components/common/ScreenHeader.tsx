import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors as lightColors, useTheme, fontSize, fontWeight } from "../../lib/theme";

type ScreenHeaderProps = {
  // 없으면 뒤로가기 버튼 대신 빈 공간을 둬서 title이 가운데 정렬을 유지한다(루트 탭 헤더용).
  onBack?: () => void;
  right?: ReactNode;
  themed?: boolean;
  title: string;
  titleAccessory?: ReactNode;
};

export function ScreenHeader({
  onBack,
  right,
  themed = false,
  title,
  titleAccessory,
}: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          style={[
            styles.headerButton,
            themed ? { backgroundColor: colors.navBackground } : null,
          ]}
        >
          <ChevronLeft
            color={themed ? colors.text : lightColors.text}
            size={22}
            strokeWidth={2.4}
          />
        </Pressable>
      ) : (
        <View style={styles.headerSpacer} />
      )}
      <View style={styles.titleSlot}>
        <Text
          numberOfLines={1}
          style={[styles.headerTitle, themed ? { color: colors.text } : null]}
        >
          {title}
        </Text>
        {titleAccessory ? (
          <View style={styles.titleAccessory}>{titleAccessory}</View>
        ) : null}
      </View>
      {right ? (
        <View style={styles.rightSlot}>{right}</View>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: lightColors.white,
  },
  headerTitle: {
    flexShrink: 1,
    color: lightColors.text,
    fontSize: fontSize.title,
    fontWeight: fontWeight.heavy,
    textAlign: "center",
  },
  titleSlot: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
  },
  titleAccessory: {
    flexShrink: 0,
    marginLeft: 4,
  },
  headerSpacer: {
    height: 40,
    width: 40,
  },
  rightSlot: {
    height: 40,
    width: 40,
  },
});
