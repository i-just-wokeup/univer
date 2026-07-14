import { StyleSheet, Text, TextInput, View } from "react-native";

import { BIO_MAX_LENGTH } from "../../features/profile/useProfileEdit";
import { noAutofillTextInputProps } from "../../lib/textInput";
import { colors } from "../../lib/theme";

type ProfileEditBioFieldProps = {
  bio: string;
  onChangeBio: (value: string) => void;
};

export function ProfileEditBioField({
  bio,
  onChangeBio,
}: ProfileEditBioFieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>한 줄 소개</Text>
        <Text style={styles.counter}>
          {bio.length}/{BIO_MAX_LENGTH}
        </Text>
      </View>
      <TextInput
        {...noAutofillTextInputProps}
        maxLength={BIO_MAX_LENGTH}
        multiline
        onChangeText={onChangeBio}
        placeholder="나를 소개해보세요."
        placeholderTextColor={colors.textFaint}
        style={[styles.input, styles.bioInput]}
        textAlignVertical="top"
        value={bio}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginTop: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    marginBottom: 8,
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  counter: {
    marginBottom: 8,
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "800",
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
  bioInput: {
    minHeight: 92,
    paddingTop: 13,
  },
});
