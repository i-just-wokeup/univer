import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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
  const [isEditing, setIsEditing] = useState(false);
  const displayBio = bio.trim() || "나를 소개해보세요.";

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>한 줄 소개</Text>
        <Text style={styles.counter}>
          {bio.length}/{BIO_MAX_LENGTH}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => setIsEditing(true)}
        style={({ pressed }) => [
          styles.bioValueButton,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text
          numberOfLines={3}
          style={[styles.bioValueText, bio.trim() ? null : styles.placeholder]}
        >
          {displayBio}
        </Text>
      </Pressable>

      {isEditing ? (
        <Modal
          animationType="fade"
          onRequestClose={() => setIsEditing(false)}
          transparent
          visible
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalRoot}
          >
            <Pressable
              accessibilityLabel="한 줄 소개 편집 닫기"
              accessibilityRole="button"
              onPress={() => setIsEditing(false)}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>한 줄 소개</Text>
                  <Text style={styles.modalCounter}>
                    {bio.length}/{BIO_MAX_LENGTH}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setIsEditing(false)}
                  style={({ pressed }) => [
                    styles.doneButton,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={styles.doneText}>완료</Text>
                </Pressable>
              </View>
              <TextInput
                {...noAutofillTextInputProps}
                autoFocus
                keyboardType="visible-password"
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
          </KeyboardAvoidingView>
        </Modal>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
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
    color: c.text,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
  },
  counter: {
    marginBottom: 8,
    color: c.textFaint,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
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
    fontWeight: fontWeight.bold,
  },
  bioValueButton: {
    minHeight: 92,
    justifyContent: "flex-start",
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 16,
    backgroundColor: c.navBackground,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  bioValueText: {
    color: c.text,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.bold,
    lineHeight: 21,
  },
  placeholder: {
    color: c.textFaint,
  },
  bioInput: {
    minHeight: 92,
    paddingTop: 13,
  },
  pressed: {
    opacity: 0.72,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: c.scrimMed,
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 24,
    backgroundColor: c.navBackground,
    padding: 18,
  },
  modalHeader: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  modalTitle: {
    color: c.text,
    fontSize: fontSize.titleSmall,
    fontWeight: fontWeight.heavy,
  },
  modalCounter: {
    marginTop: 3,
    color: c.textFaint,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
  },
  doneButton: {
    minHeight: 36,
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: c.accent,
    paddingHorizontal: 14,
  },
  doneText: {
    color: c.onAccent,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
  },
});
