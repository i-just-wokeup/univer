import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../lib/theme";

type ScreenHeaderProps = {
  // 없으면 뒤로가기 버튼 대신 빈 공간을 둬서 title이 가운데 정렬을 유지한다(루트 탭 헤더용).
  onBack?: () => void;
  right?: ReactNode;
  title: string;
};

export function ScreenHeader({ onBack, right, title }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.headerButton}>
          <ChevronLeft color={colors.text} size={22} strokeWidth={2.4} />
        </Pressable>
      ) : (
        <View style={styles.headerSpacer} />
      )}
      <Text numberOfLines={1} style={styles.headerTitle}>
        {title}
      </Text>
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
    backgroundColor: colors.white,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 12,
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
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
