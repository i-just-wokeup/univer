import type { PostAspectRatio } from "../feed/types";

export type ExplorePost = {
  aspect_ratio: PostAspectRatio;
  comments_count: number;
  id: string;
  // 첫 미디어가 영상이면 true — 누르면 릴스로, 아니면 게시물 상세로.
  is_video: boolean;
  likes_count: number;
  thumbnail_url: string;
};

export type GetExplorePostsParams = {
  limit?: number;
  offset?: number;
};

export type GetExplorePostsResult = {
  hasMore: boolean;
  posts: ExplorePost[];
};
