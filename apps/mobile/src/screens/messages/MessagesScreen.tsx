import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConversationRow } from "../../components/chat/ConversationRow";
import { ScreenHeader } from "../../components/common/ScreenHeader";
import { SearchInput } from "../../components/search/SearchInput";
import { SearchUserRow } from "../../components/search/SearchUserRow";
import { useMessagesList } from "../../features/chat/useMessagesList";
import { colors } from "../../lib/theme";

type ConversationTab = "active" | "pending";

export function MessagesScreen() {
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
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScreenHeader onBack={() => router.back()} title="메시지" />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <SearchInput
          autoFocus={false}
          onChange={setQuery}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 22,
    backgroundColor: colors.card,
    padding: 8,
  },
  cardTitle: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  stateText: {
    paddingVertical: 28,
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  tabs: {
    flexDirection: "row",
    gap: 6,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.6)",
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
    backgroundColor: colors.accent,
  },
  tabText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "900",
  },
  tabTextActive: {
    color: colors.white,
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  tabBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
  },
  tabBadgeTextActive: {
    color: colors.white,
  },
});
