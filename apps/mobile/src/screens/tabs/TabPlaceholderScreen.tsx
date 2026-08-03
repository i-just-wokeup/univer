import type { ComponentType } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { LucideProps } from "lucide-react-native";

import { colors } from "../../lib/theme";

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
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.logo}>KREW</Text>
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  logo: {
    color: colors.accent,
    fontSize: 32,
    fontWeight: "900",
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
    backgroundColor: colors.card,
  },
  title: {
    marginTop: 18,
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  description: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    textAlign: "center",
  },
});
