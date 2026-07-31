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
import { colors } from "../../lib/theme";

type ProfileEditBioFieldProps = {
  bio: string;
  onChangeBio: (value: string) => void;
};

export function ProfileEditBioField({
  bio,
  onChangeBio,
}: ProfileEditBioFieldProps) {
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
  bioValueButton: {
    minHeight: 92,
    justifyContent: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  bioValueText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
  },
  placeholder: {
    color: colors.textFaint,
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
    backgroundColor: colors.scrimMed,
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 24,
    backgroundColor: colors.white,
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
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  modalCounter: {
    marginTop: 3,
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "800",
  },
  doneButton: {
    minHeight: 36,
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
  },
  doneText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
});
