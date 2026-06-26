import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GoogleAuthButton } from "../../components/auth/GoogleAuthButton";
import { signInWithGoogle } from "../../features/auth/googleSignIn";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { colors } from "../../lib/theme";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSignIn() {
    if (isSubmitting || isGoogleSubmitting) {
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    const { error } = await getSupabaseMobileClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setErrorMessage("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    setIsSubmitting(false);
  }

  async function handleGoogleSignIn() {
    if (isSubmitting || isGoogleSubmitting) {
      return;
    }

    setErrorMessage("");
    setIsGoogleSubmitting(true);

    try {
      const result = await signInWithGoogle();
      if (result.cancelled) {
        return;
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Google 로그인에 실패했습니다.",
      );
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.card}>
          <Text style={styles.logo}>KREW</Text>
          <Text style={styles.title}>학교 이메일 로그인</Text>
          <Text style={styles.description}>
            국민대학교 이메일과 비밀번호로 로그인합니다.
          </Text>

          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="example@kookmin.ac.kr"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            value={email}
          />
          <TextInput
            onChangeText={setPassword}
            placeholder="비밀번호"
            placeholderTextColor={colors.textFaint}
            secureTextEntry
            style={styles.input}
            value={password}
          />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <Pressable
            disabled={isSubmitting || isGoogleSubmitting}
            onPress={handleSignIn}
            style={[
              styles.primaryButton,
              isSubmitting || isGoogleSubmitting ? styles.disabled : null,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? "로그인 중..." : "로그인"}
            </Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.divider} />
          </View>

          <GoogleAuthButton
            disabled={isSubmitting || isGoogleSubmitting}
            label={
              isGoogleSubmitting ? "Google 로그인 중..." : "학교 Google 계정으로 계속"
            }
            onPress={handleGoogleSignIn}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  keyboardView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
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
  input: {
    height: 52,
    marginTop: 14,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: colors.white,
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 16,
  },
  errorText: {
    marginTop: 12,
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700",
  },
  primaryButton: {
    height: 52,
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.accent,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.6,
  },
  divider: {
    height: 1,
    flex: 1,
    backgroundColor: colors.border,
  },
  dividerRow: {
    marginVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerText: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "800",
  },
});
