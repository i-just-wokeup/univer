export type StoryVisibility = "public" | "close_friends";

export type StoryUser = {
  avatar_url: string | null;
  id: string;
  nickname: string;
};

export type Story = {
  created_at: string;
  expires_at: string;
  id: string;
  image_url: string;
  isMine: boolean;
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
