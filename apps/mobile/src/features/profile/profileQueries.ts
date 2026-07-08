import { getSupabaseMobileClient } from "../../lib/supabase";
import {
  getBlockRelatedUserIds,
  getCurrentUserId,
} from "../shared/userContext";
import type {
  ProfileCounts,
  ProfileDetail,
  ProfileGridPost,
} from "./types";
import { getConnectionStatus } from "./profileConnections";
import {
  getProfileLinks,
  getRealName,
  type PostMediaRow,
  type PostRow,
  type UserRow,
} from "./profileInternal";

// 닉네임이 없으면 내 프로필, 있으면 해당 닉네임의 공개 가능한 프로필을 조회한다.
export async function getProfile(
  nickname?: string,
): Promise<{ isMine: boolean; profile: ProfileDetail }> {
  const supabase = getSupabaseMobileClient();
  const currentUserId = await getCurrentUserId();

  let query = supabase
    .from("users")
    .select("id, nickname, bio, avatar_url, department");

  query = nickname
    ? query.eq("nickname", nickname)
    : query.eq("id", currentUserId);

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    throw new Error("프로필을 찾을 수 없습니다.");
  }

  const profileRow = data as Pick<
    UserRow,
    "avatar_url" | "bio" | "department" | "id" | "nickname"
  >;
  const isMine = profileRow.id === currentUserId;

  if (!isMine) {
    const blockRelatedUserIds = await getBlockRelatedUserIds();

    if (blockRelatedUserIds.includes(profileRow.id)) {
      throw new Error("차단 관계인 프로필은 볼 수 없습니다.");
    }
  }

  const [realName, links] = await Promise.all([
    getRealName(profileRow.id),
    getProfileLinks(profileRow.id),
  ]);

  return {
    isMine,
    profile: {
      avatar_url: profileRow.avatar_url,
      bio: profileRow.bio,
      department: profileRow.department,
      id: profileRow.id,
      links,
      nickname: profileRow.nickname,
      real_name: realName,
    },
  };
}

// 프로필 그리드용 게시물 목록. 영상은 첫 미디어의 thumbnail_url을 썸네일로 사용한다.
export async function getProfilePosts(
  userId: string,
): Promise<ProfileGridPost[]> {
  const supabase = getSupabaseMobileClient();

  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select("id, created_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (postsError || !postsData) {
    throw new Error("프로필 게시물을 불러오지 못했습니다.");
  }

  if (postsData.length === 0) {
    return [];
  }

  const postIds = postsData.map((post) => post.id);
  const { data: imagesData, error: imagesError } = await supabase
    .from("post_media")
    .select("post_id, url, thumbnail_url, type, order_index")
    .in("post_id", postIds)
    .eq("order_index", 0);

  if (imagesError || !imagesData) {
    throw new Error("게시물 이미지를 불러오지 못했습니다.");
  }

  const imageByPostId = new Map<string, string>();

  (
    imagesData as Pick<
      PostMediaRow,
      "order_index" | "post_id" | "thumbnail_url" | "type" | "url"
    >[]
  ).forEach((media) => {
    const thumbnail =
      media.type === "video" ? media.thumbnail_url ?? media.url : media.url;

    if (!imageByPostId.has(media.post_id)) {
      imageByPostId.set(media.post_id, thumbnail);
    }
  });

  return (postsData as Pick<PostRow, "created_at" | "id">[]).map((post) => ({
    id: post.id,
    image_url: imageByPostId.get(post.id) ?? null,
  }));
}

// 프로필 통계: 게시물 수 + 크루 수. 크루 수는 연결 상태 RPC의 friends_count를 재사용한다.
export async function getProfileCounts(userId: string): Promise<ProfileCounts> {
  const supabase = getSupabaseMobileClient();

  const { count, error: countError } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (countError) {
    throw new Error("게시물 수를 불러오지 못했습니다.");
  }

  const connectionStatus = await getConnectionStatus(userId);

  return { crew: connectionStatus.friends_count, posts: count ?? 0 };
}
