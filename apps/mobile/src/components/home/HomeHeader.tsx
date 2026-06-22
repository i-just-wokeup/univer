import { Bell, MessageCircle, Plus } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../lib/theme";

type HomeHeaderProps = {
  onSignOut: () => void;
};

export function HomeHeader({ onSignOut }: HomeHeaderProps) {
  return (
    <View style={styles.headerArea}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>KREW</Text>
        <View style={styles.headerActions}>
          <View style={styles.circleButton}>
            <Bell color={colors.text} size={27} strokeWidth={2.6} />
          </View>
          <Pressable onLongPress={onSignOut} style={styles.circleButton}>
            <MessageCircle color={colors.text} size={28} strokeWidth={2.6} />
          </Pressable>
        </View>
      </View>
      <View style={styles.storyRow}>
        <View style={styles.storyCard}>
          <View style={styles.storyPlus}>
            <Plus color={colors.white} size={30} strokeWidth={2.6} />
          </View>
          <Text style={styles.storyLabel}>내 스토리</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerArea: {
    paddingBottom: 14,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 18,
    paddingTop: 12,
  },
  logo: {
    color: colors.accent,
    fontSize: 32,
    fontWeight: "900",
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  circleButton: {
    height: 52,
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: colors.white,
  },
  storyRow: {
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
  storyCard: {
    height: 176,
    width: 128,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#D9CCFA",
    borderRadius: 28,
    borderWidth: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  storyPlus: {
    height: 52,
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: colors.accent,
  },
  storyLabel: {
    marginTop: 14,
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
});
