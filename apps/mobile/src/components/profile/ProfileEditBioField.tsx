import { StyleSheet, Text, TextInput, View } from "react-native";

import { BIO_MAX_LENGTH } from "../../features/profile/useProfileEdit";
import { noAutofillTextInputProps } from "../../lib/textInput";
import { useTheme, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type ProfileEditBioFieldProps = {
  bio: string;
  onChangeBio: (value: string) => void;
};

export function ProfileEditBioField({
  bio,
  onChangeBio,
}: ProfileEditBioFieldProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>한 줄 소개</Text>
        <Text style={styles.counter}>
          {bio.length}/{BIO_MAX_LENGTH}
        </Text>
      </View>
      {/* 의도: 그 자리에서 바로 입력한다. 2026-09-14 이전에는 눌러야 Modal 이
          열리는 구조였는데, 한 단계가 불필요한데다 Modal 안 autoFocus 가 먹지 않아
          키보드가 올라오지 않았다. 다시 Modal 로 감싸지 말 것. */}
      <TextInput
        {...noAutofillTextInputProps}
        maxLength={BIO_MAX_LENGTH}
        multiline
        onChangeText={onChangeBio}
        placeholder="나를 소개해보세요."
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        textAlignVertical="top"
        value={bio}
      />
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: c.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
  },
  counter: {
    color: c.textFaint,
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.medium,
  },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 16,
    backgroundColor: c.navBackground,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: c.text,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },
});
