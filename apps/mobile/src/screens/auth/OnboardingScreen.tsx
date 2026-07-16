import { useRouter } from "expo-router";
import { Check, Lock } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StateView } from "../../components/common/StateView";
import { useOnboarding } from "../../features/auth/useOnboarding";
import { LEGAL_URLS } from "../../lib/site";
import { colors } from "../../lib/theme";

export function OnboardingScreen() {
  const router = useRouter();
  const {
    canSubmit,
    department,
    errorMessage,
    handleChangeNickname,
    handleCheckNickname,
    handleSubmit,
    isDepartmentReadOnly,
    isLoading,
    isRealNameReadOnly,
    isSubmitting,
    nickname,
    nicknameMessage,
    nicknameStatus,
    realName,
    redirectTo,
    setDepartment,
    setRealName,
  } = useOnboarding();
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <StateView
          message="학교 인증 정보를 확인하는 중입니다."
          title="프로필 준비 중"
          type="loading"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.logo}>KREW</Text>
          <Text style={styles.title}>학교가 자동으로 인식되었어요</Text>
          <Text style={styles.description}>
            학교 이메일 기준으로 인증된 정보를 확인해주세요.
          </Text>

          <View style={styles.schoolCard}>
            <View style={styles.schoolBadge}>
              <Text style={styles.schoolBadgeText}>국</Text>
            </View>
            <Text style={styles.schoolName}>국민대학교</Text>
            <Text style={styles.schoolMeta}>재학생 인증 완료</Text>

            <View style={styles.cardDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>실명</Text>
              <View style={styles.lockedValue}>
                <Text numberOfLines={1} style={styles.infoValue}>
                  {realName || "직접 입력 필요"}
                </Text>
                {isRealNameReadOnly ? (
                  <Lock color={colors.textFaint} size={14} strokeWidth={2.4} />
                ) : null}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>학과</Text>
              <View style={styles.lockedValue}>
                <Text numberOfLines={1} style={styles.infoValue}>
                  {department || "직접 입력 필요"}
                </Text>
                {isDepartmentReadOnly ? (
                  <Lock color={colors.textFaint} size={14} strokeWidth={2.4} />
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>프로필을 완성해주세요</Text>

            <View style={styles.field}>
              <Text style={styles.label}>실명</Text>
              <TextInput
                editable={!isRealNameReadOnly}
                onChangeText={setRealName}
                placeholder="홍길동"
                placeholderTextColor={colors.textFaint}
                style={[styles.input, isRealNameReadOnly ? styles.readOnly : null]}
                value={realName}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>닉네임</Text>
              <View style={styles.nicknameRow}>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={30}
                  onChangeText={handleChangeNickname}
                  placeholder="닉네임을 입력하세요"
                  placeholderTextColor={colors.textFaint}
                  style={[styles.input, styles.nicknameInput]}
                  value={nickname}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={nicknameStatus === "checking"}
                  onPress={handleCheckNickname}
                  style={({ pressed }) => [
                    styles.checkButton,
                    pressed ? styles.pressed : null,
                    nicknameStatus === "checking" ? styles.disabled : null,
                  ]}
                >
                  <Text style={styles.checkButtonText}>
                    {nicknameStatus === "checking" ? "확인 중" : "중복확인"}
                  </Text>
                </Pressable>
              </View>
              <Text
                style={[
                  styles.helper,
                  nicknameStatus === "available" ? styles.success : null,
                  nicknameStatus === "duplicate" || nicknameStatus === "invalid"
                    ? styles.error
                    : null,
                ]}
              >
                {nicknameMessage}
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>학과</Text>
              <TextInput
                editable={!isDepartmentReadOnly}
                onChangeText={setDepartment}
                placeholder="자동차공학과"
                placeholderTextColor={colors.textFaint}
                style={[
                  styles.input,
                  isDepartmentReadOnly ? styles.readOnly : null,
                ]}
                value={department}
              />
            </View>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <View style={styles.agreeRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreed }}
                hitSlop={8}
                onPress={() => setAgreed((value) => !value)}
                style={[styles.checkbox, agreed ? styles.checkboxOn : null]}
              >
                {agreed ? (
                  <Check color={colors.white} size={13} strokeWidth={3.2} />
                ) : null}
              </Pressable>
              <Text style={styles.agreeText}>
                <Text
                  style={styles.agreeLink}
                  onPress={() => void Linking.openURL(LEGAL_URLS.terms)}
                >
                  이용약관
                </Text>
                {" 및 "}
                <Text
                  style={styles.agreeLink}
                  onPress={() => void Linking.openURL(LEGAL_URLS.privacy)}
                >
                  개인정보 수집·이용
                </Text>
                에 동의합니다 (필수)
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!canSubmit || !agreed}
              onPress={() => {
                void handleSubmit().then((didSubmit) => {
                  if (didSubmit) {
                    router.replace("/");
                  }
                });
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && canSubmit && agreed ? styles.pressed : null,
                !canSubmit || !agreed ? styles.disabled : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? "저장 중..." : "KREW 시작하기"}
              </Text>
            </Pressable>
          </View>
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
    flexGrow: 1,
    padding: 20,
    paddingBottom: 32,
  },
  logo: {
    color: colors.accent,
    fontSize: 34,
    fontWeight: "900",
  },
  title: {
    marginTop: 24,
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 31,
  },
  description: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
  },
  schoolCard: {
    marginTop: 24,
    alignItems: "center",
    borderColor: "rgba(124,58,237,0.1)",
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: colors.card,
    padding: 22,
  },
  schoolBadge: {
    height: 64,
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.accent,
  },
  schoolBadgeText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "900",
  },
  schoolName: {
    marginTop: 14,
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  schoolMeta: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  cardDivider: {
    height: 1,
    alignSelf: "stretch",
    marginVertical: 18,
    backgroundColor: colors.border,
  },
  infoRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 6,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  infoValue: {
    maxWidth: 210,
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  lockedValue: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  formCard: {
    marginTop: 18,
    borderColor: "rgba(124,58,237,0.1)",
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: colors.card,
    padding: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  field: {
    marginTop: 18,
  },
  label: {
    marginBottom: 8,
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  input: {
    minHeight: 52,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: colors.white,
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    paddingHorizontal: 16,
  },
  readOnly: {
    backgroundColor: "rgba(255,255,255,0.55)",
    color: colors.muted,
  },
  nicknameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nicknameInput: {
    flex: 1,
  },
  checkButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(124,58,237,0.12)",
    paddingHorizontal: 14,
  },
  checkButtonText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "900",
  },
  helper: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  success: {
    color: colors.accent,
  },
  error: {
    color: colors.danger,
  },
  errorText: {
    marginTop: 16,
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  agreeRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    height: 22,
    width: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    borderWidth: 1.6,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  checkboxOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  agreeText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  agreeLink: {
    color: colors.accent,
    fontWeight: "900",
    textDecorationLine: "underline",
  },
  primaryButton: {
    height: 54,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.accent,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.82,
  },
});
