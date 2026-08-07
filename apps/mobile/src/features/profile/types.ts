export type ProfileLink = {
  id: string;
  label: string;
  url: string;
};

export type ProfileDetail = {
  avatar_url: string | null;
  bio: string | null;
  department: string | null;
  department_public: boolean;
  id: string;
  links: ProfileLink[];
  nickname: string;
  real_name: string | null;
  real_name_public: boolean;
};

export type ProfileGridPost = {
  id: string;
  image_url: string | null;
};

export type ProfileCounts = {
  crew: number;
  posts: number;
};

export type ConnectionStatus = {
  friends_count: number;
  is_requester: boolean;
  status: "none" | "pending" | "accepted" | "rejected";
};

export type ConnectionUser = {
  avatar_url: string | null;
  department: string | null;
  id: string;
  nickname: string;
};

export type FriendRecommendation = {
  avatarUrl: string | null;
  mutualCount: number;
  nickname: string;
  sameDept: boolean;
  userId: string;
};
