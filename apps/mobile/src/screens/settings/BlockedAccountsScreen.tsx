import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { ScreenHeader } from "../../components/common/ScreenHeader";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { StateView } from "../../components/common/StateView";
import { Avatar } from "../../components/common/Avatar";
import { useBlockedAccounts } from "../../features/blocks/useBlockedAccounts";
import {
  nicknameTextStyle,
  useTheme,
  useThemedStyles,
  fontSize,
  fontWeight,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

function formatBlockedAt(createdAt: string) {
  const date = new Date(createdAt);
  return `${new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)} 차단`;
}

export function BlockedAccountsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    blockedUsers,
    errorMessage,
    isLoading,
    isUnblocking,
    retry,
    unblockUserById,
  } = useBlockedAccounts();
  const [unblockTargetId, setUnblockTargetId] = useState<string | null>(null);

  function handleConfirmUnblock() {
    if (!unblockTargetId) {
      return;
    }

    const targetId = unblockTargetId;
    setUnblockTargetId(null);
    void unblockUserById(targetId);
  }

  const unblockTarget =
    blockedUsers.find((user) => user.id === unblockTargetId) ?? null;

  return (
    <ScreenContainer
      contentBackgroundColor={colors.accentSoft}
      style={styles.screen}
    >
      <ScreenHeader onBack={() => router.back()} themed title="차단한 계정" />

      {isLoading ? (
        <StateView
          message="차단 목록을 불러오는 중입니다."
          title="차단 목록 준비 중"
          type="loading"
        />
      ) : errorMessage && blockedUsers.length === 0 ? (
        <StateView
          actionLabel="다시 시도"
          message={errorMessage}
          onAction={retry}
          title="차단 목록을 불러오지 못했습니다"
          type="error"
        />
      ) : (
        <FlatList
          contentContainerStyle={[
            styles.list,
            { paddingBottom: styles.list.paddingBottom + insets.bottom },
          ]}
          data={blockedUsers}
          keyExtractor={(user) => user.id}
          ListEmptyComponent={
            <StateView
              message="차단한 계정이 없습니다."
              title="차단 목록 없음"
              type="empty"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Avatar
                imageUrl={item.avatar_url}
                label={item.nickname}
                size={46}
              />
              <View style={styles.userBody}>
                <Text numberOfLines={1} style={styles.nickname}>
                  {item.nickname}
                </Text>
                {item.department ? (
                  <Text numberOfLines={1} style={styles.department}>
                    {item.department}
                  </Text>
                ) : null}
                <Text style={styles.blockedAt}>
                  {formatBlockedAt(item.created_at)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={isUnblocking}
                onPress={() => setUnblockTargetId(item.id)}
                style={({ pressed }) => [
                  styles.unblockButton,
                  pressed && !isUnblocking ? styles.pressed : null,
                  isUnblocking ? styles.disabled : null,
                ]}
              >
                <Text style={styles.unblockText}>차단 해제</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      {errorMessage && blockedUsers.length > 0 ? (
        <Text style={styles.inlineError}>{errorMessage}</Text>
      ) : null}

      <ConfirmDialog
        cancelLabel="취소"
        confirmLabel={isUnblocking ? "해제 중..." : "차단 해제"}
        description="차단을 해제하면 상대방이 다시 회원님을 볼 수 있습니다."
        isOpen={Boolean(unblockTargetId)}
        onCancel={() => setUnblockTargetId(null)}
        onConfirm={handleConfirmUnblock}
        title={`${unblockTarget?.nickname ?? ""}의 차단을 해제할까요?`}
      />
    </ScreenContainer>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.accentSoft,
  },
  list: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 24,
    backgroundColor: c.card,
    padding: 8,
    paddingBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  userBody: {
    minWidth: 0,
    flex: 1,
  },
  nickname: {
    ...nicknameTextStyle,
    color: c.text,
    fontSize: fontSize.body,
  },
  department: {
    marginTop: 3,
    color: c.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
  },
  blockedAt: {
    marginTop: 3,
    color: c.textFaint,
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.semibold,
  },
  unblockButton: {
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: c.navBackground,
    paddingHorizontal: 12,
  },
  unblockText: {
    color: c.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.heavy,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.45,
  },
  inlineError: {
    marginHorizontal: 20,
    marginTop: 8,
    color: c.danger,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
  },
});
