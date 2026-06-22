import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KrewSurface } from "../../components/common/KrewSurface";
import { PostThumbnailGrid } from "../../components/common/PostThumbnailGrid";
import { StateView } from "../../components/common/StateView";
import { ProfileInfoPanel } from "../../components/profile/ProfileInfoPanel";
import {
  getProfile,
  getProfileCounts,
  getProfilePosts,
} from "../../features/profile/api";
import type {
  ProfileCounts,
  ProfileDetail,
  ProfileGridPost,
} from "../../features/profile/types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { colors } from "../../lib/theme";

type ProfileScreenProps = {
  nickname?: string;
};

export function ProfileScreen({ nickname }: ProfileScreenProps) {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [counts, setCounts] = useState<ProfileCounts>({ crew: 0, posts: 0 });
  const [posts, setPosts] = useState<ProfileGridPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setErrorMessage("");
      const { profile: loaded } = await getProfile(nickname);
      setProfile(loaded);

      const [loadedCounts, loadedPosts] = await Promise.all([
        getProfileCounts(loaded.id),
        getProfilePosts(loaded.id),
      ]);
      setCounts(loadedCounts);
      setPosts(loadedPosts);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "프로필을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [nickname]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSignOut() {
    await getSupabaseMobileClient().auth.signOut();
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <StateView
          message="프로필을 불러오는 중입니다."
          title="프로필 준비 중"
          type="loading"
        />
      </SafeAreaView>
    );
  }

  if (errorMessage && !profile) {
    return (
      <SafeAreaView style={styles.screen}>
        <StateView
          actionLabel="다시 시도"
          message={errorMessage}
          onAction={() => {
            setIsLoading(true);
            void load();
          }}
          title="프로필을 불러오지 못했습니다"
          type="error"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {nickname ? (
        <View style={styles.pushedHeader}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <ChevronLeft color={colors.text} size={22} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {profile?.nickname}
          </Text>
          <View style={styles.headerButton} />
        </View>
      ) : (
        <View style={styles.tabHeader}>
          <Text style={styles.logo}>KREW</Text>
          <Pressable onPress={handleSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>로그아웃</Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              setIsRefreshing(true);
              void load();
            }}
            refreshing={isRefreshing}
            tintColor={colors.accent}
          />
        }
      >
        {profile ? (
          <KrewSurface style={styles.panel}>
            <ProfileInfoPanel counts={counts} profile={profile} />
            <View style={styles.divider} />
            {posts.length === 0 ? (
              <View style={styles.emptyGrid}>
                <Text style={styles.emptyText}>아직 게시물이 없습니다</Text>
              </View>
            ) : (
              <PostThumbnailGrid items={posts} />
            )}
          </KrewSurface>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  tabHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 6,
  },
  logo: {
    color: colors.accent,
    fontSize: 32,
    fontWeight: "900",
  },
  signOutButton: {
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
  },
  signOutText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
  },
  pushedHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 12,
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  scrollContent: {
    paddingBottom: 110,
  },
  panel: {
    marginHorizontal: 16,
    marginTop: 8,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(124,58,237,0.08)",
  },
  emptyGrid: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
});
