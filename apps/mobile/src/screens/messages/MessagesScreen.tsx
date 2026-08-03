import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ConversationRow } from "../../components/chat/ConversationRow";
import { ScreenHeader } from "../../components/common/ScreenHeader";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { SearchInput } from "../../components/search/SearchInput";
import { SearchUserRow } from "../../components/search/SearchUserRow";
import { useMessagesList } from "../../features/chat/useMessagesList";
import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type ConversationTab = "active" | "pending";

export function MessagesScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const {
    active,
    currentUserId,
    isLoading,
    isSearching,
    pending,
    query,
    searchResults,
    setQuery,
    startConversation,
  } = useMessagesList();
  const [activeTab, setActiveTab] = useState<ConversationTab>("active");

  async function openConversation(userId: string) {
    const conversationId = await startConversation(userId);
    if (conversationId) {
      router.push({
        pathname: "/messages/[conversationId]",
        params: { conversationId },
      });
    }
  }

  const visibleConversations = activeTab === "active" ? active : pending;

  return (
    <ScreenContainer
      contentBackgroundColor={colors.accentSoft}
      style={styles.screen}
    >
      <ScreenHeader onBack={() => router.back()} themed title="메시지" />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <SearchInput
          autoFocus={false}
          onChange={setQuery}
          outlined={false}
          placeholder="닉네임으로 대화 시작"
          value={query}
        />

        {query.trim() ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>대화 시작</Text>
            {isSearching ? (
              <Text style={styles.stateText}>검색 중입니다…</Text>
            ) : searchResults.length === 0 ? (
              <Text style={styles.stateText}>검색 결과가 없습니다.</Text>
            ) : (
              searchResults.map((user) => (
                <SearchUserRow
                  key={user.id}
                  onPress={(selected) => {
                    void openConversation(selected.id);
                  }}
                  user={user}
                />
              ))
            )}
          </View>
        ) : null}

        <View style={styles.tabs}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveTab("active")}
            style={[styles.tab, activeTab === "active" ? styles.tabActive : null]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "active" ? styles.tabTextActive : null,
              ]}
            >
              메시지
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveTab("pending")}
            style={[styles.tab, activeTab === "pending" ? styles.tabActive : null]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "pending" ? styles.tabTextActive : null,
              ]}
            >
              요청
            </Text>
            {pending.length > 0 ? (
              <View
                style={[
                  styles.tabBadge,
                  activeTab === "pending" ? styles.tabBadgeActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    activeTab === "pending" ? styles.tabBadgeTextActive : null,
                  ]}
                >
                  {pending.length}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.card}>
          {isLoading ? (
            <Text style={styles.stateText}>대화 목록을 불러오는 중입니다…</Text>
          ) : visibleConversations.length === 0 ? (
            <Text style={styles.stateText}>
              {activeTab === "active"
                ? "아직 대화가 없습니다."
                : "받은 메시지 요청이 없습니다."}
            </Text>
          ) : (
            visibleConversations.map((conversation) => (
              <ConversationRow
                conversation={conversation}
                currentUserId={currentUserId}
                key={conversation.id}
                onPress={(conversationId) =>
                  router.push({
                    pathname: "/messages/[conversationId]",
                    params: { conversationId },
                  })
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.accentSoft,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    borderRadius: 22,
    backgroundColor: c.card,
    padding: 8,
  },
  cardTitle: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
    color: c.text,
    fontSize: 14,
    fontWeight: "900",
  },
  stateText: {
    paddingVertical: 28,
    color: c.muted,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  tabs: {
    flexDirection: "row",
    gap: 6,
    borderRadius: 18,
    backgroundColor: c.surfaceGlassSoft,
    padding: 5,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: 14,
  },
  tabActive: {
    backgroundColor: c.accent,
  },
  tabText: {
    color: c.muted,
    fontSize: 14,
    fontWeight: "900",
  },
  tabTextActive: {
    color: c.onAccent,
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: c.accent,
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: c.onAccent,
  },
  tabBadgeText: {
    color: c.onAccent,
    fontSize: 11,
    fontWeight: "900",
  },
  tabBadgeTextActive: {
    color: c.accent,
  },
});
