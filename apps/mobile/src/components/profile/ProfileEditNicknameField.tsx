import { StyleSheet, Text, TextInput, View } from "react-native";

import type { NicknameStatus } from "../../features/profile/useProfileEdit";
import { noAutofillTextInputProps } from "../../lib/textInput";
import { useTheme, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type ProfileEditNicknameFieldProps = {
  message: string;
  nickname: string;
  onChangeNickname: (value: string) => void;
  status: NicknameStatus;
};

export function ProfileEditNicknameField({
  message,
  nickname,
  onChangeNickname,
  status,
}: ProfileEditNicknameFieldProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const isInvalid = status === "duplicate" || status === "invalid";

  return (
    <View style={styles.field}>
      <Text style={styles.label}>닉네임</Text>
      {/* 의도: 그 자리에서 바로 입력한다. 2026-09-14 이전에는 눌러야 Modal 이
          열리는 구조였는데, 한 단계가 불필요한데다 Modal 안 autoFocus 가 먹지 않아
          키보드가 올라오지 않았다. 다시 Modal 로 감싸지 말 것. */}
      <TextInput
        {...noAutofillTextInputProps}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={30}
        onChangeText={onChangeNickname}
        placeholder="닉네임을 입력하세요"
        placeholderTextColor={colors.textFaint}
        style={[styles.input, isInvalid ? styles.inputError : null]}
        value={nickname}
      />
      {message ? (
        <Text
          style={[
            styles.helper,
            status === "available" ? styles.success : null,
            isInvalid ? styles.error : null,
          ]}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    color: c.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 16,
    backgroundColor: c.navBackground,
    paddingHorizontal: 14,
    color: c.text,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
  },
  inputError: {
    borderColor: c.danger,
  },
  helper: {
    color: c.muted,
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.medium,
  },
  success: {
    color: c.success,
  },
  error: {
    color: c.danger,
  },
});
