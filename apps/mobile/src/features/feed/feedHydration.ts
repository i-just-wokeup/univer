import type { FeedPost, FeedUser, PostMedia } from "./types";
import {
  type FeedPostMediaRow,
  type FeedPostRow,
  type FeedPostUserRow,
} from "./internalTypes";

function mapFeedUser(user: FeedPostUserRow): FeedUser {
  return {
    avatar_url: user.avatar_url,
    department: user.department,
    id: user.id,
    nickname: user.nickname,
  };
}

function mapPostMedia(media: FeedPostMediaRow): PostMedia {
  return {
    duration: media.duration,
    id: media.id,
    order_index: media.order_index,
    processing_status: media.processing_status,
    provider: media.provider,
    provider_asset_id: media.provider_asset_id,
    thumbnail_url: media.thumbnail_url,
    type: media.type,
    url: media.url,
  };
}

// posts 쿼리의 임베딩 결과를 FeedPost UI 타입으로 변환한다.
// DB 왕복은 feedQueries의 단일 posts select에서 끝내고, 여기서는 순수 매핑만 한다.
export async function hydrateFeedPosts(
  postRows: FeedPostRow[],
): Promise<FeedPost[]> {
  if (postRows.length === 0) {
    return [];
  }

  return postRows.map((post) => {
    if (!post.user) {
      throw new Error("게시물 작성자 정보를 찾을 수 없습니다.");
    }

    return {
      aspect_ratio: post.aspect_ratio ?? "portrait",
      comments_count: post.comments_count,
      content: post.content,
      created_at: post.created_at,
      id: post.id,
      likes_count: post.likes_count,
      media: post.post_media?.map(mapPostMedia) ?? [],
      user: mapFeedUser(post.user),
      visibility: post.visibility,
    };
  });
}
