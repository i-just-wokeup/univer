import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getProfile } from "../../features/profile/api";
import {
  checkNicknameDuplicate,
  updateProfile,
  uploadAvatar,
} from "../../features/profile/mutations";
import { colors } from "../../lib/theme";
import { isValidNickname, normalizeNickname } from "../../lib/utils/nickname";
import { normalizeProfileLinks } from "../../lib/utils/profileLinks";

const BIO_MAX_LENGTH = 60;
const MAX_PROFILE_LINKS = 5;

type NicknameStatus = "idle" | "checking" | "available" | "duplicate" | "invalid";

function getNicknameMessage(status: NicknameStatus) {
  switch (status) {
    case "checking":
      return "닉네임을 확인하는 중입니다.";
    case "available":
      return "사용 가능한 닉네임입니다.";
    case "duplicate":
      return "이미 사용 중인 닉네임입니다.";
    case "invalid":
      return "영문, 숫자, 마침표, 밑줄만 사용할 수 있습니다.";
    default:
      return "";
  }
}

function normalizeLinkInputs(links: string[]) {
  return links.map((link) => link.trim()).filter(Boolean);
}

export function ProfileEditScreen() {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [initialNickname, setInitialNickname] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameStatus, setNicknameStatus] =
    useState<NicknameStatus>("idle");
  const [profileLinks, setProfileLinks] = useState<string[]>([""]);
  const [selectedAvatarUri, setSelectedAvatarUri] = useState<string | null>(
    null,
  );

  const normalizedNickname = useMemo(
    () => normalizeNickname(nickname),
    [nickname],
  );
  const cleanedLinks = useMemo(
    () => normalizeLinkInputs(profileLinks),
    [profileLinks],
  );
  const hasInvalidLink = useMemo(
    () =>
      cleanedLinks.length > 0 &&
      normalizeProfileLinks(cleanedLinks).length !== cleanedLinks.length,
    [cleanedLinks],
  );
  const nicknameMessage = getNicknameMessage(nicknameStatus);
  const canSave =
    !isSaving &&
    !isLoading &&
    normalizedNickname.length > 0 &&
    nicknameStatus !== "checking" &&
    nicknameStatus !== "duplicate" &&
    nicknameStatus !== "invalid" &&
    !hasInvalidLink;

  const loadProfile = useCallback(async () => {
    try {
      setErrorMessage("");
      const { profile } = await getProfile();

      setAvatarUrl(profile.avatar_url);
      setBio(profile.bio ?? "");
      setDepartment(profile.department);
      setInitialNickname(profile.nickname);
      setNickname(profile.nickname);
      setNicknameStatus("idle");
      setProfileLinks(
        profile.links.length > 0 ? profile.links.map((link) => link.url) : [""],
      );
      setSelectedAvatarUri(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "프로필을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const nextNickname = normalizeNickname(nickname);

    if (!nextNickname || !isValidNickname(nextNickname)) {
      setNicknameStatus("invalid");
      return;
    }

    if (nextNickname === initialNickname) {
      setNicknameStatus("idle");
      return;
    }

    setNicknameStatus("checking");
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const duplicated = await checkNicknameDuplicate(nextNickname);
          setNicknameStatus(duplicated ? "duplicate" : "available");
        } catch (error) {
          setNicknameStatus("idle");
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "닉네임 중복 확인에 실패했습니다.",
          );
        }
      })();
    }, 350);

    return () => clearTimeout(timer);
  }, [initialNickname, isLoading, nickname]);

  async function handlePickAvatar() {
    setErrorMessage("");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setErrorMessage("사진 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      allowsMultipleSelection: false,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const nextUri = result.assets[0].uri;
    setSelectedAvatarUri(nextUri);
    setAvatarUrl(nextUri);
  }

  function handleChangeLink(index: number, value: string) {
    setProfileLinks((currentLinks) =>
      currentLinks.map((link, linkIndex) =>
        linkIndex === index ? value : link,
      ),
    );
  }

  function handleAddLink() {
    setProfileLinks((currentLinks) =>
      currentLinks.length >= MAX_PROFILE_LINKS ? currentLinks : [...currentLinks, ""],
    );
  }

  function handleRemoveLink(index: number) {
    setProfileLinks((currentLinks) => {
      const nextLinks = currentLinks.filter((_, linkIndex) => linkIndex !== index);
      return nextLinks.length > 0 ? nextLinks : [""];
    });
  }

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const nextAvatarUrl = selectedAvatarUri
        ? await uploadAvatar(selectedAvatarUri)
        : avatarUrl;

      await updateProfile({
        avatar_url: nextAvatarUrl ?? "",
        bio,
        nickname: normalizedNickname,
        profileLinks: cleanedLinks,
      });

      router.back();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "프로필을 저장하지 못했습니다.",
      );
    } finally {
      setIsSaving(false);
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
          onAction={() => {
            setIsLoading(true);
            void loadProfile();
          }}
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
            onPress={handleSave}
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
              onPress={handlePickAvatar}
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
                onChangeText={(value) => setNickname(normalizeNickname(value))}
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
