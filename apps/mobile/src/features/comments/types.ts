export type CommentUser = {
  avatar_url: string | null;
  id: string;
  nickname: string;
};

export type Comment = {
  content: string;
  created_at: string;
  id: string;
  likes_count: number;
  parent_id: string | null;
  replies: Comment[];
  user: CommentUser;
};
