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
        credit_balance: number
        level: number
        level_score: number
        role: 'user' | 'official' | 'admin'
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
          credit_balance?: number
          level?: number
          level_score?: number
          role?: 'user' | 'official' | 'admin'
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
          credit_balance?: number
          level?: number
          level_score?: number
          role?: 'user' | 'official' | 'admin'
          is_onboarded?: boolean
          is_active?: boolean
          fcm_token?: string | null
          visibility?: 'public' | 'close_friends'
          deleted_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      profile_links: {
        Row: {
          id: string
          user_id: string
          label: string
          url: string
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          url: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          label?: string
          url?: string
          order_index?: number
          updated_at?: string
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
          aspect_ratio: 'square' | 'portrait' | 'landscape'
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
          aspect_ratio?: 'square' | 'portrait' | 'landscape'
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
          aspect_ratio?: 'square' | 'portrait' | 'landscape'
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
      user_connections: {
        Row: {
          id: string
          requester_id: string
          receiver_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          receiver_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          receiver_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          participant_1_id: string
          participant_2_id: string
          status: 'pending' | 'active'
          initiated_by: string
          last_message_at: string | null
          last_message_preview: string | null
          last_message_sender_id: string | null
          hidden_at_1: string | null
          hidden_at_2: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_1_id: string
          participant_2_id: string
          status?: 'pending' | 'active'
          initiated_by: string
          last_message_at?: string | null
          last_message_preview?: string | null
          last_message_sender_id?: string | null
          hidden_at_1?: string | null
          hidden_at_2?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'active'
          last_message_at?: string | null
          last_message_preview?: string | null
          last_message_sender_id?: string | null
          hidden_at_1?: string | null
          hidden_at_2?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          message_type: 'text' | 'image' | 'system'
          content: string
          read_at: string | null
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          message_type?: 'text' | 'image' | 'system'
          content: string
          read_at?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          read_at?: string | null
          deleted_at?: string | null
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
      user_favorites: {
        Row: {
          id: string
          user_id: string
          favorite_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          favorite_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          favorite_user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'post_like' | 'story_like' | 'comment_like' | 'post_comment' | 'friend_request' | 'friend_accepted' | 'report_received'
          reference_type: 'post' | 'user' | 'comment' | 'story' | null
          reference_id: string | null
          message: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'post_like' | 'story_like' | 'comment_like' | 'post_comment' | 'friend_request' | 'friend_accepted' | 'report_received'
          reference_type?: 'post' | 'user' | 'comment' | 'story' | null
          reference_id?: string | null
          message?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'post_like' | 'story_like' | 'comment_like' | 'post_comment' | 'friend_request' | 'friend_accepted' | 'report_received'
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
    Functions: {
      delete_account: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      accept_friend_request: {
        Args: {
          requester_user_id: string
        }
        Returns: Json
      }
      accept_chat_request: {
        Args: {
          p_conversation_id: string
        }
        Returns: Json
      }
      block_user: {
        Args: {
          target_user_id: string
        }
        Returns: Json
      }
      get_connection_status: {
        Args: {
          target_user_id: string
        }
        Returns: Json
      }
      get_block_related_user_ids: {
        Args: Record<PropertyKey, never>
        Returns: Array<{
          user_id: string
        }>
      }
      get_blocked_users: {
        Args: Record<PropertyKey, never>
        Returns: Array<{
          id: string
          nickname: string
          avatar_url: string | null
          department: string
          created_at: string
        }>
      }
      unblock_user: {
        Args: {
          target_user_id: string
        }
        Returns: Json
      }
      get_friends: {
        Args: Record<PropertyKey, never>
        Returns: Array<{
          id: string
          nickname: string
          avatar_url: string | null
          department: string
        }>
      }
      get_pending_requests: {
        Args: Record<PropertyKey, never>
        Returns: Array<{
          id: string
          nickname: string
          avatar_url: string | null
          department: string
          created_at: string
        }>
      }
      get_sent_requests: {
        Args: Record<PropertyKey, never>
        Returns: Array<{
          id: string
          nickname: string
          avatar_url: string | null
          department: string
          created_at: string
        }>
      }
      get_admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_admin_reports: {
        Args: {
          limit?: number
          limit_count?: number
          offset?: number
          offset_count?: number
          p_limit?: number
          p_offset?: number
          p_status?: string | null
          status?: string | null
          status_filter?: string | null
        }
        Returns: Json
      }
      get_admin_users: {
        Args: {
          limit?: number
          limit_count?: number
          offset?: number
          offset_count?: number
          p_limit?: number
          p_offset?: number
          p_search?: string
          search?: string
          search_query?: string
        }
        Returns: Json
      }
      handle_admin_report: {
        Args: {
          action_type?: string
          report_id?: string
        }
        Returns: Json
      }
      mark_messages_read: {
        Args: {
          p_conversation_id: string
        }
        Returns: Json
      }
      restore_account: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      reject_friend_request: {
        Args: {
          requester_user_id: string
        }
        Returns: Json
      }
      remove_friend: {
        Args: {
          target_user_id: string
        }
        Returns: Json
      }
      recount_comment_likes: {
        Args: {
          p_comment_id: string
        }
        Returns: number
      }
      recount_post_comments: {
        Args: {
          p_post_id: string
        }
        Returns: number
      }
      recount_post_likes: {
        Args: {
          p_post_id: string
        }
        Returns: number
      }
      recount_story_views: {
        Args: {
          p_story_id: string
        }
        Returns: number
      }
      search_users: {
        Args: {
          search_query: string
        }
        Returns: Json
      }
      send_friend_request: {
        Args: {
          target_user_id: string
        }
        Returns: Json
      }
    }
    Enums: Record<string, never>
  }
}
