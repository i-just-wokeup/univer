export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      universities: {
        Row: {
          id: string
          name: string
          domain: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          domain: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string | null
          real_name: string | null
          nickname: string
          bio: string | null
          avatar_url: string | null
          university_id: string
          department: string
          role: 'user' | 'official'
          is_onboarded: boolean
          is_active: boolean
          fcm_token: string | null
          visibility: 'public' | 'close_friends'
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          real_name?: string | null
          nickname: string
          bio?: string | null
          avatar_url?: string | null
          university_id: string
          department: string
          role?: 'user' | 'official'
          is_onboarded?: boolean
          is_active?: boolean
          fcm_token?: string | null
          visibility?: 'public' | 'close_friends'
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          real_name?: string | null
          nickname?: string
          bio?: string | null
          avatar_url?: string | null
          university_id?: string
          department?: string
          role?: 'user' | 'official'
          is_onboarded?: boolean
          is_active?: boolean
          fcm_token?: string | null
          visibility?: 'public' | 'close_friends'
          deleted_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string | null
          views_count: number
          likes_count: number
          comments_count: number
          university_id: string
          visibility: 'public' | 'close_friends'
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content?: string | null
          views_count?: number
          likes_count?: number
          comments_count?: number
          university_id: string
          visibility?: 'public' | 'close_friends'
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string | null
          views_count?: number
          likes_count?: number
          comments_count?: number
          university_id?: string
          visibility?: 'public' | 'close_friends'
          deleted_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      post_media: {
        Row: {
          id: string
          post_id: string
          type: 'image' | 'video'
          url: string
          thumbnail_url: string | null
          duration: number | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          type?: 'image' | 'video'
          url: string
          thumbnail_url?: string | null
          duration?: number | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          type?: 'image' | 'video'
          url?: string
          thumbnail_url?: string | null
          duration?: number | null
          order_index?: number
          created_at?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          id: string
          user_id: string
          image_url: string
          university_id: string
          views_count: number
          expires_at: string
          is_archived: boolean
          visibility: 'public' | 'close_friends'
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          university_id: string
          views_count?: number
          expires_at?: string
          is_archived?: boolean
          visibility?: 'public' | 'close_friends'
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          university_id?: string
          views_count?: number
          expires_at?: string
          is_archived?: boolean
          visibility?: 'public' | 'close_friends'
          deleted_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          story_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          id: string
          user_id: string
          target_type: 'post' | 'story'
          target_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_type: 'post' | 'story'
          target_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_type?: 'post' | 'story'
          target_id?: string
          created_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          user_id: string
          post_id: string
          parent_id: string | null
          content: string
          likes_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          parent_id?: string | null
          content: string
          likes_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          parent_id?: string | null
          content?: string
          likes_count?: number
          created_at?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          id: string
          user_id: string
          comment_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          comment_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          comment_id?: string
          created_at?: string
        }
        Relationships: []
      }
      user_likes: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          notify: boolean
          created_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          notify?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          notify?: boolean
          created_at?: string
        }
        Relationships: []
      }
      close_friends: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          created_at?: string
        }
        Relationships: []
      }
      hashtags: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      post_hashtags: {
        Row: {
          post_id: string
          hashtag_id: string
        }
        Insert: {
          post_id: string
          hashtag_id: string
        }
        Update: {
          post_id?: string
          hashtag_id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'post_like' | 'post_comment' | 'comment_reply' | 'user_like' | 'new_post'
          reference_type: 'post' | 'user' | 'comment' | 'story' | null
          reference_id: string | null
          message: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'post_like' | 'post_comment' | 'comment_reply' | 'user_like' | 'new_post'
          reference_type?: 'post' | 'user' | 'comment' | 'story' | null
          reference_id?: string | null
          message?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'post_like' | 'post_comment' | 'comment_reply' | 'user_like' | 'new_post'
          reference_type?: 'post' | 'user' | 'comment' | 'story' | null
          reference_id?: string | null
          message?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      blocks: {
        Row: {
          id: string
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: {
          id?: string
          blocker_id: string
          blocked_id: string
          created_at?: string
        }
        Update: {
          id?: string
          blocker_id?: string
          blocked_id?: string
          created_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          target_type: 'post' | 'story' | 'user'
          target_id: string
          reason: string | null
          status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken'
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          target_type: 'post' | 'story' | 'user'
          target_id: string
          reason?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          status?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
