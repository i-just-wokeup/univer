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
  const [isEditing, setIsEditing] = useState(false);
  const isInvalid = status === "duplicate" || status === "invalid";

  return (
    <View style={styles.field}>
      <Text style={styles.label}>닉네임</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setIsEditing(true)}
        style={({ pressed }) => [styles.valueButton, pressed ? styles.pressed : null]}
      >
        <Text style={styles.valueText}>{nickname || "닉네임을 입력하세요"}</Text>
      </Pressable>
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
              accessibilityLabel="닉네임 편집 닫기"
              accessibilityRole="button"
              onPress={() => setIsEditing(false)}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>닉네임 수정</Text>
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
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                maxLength={30}
                onChangeText={onChangeNickname}
                placeholder="닉네임을 입력하세요"
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
  valueButton: {
    minHeight: 48,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
  },
  valueText: {
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
  pressed: {
    opacity: 0.72,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
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
