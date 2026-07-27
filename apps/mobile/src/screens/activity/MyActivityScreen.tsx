import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ActivityFavoriteUserRow } from "../../components/activity/ActivityFavoriteUserRow";
import { ActivityPostGrid } from "../../components/activity/ActivityPostGrid";
import { ActivityStoryGrid } from "../../components/activity/ActivityStoryGrid";
import { ActivityStoryPreviewSheet } from "../../components/activity/ActivityStoryPreviewSheet";
import { ScreenHeader } from "../../components/common/ScreenHeader";
import { StateView } from "../../components/common/StateView";
import {
  type ActivityTab,
  useMyActivity,
} from "../../features/activity/useMyActivity";
import { colors } from "../../lib/theme";

const tabs: Array<{ id: ActivityTab; label: string }> = [
  { id: "stories", label: "스토리" },
  { id: "saved", label: "저장됨" },
  { id: "liked", label: "좋아요" },
  { id: "comments", label: "댓글" },
  { id: "favorites", label: "즐겨찾기" },
];

export function MyActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    activeTab,
    activeTabError,
    closeStoryPreview,
    commentedPosts,
    favoriteUsers,
    isActiveTabLoading,
    isLoadingViewers,
    likedPosts,
    retryActiveTab,
    savedPosts,
    selectedStory,
    setActiveTab,
    setSelectedStory,
    stories,
    storyViewers,
  } = useMyActivity();

  function openPost(postId: string) {
    router.push({ pathname: "/post/[id]", params: { id: postId } });
  }

  function openProfile(nickname: string) {
    router.push({ pathname: "/profile/[nickname]", params: { nickname } });
  }

  function renderActiveTab() {
    if (isActiveTabLoading) {
      return (
        <StateView
          message="활동 내역을 불러오는 중입니다."
          title="불러오는 중"
          type="loading"
        />
      );
    }

    if (activeTabError) {
      return (
        <StateView
          actionLabel="다시 시도"
          message={activeTabError}
          onAction={retryActiveTab}
          title="불러오지 못했습니다"
          type="error"
        />
      );
    }

    if (activeTab === "stories") {
      return (
        <ActivityStoryGrid
          onSelectStory={(story) => setSelectedStory(story)}
          stories={stories}
        />
      );
    }

    if (activeTab === "saved") {
      return <ActivityPostGrid onOpenPost={openPost} posts={savedPosts} />;
    }

    if (activeTab === "liked") {
      return (
        <ActivityPostGrid
          emptyMessage="아직 좋아요한 게시물이 없습니다."
          onOpenPost={openPost}
          posts={likedPosts}
        />
      );
    }

    if (activeTab === "comments") {
      return (
        <ActivityPostGrid
          emptyMessage="아직 댓글 단 게시물이 없습니다."
          onOpenPost={openPost}
          posts={commentedPosts}
        />
      );
    }

    if (favoriteUsers.length === 0) {
      return (
        <StateView
          message="아직 즐겨찾기한 계정이 없습니다."
          title="즐겨찾기 없음"
          type="empty"
        />
      );
    }

    return (
      <View style={styles.favoriteSurface}>
        {favoriteUsers.map((user) => (
          <ActivityFavoriteUserRow
            key={user.id}
            onPress={openProfile}
            user={user}
          />
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScreenHeader onBack={() => router.back()} title="내 활동" />
      <View style={styles.tabsWrap}>
        <ScrollView
          contentContainerStyle={styles.tabsContent}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tab, isActive ? styles.activeTab : null]}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive ? styles.activeTabText : null,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: styles.content.paddingBottom + insets.bottom },
        ]}
      >
        {renderActiveTab()}
      </ScrollView>
      <ActivityStoryPreviewSheet
        isLoadingViewers={isLoadingViewers}
        onClose={closeStoryPreview}
        story={selectedStory}
        viewers={storyViewers}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  tabsWrap: {
    paddingVertical: 10,
  },
  tabsContent: {
    gap: 8,
    paddingHorizontal: 16,
  },
  tab: {
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.78)",
    paddingHorizontal: 16,
  },
  activeTab: {
    backgroundColor: colors.accent,
  },
  tabText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
  },
  activeTabText: {
    color: colors.white,
  },
  content: {
    paddingHorizontal: 4,
    paddingBottom: 40,
  },
  favoriteSurface: {
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 24,
    backgroundColor: colors.card,
    padding: 6,
  },
});
