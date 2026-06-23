export type ProfileLink = {
  id: string;
  label: string;
  url: string;
};

export type ProfileDetail = {
  avatar_url: string | null;
  bio: string | null;
  department: string | null;
  id: string;
  links: ProfileLink[];
  nickname: string;
  real_name: string | null;
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
