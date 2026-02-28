export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          clerk_user_id: string | null;
          google_user_id: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          clerk_user_id?: string | null;
          google_user_id?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          clerk_user_id?: string | null;
          google_user_id?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          estimated_duration_minutes: number;
          deadline: string | null;
          priority: "low" | "medium" | "high";
          workflow_state_id: string | null;
          is_scheduled: boolean;
          scheduled_start: string | null;
          scheduled_end: string | null;
          is_pinned: boolean;
          google_task_id: string | null;
          google_calendar_event_id: string | null;
          parent_task_id: string | null;
          ai_generated: boolean;
          depends_on_task_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          estimated_duration_minutes: number;
          deadline?: string | null;
          priority?: "low" | "medium" | "high";
          workflow_state_id?: string | null;
          is_scheduled?: boolean;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          is_pinned?: boolean;
          google_task_id?: string | null;
          google_calendar_event_id?: string | null;
          parent_task_id?: string | null;
          ai_generated?: boolean;
          depends_on_task_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          estimated_duration_minutes?: number;
          deadline?: string | null;
          priority?: "low" | "medium" | "high";
          workflow_state_id?: string | null;
          is_scheduled?: boolean;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          is_pinned?: boolean;
          google_task_id?: string | null;
          google_calendar_event_id?: string | null;
          parent_task_id?: string | null;
          ai_generated?: boolean;
          depends_on_task_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      workflow_states: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          order: number;
          is_terminal: boolean;
          should_auto_schedule: boolean;
          scheduling_priority_boost: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          order?: number;
          is_terminal?: boolean;
          should_auto_schedule?: boolean;
          scheduling_priority_boost?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          order?: number;
          is_terminal?: boolean;
          should_auto_schedule?: boolean;
          scheduling_priority_boost?: number;
          created_at?: string;
        };
      };
    };
  };
}
