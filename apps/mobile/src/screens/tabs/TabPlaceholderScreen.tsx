import type { ComponentType } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { LucideProps } from "lucide-react-native";

import { useTheme, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { Logo } from "../../components/common/Logo";

type TabPlaceholderScreenProps = {
  description: string;
  icon: ComponentType<LucideProps>;
  title: string;
};

export function TabPlaceholderScreen({
  description,
  icon: Icon,
  title,
}: TabPlaceholderScreenProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Logo height={30} />
      </View>
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Icon color={colors.accent} size={34} strokeWidth={2.6} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.accentSoft,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 96,
  },
  iconBox: {
    height: 72,
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    backgroundColor: c.card,
  },
  title: {
    marginTop: 18,
    color: c.text,
    fontSize: fontSize.headingLarge,
    fontWeight: fontWeight.heavy,
    textAlign: "center",
  },
  description: {
    marginTop: 8,
    color: c.muted,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semibold,
    lineHeight: 21,
    textAlign: "center",
  },
});
