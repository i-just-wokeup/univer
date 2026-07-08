import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { ScreenHeader } from "../../components/common/ScreenHeader";
import { signOutMobile } from "../../features/auth/api";
import { LEGAL_URLS } from "../../lib/site";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { colors } from "../../lib/theme";

function Section({ children, label }: { children: ReactNode; label: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  disabled = false,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled ? styles.rowPressed : null,
      ]}
    >
      <Text style={[styles.rowLabel, disabled ? styles.rowLabelDisabled : null]}>
        {label}
      </Text>
      <ChevronRight
        color={disabled ? colors.textFaint : colors.muted}
        size={18}
        strokeWidth={2.4}
      />
    </Pressable>
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogout() {
    setIsLogoutOpen(false);
    setErrorMessage("");

    try {
      await signOutMobile();
    } catch {
      setErrorMessage("로그아웃에 실패했습니다.");
    }
  }

  async function handleDelete() {
    setIsDeleteOpen(false);
    setErrorMessage("");

    try {
      const supabase = getSupabaseMobileClient();
      const { error } = await supabase.rpc("delete_account");

      if (error) {
        throw new Error("계정 탈퇴에 실패했습니다.");
      }

      await supabase.auth.signOut();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "계정 탈퇴에 실패했습니다.",
      );
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScreenHeader onBack={() => router.back()} title="설정" />

      <ScrollView contentContainerStyle={styles.content}>
        <Section label="계정">
          <Row
            label="프로필 편집"
            onPress={() => router.push("/profile/edit")}
          />
          <Row label="내 활동" onPress={() => router.push("/activity")} />
          <Row label="차단한 계정" onPress={() => router.push("/blocked")} />
        </Section>

        <Section label="지원">
          <Row disabled label="공지사항" />
          <Row disabled label="문의하기" />
        </Section>

        <Section label="약관 및 정책">
          <Row
            label="이용약관"
            onPress={() => void Linking.openURL(LEGAL_URLS.terms)}
          />
          <Row
            label="개인정보처리방침"
            onPress={() => void Linking.openURL(LEGAL_URLS.privacy)}
          />
          <Row
            label="커뮤니티 가이드라인"
            onPress={() => void Linking.openURL(LEGAL_URLS.guidelines)}
          />
        </Section>

        <View style={styles.section}>
          <View style={styles.card}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsLogoutOpen(true)}
              style={({ pressed }) => [
                styles.row,
                pressed ? styles.rowPressed : null,
              ]}
            >
              <Text style={styles.logoutText}>로그아웃</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsDeleteOpen(true)}
              style={({ pressed }) => [
                styles.row,
                pressed ? styles.rowPressed : null,
              ]}
            >
              <Text style={styles.deleteText}>탈퇴하기</Text>
            </Pressable>
          </View>

          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : null}
        </View>
      </ScrollView>

      <ConfirmDialog
        cancelLabel="취소"
        confirmLabel="로그아웃"
        danger
        description="현재 계정에서 로그아웃합니다."
        isOpen={isLogoutOpen}
        onCancel={() => setIsLogoutOpen(false)}
        onConfirm={handleLogout}
        title="로그아웃 하시겠어요?"
      />
      <ConfirmDialog
        cancelLabel="취소"
        confirmLabel="탈퇴"
        danger
        description="30일 이내 복구 가능합니다."
        isOpen={isDeleteOpen}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="정말 탈퇴하시겠습니까?"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  content: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionLabel: {
    marginBottom: 8,
    paddingHorizontal: 4,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 22,
    backgroundColor: colors.card,
    padding: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  rowPressed: {
    backgroundColor: colors.accentSoft,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  rowLabelDisabled: {
    color: colors.textFaint,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "900",
  },
  deleteText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  error: {
    marginTop: 12,
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
  },
});
