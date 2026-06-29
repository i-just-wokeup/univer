export type StoryVisibility = "public" | "close_friends";

export type StoryUser = {
  avatar_url: string | null;
  id: string;
  nickname: string;
};

export type Story = {
  created_at: string;
  // 영상 길이(초). 사진은 null.
  duration_seconds: number | null;
  expires_at: string;
  id: string;
  // 미디어 URL — 사진이면 이미지, 영상(mediaType==='video')이면 영상 URL.
  image_url: string;
  isMine: boolean;
  mediaType: "image" | "video";
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
