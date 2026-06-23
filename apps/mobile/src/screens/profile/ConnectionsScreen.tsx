import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KrewSurface } from "../../components/common/KrewSurface";
import { ScreenHeader } from "../../components/common/ScreenHeader";
import { StateView } from "../../components/common/StateView";
import {
  CONNECTION_TABS,
  ConnectionTabs,
  type ConnectionTab,
} from "../../components/profile/ConnectionTabs";
import { ConnectionUserRow } from "../../components/profile/ConnectionUserRow";
import {
  acceptFriendRequest,
  getFriends,
  getPendingRequests,
  getSentRequests,
  rejectFriendRequest,
  removeFriend,
} from "../../features/profile/api";
import type { ConnectionUser } from "../../features/profile/types";
import { colors } from "../../lib/theme";

const EMPTY_MESSAGES: Record<ConnectionTab, string> = {
  friends: "아직 연결된 크루가 없습니다.",
  received: "받은 크루 요청이 없습니다.",
  sent: "보낸 크루 요청이 없습니다.",
};

const INITIAL_CONNECTIONS: Record<ConnectionTab, ConnectionUser[] | null> = {
  friends: null,
  received: null,
  sent: null,
};

export function ConnectionsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ConnectionTab>("friends");
  const [connectionsByTab, setConnectionsByTab] =
    useState<Record<ConnectionTab, ConnectionUser[] | null>>(INITIAL_CONNECTIONS);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingTab, setLoadingTab] = useState<ConnectionTab | null>("friends");
  const [refreshingTab, setRefreshingTab] = useState<ConnectionTab | null>(null);

  const loadConnections = useCallback(
    async (tab: ConnectionTab, force = false) => {
      if (!force && connectionsByTab[tab] !== null) {
        return;
      }

      try {
        setErrorMessage("");
        setLoadingTab(tab);

        const nextConnections =
          tab === "friends"
            ? await getFriends()
            : tab === "received"
              ? await getPendingRequests()
              : await getSentRequests();

        setConnectionsByTab((current) => ({
          ...current,
          [tab]: nextConnections,
        }));
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "크루 목록을 불러오지 못했습니다.",
        );
        setConnectionsByTab((current) => ({
          ...current,
          [tab]: [],
        }));
      } finally {
        setLoadingTab(null);
        setRefreshingTab(null);
      }
    },
    [connectionsByTab],
  );

  useEffect(() => {
    void loadConnections(activeTab);
  }, [activeTab, loadConnections]);

  const handlePressUser = useCallback(
    (nickname: string) => {
      router.push({ pathname: "/profile/[nickname]", params: { nickname } });
    },
    [router],
  );

  async function handleConnectionAction({
    action,
    invalidateFriends = false,
    tab,
    userId,
  }: {
    action: () => Promise<void>;
    invalidateFriends?: boolean;
    tab: ConnectionTab;
    userId: string;
  }) {
    const previousConnections = connectionsByTab[tab] ?? [];

    setBusyUserId(userId);
    setErrorMessage("");
    setConnectionsByTab((current) => ({
      ...current,
      [tab]: previousConnections.filter((user) => user.id !== userId),
      friends: invalidateFriends ? null : current.friends,
    }));

    try {
      await action();
    } catch (error) {
      setConnectionsByTab((current) => ({
        ...current,
        [tab]: previousConnections,
      }));
      setErrorMessage(
        error instanceof Error ? error.message : "크루 요청 처리에 실패했습니다.",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  const currentConnections = connectionsByTab[activeTab];
  const isLoading = loadingTab === activeTab && currentConnections === null;
  const shouldShowLoadError =
    Boolean(errorMessage) &&
    (!currentConnections || currentConnections.length === 0);

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader onBack={() => router.back()} title="크루 관리" />

      <View style={styles.tabsWrap}>
        <ConnectionTabs activeTab={activeTab} onChange={setActiveTab} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              setRefreshingTab(activeTab);
              void loadConnections(activeTab, true);
            }}
            refreshing={refreshingTab === activeTab}
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
              onAction={() => {
                void loadConnections(activeTab, true);
              }}
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
                onAccept={() => {
                  void handleConnectionAction({
                    action: () => acceptFriendRequest(user.id),
                    invalidateFriends: true,
                    tab: activeTab,
                    userId: user.id,
                  });
                }}
                onCancel={() => {
                  void handleConnectionAction({
                    action: () => removeFriend(user.id),
                    tab: activeTab,
                    userId: user.id,
                  });
                }}
                onPressUser={handlePressUser}
                onReject={() => {
                  void handleConnectionAction({
                    action: () => rejectFriendRequest(user.id),
                    tab: activeTab,
                    userId: user.id,
                  });
                }}
                onRemove={() => {
                  void handleConnectionAction({
                    action: () => removeFriend(user.id),
                    tab: activeTab,
                    userId: user.id,
                  });
                }}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
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
    padding: 6,
  },
  inlineError: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.danger,
    fontSize: 12,
    fontWeight: "800",
  },
  emptySurface: {
    minHeight: 280,
    justifyContent: "center",
  },
});
