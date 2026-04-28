// Supabase 스키마를 TypeScript에서 안전하게 쓰기 위한 수동/생성 타입 정의.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      universities: {
        Row: {
          created_at: string;
          domain: string;
          id: string;
          is_active: boolean;
          name: string;
        };
        Insert: {
          created_at?: string;
          domain: string;
          id?: string;
          is_active?: boolean;
          name: string;
        };
        Update: {
          created_at?: string;
          domain?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          deleted_at: string | null;
          department: string;
          email: string | null;
          fcm_token: string | null;
          id: string;
          is_active: boolean;
          is_onboarded: boolean;
          nickname: string;
          role: string;
          university_id: string;
          visibility: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          department: string;
          email?: string | null;
          fcm_token?: string | null;
          id: string;
          is_active?: boolean;
          is_onboarded?: boolean;
          nickname: string;
          role?: string;
          university_id: string;
          visibility?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          department?: string;
          email?: string | null;
          fcm_token?: string | null;
          id?: string;
          is_active?: boolean;
          is_onboarded?: boolean;
          nickname?: string;
          role?: string;
          university_id?: string;
          visibility?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          comments_count: number;
          content: string | null;
          created_at: string;
          deleted_at: string | null;
          id: string;
          likes_count: number;
          university_id: string;
          user_id: string;
          views_count: number;
          visibility: "public" | "close_friends";
        };
        Insert: {
          comments_count?: number;
          content?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          likes_count?: number;
          university_id: string;
          user_id: string;
          views_count?: number;
          visibility?: "public" | "close_friends";
        };
        Update: {
          comments_count?: number;
          content?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          likes_count?: number;
          university_id?: string;
          user_id?: string;
          views_count?: number;
          visibility?: "public" | "close_friends";
        };
        Relationships: [];
      };
      post_images: {
        Row: {
          created_at: string;
          id: string;
          order_index: number;
          post_id: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          order_index?: number;
          post_id: string;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          order_index?: number;
          post_id?: string;
          url?: string;
        };
        Relationships: [];
      };
      hashtags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      post_hashtags: {
        Row: {
          hashtag_id: string;
          post_id: string;
        };
        Insert: {
          hashtag_id: string;
          post_id: string;
        };
        Update: {
          hashtag_id?: string;
          post_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
