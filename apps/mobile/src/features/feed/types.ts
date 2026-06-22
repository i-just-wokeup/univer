export type PostAspectRatio = "square" | "portrait" | "landscape";

export type FeedUser = {
  avatar_url: string | null;
  department: string;
  id: string;
  nickname: string;
};

export type PostMedia = {
  duration: number | null;
  id: string;
  order_index: number;
  thumbnail_url: string | null;
  type: "image" | "video";
  url: string;
};

export type FeedPost = {
  aspect_ratio: PostAspectRatio;
  comments_count: number;
  content: string | null;
  created_at: string;
  id: string;
  media: PostMedia[];
  likes_count: number;
  user: FeedUser;
};

export type GetFeedResult = {
  nextCursor: string | null;
  posts: FeedPost[];
};
