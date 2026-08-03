import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { KrewSurface } from "../../components/common/KrewSurface";
import { ScreenHeader } from "../../components/common/ScreenHeader";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { StateView } from "../../components/common/StateView";
import {
  CONNECTION_TABS,
  ConnectionTabs,
  type ConnectionTab,
} from "../../components/profile/ConnectionTabs";
import { ConnectionUserRow } from "../../components/profile/ConnectionUserRow";
import { useConnections } from "../../features/profile/useConnections";
import type { ConnectionUser } from "../../features/profile/types";
import { triggerLightHaptic } from "../../lib/haptics";
import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

const EMPTY_MESSAGES: Record<ConnectionTab, string> = {
  friends: "아직 연결된 크루가 없습니다.",
  received: "받은 크루 요청이 없습니다.",
  sent: "보낸 크루 요청이 없습니다.",
};

export function ConnectionsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const {
    acceptUser,
    activeTab,
    busyUserId,
    currentConnections,
    errorMessage,
    feedbackMessage,
    isLoading,
    isRefreshing,
    refresh,
    rejectUser,
    removeUser,
    retry,
    setActiveTab,
    shouldShowLoadError,
    showFeedback,
  } = useConnections();
  const [removeTarget, setRemoveTarget] = useState<ConnectionUser | null>(null);

  const handlePressUser = useCallback(
    (nickname: string) => {
      router.push({ pathname: "/profile/[nickname]", params: { nickname } });
    },
    [router],
  );

  const handlePullRefresh = useCallback(() => {
    triggerLightHaptic();
    refresh();
  }, [refresh]);

  async function handleConfirmRemove() {
    if (!removeTarget) {
      return;
    }

    const targetId = removeTarget.id;
    setRemoveTarget(null);
    const removed = await removeUser(targetId);
    if (removed) {
      showFeedback("크루에서 삭제했어요");
    }
  }

  return (
    <ScreenContainer
      contentBackgroundColor={colors.accentSoft}
      style={styles.screen}
    >
      <ScreenHeader onBack={() => router.back()} themed title="크루 관리" />

      <View style={styles.tabsWrap}>
        <ConnectionTabs activeTab={activeTab} onChange={setActiveTab} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            onRefresh={handlePullRefresh}
            refreshing={isRefreshing}
            tintColor={colors.accent}
          />
        }
      >
        {isLoading ? (
          <KrewSurface style={styles.surface}>
            <StateView
              message="크루 목록을 불러오는 중입니다."
              title="크루 준비 중"
              type="loading"
            />
          </KrewSurface>
        ) : shouldShowLoadError ? (
          <KrewSurface style={styles.surface}>
            <StateView
              actionLabel="다시 시도"
              message={errorMessage}
              onAction={retry}
              title="크루 목록을 불러오지 못했습니다"
              type="error"
            />
          </KrewSurface>
        ) : currentConnections && currentConnections.length > 0 ? (
          <KrewSurface style={styles.surface}>
            {errorMessage ? (
              <Text style={styles.inlineError}>{errorMessage}</Text>
            ) : null}
            {currentConnections.map((user) => (
              <ConnectionUserRow
                isBusy={busyUserId === user.id}
                key={user.id}
                onAccept={() => acceptUser(user.id)}
                onCancel={() => removeUser(user.id)}
                onPressUser={handlePressUser}
                onReject={() => rejectUser(user.id)}
                onRemove={() => setRemoveTarget(user)}
                tab={activeTab}
                user={user}
              />
            ))}
          </KrewSurface>
        ) : (
          <KrewSurface style={styles.emptySurface}>
            <StateView
              message={EMPTY_MESSAGES[activeTab]}
              title={CONNECTION_TABS.find((tab) => tab.value === activeTab)?.label ?? "크루"}
              type="empty"
            />
          </KrewSurface>
        )}
      </ScrollView>

      {feedbackMessage ? (
        <View style={styles.feedback}>
          <Text style={styles.feedbackText}>{feedbackMessage}</Text>
        </View>
      ) : null}

      <ConfirmDialog
        cancelLabel="취소"
        confirmLabel="삭제"
        danger
        description="크루에서 삭제하면 다시 추가하려면 크루 요청을 보내야 합니다."
        isOpen={removeTarget !== null}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          void handleConfirmRemove();
        }}
        title={`${removeTarget?.nickname ?? ""}님을 크루에서 삭제할까요?`}
      />
    </ScreenContainer>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.accentSoft,
  },
  tabsWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  surface: {
    overflow: "hidden",
    borderColor: c.surfaceBorder,
    backgroundColor: c.surfaceGlass,
    padding: 6,
  },
  inlineError: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: c.danger,
    fontSize: 12,
    fontWeight: "800",
  },
  emptySurface: {
    minHeight: 280,
    justifyContent: "center",
    borderColor: c.surfaceBorder,
    backgroundColor: c.surfaceGlass,
  },
  feedback: {
    position: "absolute",
    right: 16,
    bottom: 24,
    left: 16,
    borderRadius: 16,
    backgroundColor: c.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  feedbackText: {
    color: c.onAccent,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
});
