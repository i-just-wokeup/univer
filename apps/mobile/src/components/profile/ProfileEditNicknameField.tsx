import { StyleSheet, Text, TextInput, View } from "react-native";

import type { NicknameStatus } from "../../features/profile/useProfileEdit";
import { noAutofillTextInputProps } from "../../lib/textInput";
import { colors } from "../../lib/theme";

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
  const isInvalid = status === "duplicate" || status === "invalid";

  return (
    <View style={styles.field}>
      <Text style={styles.label}>닉네임</Text>
      <TextInput
        {...noAutofillTextInputProps}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={30}
        onChangeText={onChangeNickname}
        placeholder="nickname"
        placeholderTextColor={colors.textFaint}
        style={styles.input}
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

const styles = StyleSheet.create({
  field: {
    marginTop: 20,
  },
  label: {
    marginBottom: 8,
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  helper: {
    marginTop: 7,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  success: {
    color: colors.accent,
  },
  error: {
    color: colors.danger,
  },
});
