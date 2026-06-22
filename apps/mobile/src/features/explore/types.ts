import type { PostAspectRatio } from "../feed/types";

export type ExplorePost = {
  aspect_ratio: PostAspectRatio;
  comments_count: number;
  id: string;
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
