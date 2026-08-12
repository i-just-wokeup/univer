export type StoryVisibility = "public" | "close_friends";

export type StoryUser = {
  avatar_url: string | null;
  id: string;
  nickname: string;
};

export type StorySharedPost = {
  content: string | null;
  id: string;
  media: {
    thumbnailUrl: string | null;
    type: "image" | "video";
    url: string;
  } | null;
  user: StoryUser;
};

export type Story = {
  backgroundColor: string | null;
  created_at: string;
  // 영상 길이(초). 사진은 null.
  duration_seconds: number | null;
  expires_at: string;
  id: string;
  // 미디어 URL — 사진이면 이미지, 영상(mediaType==='video')이면 영상 URL.
  image_url: string | null;
  isMine: boolean;
  mediaType: "image" | "video";
  processing_status: "processing" | "ready" | "failed";
  provider: "cloudflare_stream" | null;
  provider_asset_id: string | null;
  sharedPost: StorySharedPost | null;
  shared_post_id: string | null;
  thumbnail_url: string | null;
  user: StoryUser;
  user_id: string;
  views_count: number;
};

export type StoryGroup = {
  hasUnviewed: boolean;
  stories: Story[];
  user: StoryUser;
};

export type StoryViewer = StoryUser & {
  isLiked: boolean;
};
