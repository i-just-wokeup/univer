import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenHeader } from "../../components/common/ScreenHeader";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { StateView } from "../../components/common/StateView";
import { ProfileEditAvatar } from "../../components/profile/ProfileEditAvatar";
import { ProfileEditBioField } from "../../components/profile/ProfileEditBioField";
import { ProfileEditLinksEditor } from "../../components/profile/ProfileEditLinksEditor";
import { ProfileEditNicknameField } from "../../components/profile/ProfileEditNicknameField";
import { ProfileEditPrivacyToggles } from "../../components/profile/ProfileEditPrivacyToggles";
import { ProfileEditReadonlyField } from "../../components/profile/ProfileEditReadonlyField";
import { ProfileEditSaveButton } from "../../components/profile/ProfileEditSaveButton";
import { useProfileEdit } from "../../features/profile/useProfileEdit";
import { colors } from "../../lib/theme";

export function ProfileEditScreen() {
  const router = useRouter();
  const {
    avatarUrl,
    bio,
    canSave,
    department,
    departmentPublic,
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
    realNamePublic,
    retry,
    save,
    setBio,
    setDepartmentPublic,
    setRealNamePublic,
  } = useProfileEdit();

  async function handleSave() {
    const saved = await save();
    if (saved) {
      router.back();
    }
  }

  if (isLoading) {
    return (
      <ScreenContainer style={styles.screen}>
        <ScreenHeader onBack={() => router.back()} title="프로필 편집" />
        <StateView
          message="현재 프로필 정보를 불러오는 중입니다."
          title="프로필 준비 중"
          type="loading"
        />
      </ScreenContainer>
    );
  }

  if (errorMessage && !nickname) {
    return (
      <ScreenContainer style={styles.screen}>
        <ScreenHeader onBack={() => router.back()} title="프로필 편집" />
        <StateView
          actionLabel="다시 시도"
          message={errorMessage}
          onAction={retry}
          title="프로필을 불러오지 못했습니다"
          type="error"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.screen}>
      <ScreenHeader
        onBack={() => router.back()}
        right={
          <ProfileEditSaveButton
            disabled={!canSave}
            isSaving={isSaving}
            onPress={() => {
              void handleSave();
            }}
          />
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
            <ProfileEditAvatar
              avatarUrl={avatarUrl}
              label={nickname}
              onPress={() => {
                void handlePickAvatar();
              }}
            />
            <ProfileEditNicknameField
              message={nicknameMessage}
              nickname={nickname}
              onChangeNickname={handleChangeNickname}
              status={nicknameStatus}
            />
            <ProfileEditReadonlyField
              label="학과"
              value={department ?? "학과 없음"}
            />
            <ProfileEditPrivacyToggles
              departmentPublic={departmentPublic}
              onChangeDepartmentPublic={setDepartmentPublic}
              onChangeRealNamePublic={setRealNamePublic}
              realNamePublic={realNamePublic}
            />
            <ProfileEditBioField bio={bio} onChangeBio={setBio} />
            <ProfileEditLinksEditor
              hasInvalidLink={hasInvalidLink}
              links={profileLinks}
              onAddLink={handleAddLink}
              onChangeLink={handleChangeLink}
              onRemoveLink={handleRemoveLink}
            />
          </View>

          {errorMessage ? (
            <Text style={styles.formError}>{errorMessage}</Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
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
  formError: {
    marginTop: 12,
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
  },
});
