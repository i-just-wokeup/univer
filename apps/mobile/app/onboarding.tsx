import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useSession } from "../src/lib/session";
import { colors } from "../src/lib/theme";
import { OnboardingScreen } from "../src/screens/auth/OnboardingScreen";

export default function OnboardingRoute() {
  const { isOnboardingLoading, requiresOnboarding, session } = useSession();

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (isOnboardingLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!requiresOnboarding) {
    return <Redirect href="/" />;
  }

  return <OnboardingScreen />;
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
});
