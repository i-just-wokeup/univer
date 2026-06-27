import { useRouter } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "../../components/common/Avatar";
import { ScreenHeader } from "../../components/common/ScreenHeader";
import { StateView } from "../../components/common/StateView";
import {
  BIO_MAX_LENGTH,
  MAX_PROFILE_LINKS,
  useProfileEdit,
} from "../../features/profile/useProfileEdit";
import { colors } from "../../lib/theme";

export function ProfileEditScreen() {
  const router = useRouter();
  const {
    avatarUrl,
    bio,
    canSave,
    department,
    errorMessage,
    handleAddLink,
    handleChangeLink,
    handleChangeNickname,
    handlePickAvatar,
    handleRemoveLink,
    hasInvalidLink,
    isLoading,
    isSaving,
    nickname,
    nicknameMessage,
    nicknameStatus,
    profileLinks,
    retry,
    save,
    setBio,
  } = useProfileEdit();

  async function handleSave() {
    const saved = await save();
    if (saved) {
      router.back();
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={["top"]} style={styles.screen}>
        <ScreenHeader onBack={() => router.back()} title="프로필 편집" />
        <StateView
          message="현재 프로필 정보를 불러오는 중입니다."
          title="프로필 준비 중"
          type="loading"
        />
      </SafeAreaView>
    );
  }

  if (errorMessage && !nickname) {
    return (
      <SafeAreaView edges={["top"]} style={styles.screen}>
        <ScreenHeader onBack={() => router.back()} title="프로필 편집" />
        <StateView
          actionLabel="다시 시도"
          message={errorMessage}
          onAction={retry}
          title="프로필을 불러오지 못했습니다"
          type="error"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScreenHeader
        onBack={() => router.back()}
        right={
          <Pressable
            accessibilityRole="button"
            disabled={!canSave}
            onPress={() => {
              void handleSave();
            }}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && canSave ? styles.pressed : null,
              !canSave ? styles.disabled : null,
            ]}
          >
            <Text style={styles.saveText}>{isSaving ? "..." : "저장"}</Text>
          </Pressable>
        }
        title="프로필 편집"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void handlePickAvatar();
              }}
              style={({ pressed }) => [
                styles.avatarButton,
                pressed ? styles.pressed : null,
              ]}
            >
              <Avatar imageUrl={avatarUrl} label={nickname || "내"} size={86} />
              <Text style={styles.avatarText}>프로필 사진 변경</Text>
            </Pressable>

            <View style={styles.field}>
              <Text style={styles.label}>닉네임</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
                onChangeText={handleChangeNickname}
                placeholder="nickname"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                value={nickname}
              />
              {nicknameMessage ? (
                <Text
                  style={[
                    styles.helper,
                    nicknameStatus === "available" ? styles.success : null,
                    nicknameStatus === "duplicate" ||
                    nicknameStatus === "invalid"
                      ? styles.error
                      : null,
                  ]}
                >
                  {nicknameMessage}
                </Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>학과</Text>
              <Text style={styles.readOnlyText}>{department ?? "학과 없음"}</Text>
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>한 줄 소개</Text>
                <Text style={styles.counter}>
                  {bio.length}/{BIO_MAX_LENGTH}
                </Text>
              </View>
              <TextInput
                maxLength={BIO_MAX_LENGTH}
                multiline
                onChangeText={setBio}
                placeholder="나를 소개해보세요."
                placeholderTextColor={colors.textFaint}
                style={[styles.input, styles.bioInput]}
                textAlignVertical="top"
                value={bio}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>대표 링크</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={profileLinks.length >= MAX_PROFILE_LINKS}
                  onPress={handleAddLink}
                  style={({ pressed }) => [
                    styles.addLinkButton,
                    pressed ? styles.pressed : null,
                    profileLinks.length >= MAX_PROFILE_LINKS
                      ? styles.disabled
                      : null,
                  ]}
                >
                  <Plus color={colors.accent} size={16} strokeWidth={2.6} />
                  <Text style={styles.addLinkText}>추가</Text>
                </Pressable>
              </View>

              {profileLinks.map((link, index) => (
                <View key={index} style={styles.linkRow}>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    onChangeText={(value) => handleChangeLink(index, value)}
                    placeholder="https://example.com"
                    placeholderTextColor={colors.textFaint}
                    style={[styles.input, styles.linkInput]}
                    value={link}
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => handleRemoveLink(index)}
                    style={({ pressed }) => [
                      styles.removeLinkButton,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Trash2
                      color={colors.textFaint}
                      size={17}
                      strokeWidth={2.4}
                    />
                  </Pressable>
                </View>
              ))}
              {hasInvalidLink ? (
                <Text style={[styles.helper, styles.error]}>
                  올바른 링크를 입력해주세요.
                </Text>
              ) : null}
            </View>
          </View>

          {errorMessage ? (
            <Text style={styles.formError}>{errorMessage}</Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    borderRadius: 24,
    backgroundColor: colors.card,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  saveButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "900",
  },
  avatarButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  avatarText: {
    marginTop: 10,
    color: colors.accent,
    fontSize: 13,
    fontWeight: "900",
  },
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
  readOnlyText: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "rgba(124,58,237,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.muted,
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
  addLinkButton: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addLinkText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "900",
  },
  linkRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  linkInput: {
    flex: 1,
  },
  removeLinkButton: {
    height: 42,
    width: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  formError: {
    marginTop: 12,
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.45,
  },
});
