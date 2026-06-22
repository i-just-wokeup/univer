import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { LoginScreen } from "../screens/auth/LoginScreen";
import { HomeScreen } from "../screens/home/HomeScreen";
import {
  getSupabaseMobileClient,
  isSupabaseConfigured,
} from "../lib/supabase";
import { colors } from "../lib/theme";

export function AppRoot() {
  const supabase = useMemo(
    () => (isSupabaseConfigured() ? getSupabaseMobileClient() : null),
    [],
  );
  const [isLoadingSession, setIsLoadingSession] = useState(Boolean(supabase));
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setUserEmail(data.session?.user.email ?? null);
      setIsLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
      setIsLoadingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (!supabase) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.logo}>KREW</Text>
          <Text style={styles.title}>앱 환경변수가 필요합니다</Text>
          <Text style={styles.description}>
            apps/mobile/.env.local에 EXPO_PUBLIC_SUPABASE_URL과
            EXPO_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.
          </Text>
        </View>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  if (isLoadingSession) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.accent} />
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <>
      {userEmail ? (
        <HomeScreen userEmail={userEmail} />
      ) : (
        <LoginScreen />
      )}
      <StatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
    padding: 20,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderColor: "rgba(124,58,237,0.1)",
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: colors.card,
    padding: 24,
  },
  logo: {
    color: colors.accent,
    fontSize: 34,
    fontWeight: "900",
  },
  title: {
    marginTop: 28,
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  description: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
  },
});
