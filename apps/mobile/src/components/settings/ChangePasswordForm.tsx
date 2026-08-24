import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  fontSize,
  fontWeight,
  useTheme,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type ChangePasswordFormProps = {
  currentPassword: string;
  errorMessage: string;
  isSubmitting: boolean;
  newPassword: string;
  newPasswordConfirmation: string;
  onChangeCurrentPassword: (value: string) => void;
  onChangeNewPassword: (value: string) => void;
  onChangeNewPasswordConfirmation: (value: string) => void;
  onSubmit: () => void;
};

type PasswordFieldProps = {
  autoComplete: "current-password" | "new-password";
  disabled: boolean;
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
};

function PasswordField({
  autoComplete,
  disabled,
  label,
  onChangeText,
  placeholder,
  value,
}: PasswordFieldProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        autoComplete={autoComplete}
        autoCorrect={false}
        editable={!disabled}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        secureTextEntry
        style={styles.input}
        value={value}
      />
    </View>
  );
}

export function ChangePasswordForm({
  currentPassword,
  errorMessage,
  isSubmitting,
  newPassword,
  newPasswordConfirmation,
  onChangeCurrentPassword,
  onChangeNewPassword,
  onChangeNewPasswordConfirmation,
  onSubmit,
}: ChangePasswordFormProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.card}>
      <PasswordField
        autoComplete="current-password"
        disabled={isSubmitting}
        label="현재 비밀번호"
        onChangeText={onChangeCurrentPassword}
        placeholder="현재 비밀번호"
        value={currentPassword}
      />
      <PasswordField
        autoComplete="new-password"
        disabled={isSubmitting}
        label="새 비밀번호"
        onChangeText={onChangeNewPassword}
        placeholder="8자 이상, 영문과 숫자 포함"
        value={newPassword}
      />
      <PasswordField
        autoComplete="new-password"
        disabled={isSubmitting}
        label="새 비밀번호 확인"
        onChangeText={onChangeNewPasswordConfirmation}
        placeholder="새 비밀번호 다시 입력"
        value={newPasswordConfirmation}
      />

      {errorMessage ? (
        <Text accessibilityLiveRegion="polite" style={styles.errorText}>
          {errorMessage}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={isSubmitting}
        onPress={onSubmit}
        style={({ pressed }) => [
          styles.submitButton,
          pressed && !isSubmitting ? styles.pressed : null,
          isSubmitting ? styles.disabled : null,
        ]}
      >
        <Text style={styles.submitText}>
          {isSubmitting ? "변경 중..." : "비밀번호 변경"}
        </Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    borderRadius: 22,
    backgroundColor: c.card,
    padding: 18,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 8,
    color: c.text,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
  },
  input: {
    height: 50,
    borderColor: c.border,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: c.navBackground,
    color: c.text,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
    paddingHorizontal: 14,
  },
  errorText: {
    marginBottom: 14,
    color: c.danger,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    lineHeight: 20,
  },
  submitButton: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: c.accent,
  },
  submitText: {
    color: c.onAccent,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.bold,
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.5,
  },
});
