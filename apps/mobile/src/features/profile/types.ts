export type ProfileSummary = {
  avatar_url: string | null;
  bio: string | null;
  department: string | null;
  id: string;
  nickname: string;
  posts_count: number;
};

export type ProfileGridPost = {
  id: string;
  image_url: string | null;
};
