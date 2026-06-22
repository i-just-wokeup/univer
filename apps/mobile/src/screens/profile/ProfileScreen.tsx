import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { Avatar } from "../../components/common/Avatar";
import { StateView } from "../../components/common/StateView";
import { getMyProfile, getMyProfilePosts } from "../../features/profile/api";
import type {
  ProfileGridPost,
  ProfileSummary,
} from "../../features/profile/types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { colors } from "../../lib/theme";

export function ProfileScreen() {
  const { width } = useWindowDimensions();
  const tileSize = (width - 6) / 3;

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [posts, setPosts] = useState<ProfileGridPost[]>([]);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);

  const load = useCallback(async () => {
    try {
      setErrorMessage("");
      const [nextProfile, nextPosts] = await Promise.all([
        getMyProfile(),
        getMyProfilePosts(),
      ]);
      setProfile(nextProfile);
      setPosts(nextPosts);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "프로필을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

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
      <FlatList
        ListEmptyComponent={
          <StateView
            message="아직 올린 게시물이 없습니다."
            title="게시물 없음"
          />
        }
        ListHeaderComponent={
          profile ? (
            <ProfileHeader onSignOut={handleSignOut} profile={profile} />
          ) : null
        }
        contentContainerStyle={styles.listContent}
        data={posts}
        keyExtractor={(post) => post.id}
        numColumns={3}
        onRefresh={() => {
          setIsRefreshing(true);
          void load();
        }}
        refreshing={isRefreshing}
        renderItem={({ item }) => (
          <View style={[styles.tile, { height: tileSize, width: tileSize }]}>
            {item.image_url ? (
              <Image
                cachePolicy="memory-disk"
                contentFit="cover"
                source={{ uri: item.image_url }}
                style={styles.tileImage}
              />
            ) : (
              <View style={styles.tilePlaceholder} />
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function ProfileHeader({
  onSignOut,
  profile,
}: {
  onSignOut: () => void;
  profile: ProfileSummary;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Text style={styles.logo}>KREW</Text>
        <Pressable onPress={onSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>로그아웃</Text>
        </Pressable>
      </View>
      <View style={styles.identity}>
        <Avatar imageUrl={profile.avatar_url} label={profile.nickname} size={88} />
        <Text style={styles.nickname}>{profile.nickname}</Text>
        {profile.department ? (
          <Text style={styles.department}>{profile.department}</Text>
        ) : null}
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        <Text style={styles.postsCount}>게시물 {profile.posts_count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  listContent: {
    paddingBottom: 96,
  },
  header: {
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
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
  identity: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  nickname: {
    marginTop: 14,
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  department: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  bio: {
    marginTop: 10,
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "center",
  },
  postsCount: {
    marginTop: 14,
    color: colors.textFaint,
    fontSize: 13,
    fontWeight: "800",
  },
  tile: {
    margin: 1,
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  tileImage: {
    height: "100%",
    width: "100%",
  },
  tilePlaceholder: {
    height: "100%",
    width: "100%",
    backgroundColor: "#DDD3FA",
  },
});
