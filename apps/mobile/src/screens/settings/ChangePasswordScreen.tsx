import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FeedbackToast } from "../../components/common/FeedbackToast";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { ScreenHeader } from "../../components/common/ScreenHeader";
import { ChangePasswordForm } from "../../components/settings/ChangePasswordForm";
import { useChangePassword } from "../../features/auth/useChangePassword";
import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

const SUCCESS_NAVIGATION_DELAY_MS = 900;

export function ChangePasswordScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const form = useChangePassword();

  useEffect(() => {
    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
    };
  }, []);

  async function handleSubmit() {
    const didChangePassword = await form.submit();
    if (!didChangePassword) {
      return;
    }

    setSuccessMessage("비밀번호가 변경되었습니다.");
    navigationTimerRef.current = setTimeout(() => {
      router.back();
    }, SUCCESS_NAVIGATION_DELAY_MS);
  }

  return (
    <ScreenContainer
      contentBackgroundColor={colors.accentSoft}
      style={styles.screen}
    >
      <ScreenHeader onBack={() => router.back()} themed title="비밀번호 변경" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ChangePasswordForm
            currentPassword={form.currentPassword}
            errorMessage={form.errorMessage}
            isSubmitting={form.isSubmitting}
            newPassword={form.newPassword}
            newPasswordConfirmation={form.newPasswordConfirmation}
            onChangeCurrentPassword={form.setCurrentPassword}
            onChangeNewPassword={form.setNewPassword}
            onChangeNewPasswordConfirmation={form.setNewPasswordConfirmation}
            onSubmit={() => {
              void handleSubmit();
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <FeedbackToast
        bottom={insets.bottom + 24}
        message={successMessage}
        onDismiss={() => setSuccessMessage("")}
        type="success"
      />
    </ScreenContainer>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.accentSoft,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
});
