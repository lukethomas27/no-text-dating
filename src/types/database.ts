// Database types matching Supabase schema (snake_case)
// These are used internally for Supabase queries

export type SwipeAction = 'like' | 'pass';
export type MatchState = 'active' | 'archived' | 'blocked';
export type SchedulingState = 'pending' | 'proposed' | 'confirmed';
export type CallType = 'audio' | 'video';
export type CallState = 'scheduled' | 'live' | 'completed' | 'missed' | 'canceled';
export type FeedbackRating = 'interested' | 'not_interested';
export type ReportCategory = 'inappropriate' | 'fake' | 'harassment' | 'spam' | 'other';

// New enums for matching
export type DbGender = 'man' | 'woman' | 'non_binary' | 'other';
export type DbSexuality = 'straight' | 'gay' | 'lesbian' | 'bisexual' | 'pansexual' | 'queer' | 'asexual' | 'other';
export type DbShowMePreference = 'men' | 'women' | 'everyone';

export interface DbProfile {
  id: string;
  name: string;
  birthday: string; // DATE in format YYYY-MM-DD
  gender: DbGender;
  sexuality: DbSexuality;
  show_me: DbShowMePreference;
  prompts: string[];
  photos: string[];
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSwipe {
  id: string;
  from_id: string;
  to_id: string;
  action: SwipeAction;
  created_at: string;
}

export interface DbMatch {
  id: string;
  user_a_id: string;
  user_b_id: string;
  state: MatchState;
  created_at: string;
}

export interface DbCallThread {
  id: string;
  match_id: string;
  scheduling_state: SchedulingState;
  last_activity_at: string;
}

export interface DbCallProposal {
  id: string;
  thread_id: string;
  proposed_by: string;
  call_type: CallType;
  slots: string[];
  created_at: string;
}

export interface DbCallEvent {
  id: string;
  thread_id: string;
  scheduled_start: string;
  duration_seconds: number;
  call_type: CallType;
  state: CallState;
  provider_join_url: string | null;
  created_at: string;
}

export interface DbFeedback {
  id: string;
  call_event_id: string;
  user_id: string;
  rating: FeedbackRating;
  created_at: string;
}

export interface DbBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface DbReport {
  id: string;
  reporter_id: string;
  reported_id: string;
  category: ReportCategory;
  notes: string | null;
  created_at: string;
}

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: DbProfile;
        Insert: Omit<DbProfile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DbProfile, 'id' | 'created_at'>>;
      };
      swipes: {
        Row: DbSwipe;
        Insert: Omit<DbSwipe, 'id' | 'created_at'>;
        Update: Partial<Omit<DbSwipe, 'id' | 'created_at'>>;
      };
      matches: {
        Row: DbMatch;
        Insert: Omit<DbMatch, 'id' | 'created_at'>;
        Update: Partial<Omit<DbMatch, 'id' | 'created_at'>>;
      };
      call_threads: {
        Row: DbCallThread;
        Insert: Omit<DbCallThread, 'id' | 'last_activity_at'>;
        Update: Partial<Omit<DbCallThread, 'id'>>;
      };
      call_proposals: {
        Row: DbCallProposal;
        Insert: Omit<DbCallProposal, 'id' | 'created_at'>;
        Update: Partial<Omit<DbCallProposal, 'id' | 'created_at'>>;
      };
      call_events: {
        Row: DbCallEvent;
        Insert: Omit<DbCallEvent, 'id' | 'created_at'>;
        Update: Partial<Omit<DbCallEvent, 'id' | 'created_at'>>;
      };
      feedbacks: {
        Row: DbFeedback;
        Insert: Omit<DbFeedback, 'id' | 'created_at'>;
        Update: Partial<Omit<DbFeedback, 'id' | 'created_at'>>;
      };
      blocks: {
        Row: DbBlock;
        Insert: Omit<DbBlock, 'id' | 'created_at'>;
        Update: Partial<Omit<DbBlock, 'id' | 'created_at'>>;
      };
      reports: {
        Row: DbReport;
        Insert: Omit<DbReport, 'id' | 'created_at'>;
        Update: Partial<Omit<DbReport, 'id' | 'created_at'>>;
      };
    };
    Enums: {
      swipe_action: SwipeAction;
      match_state: MatchState;
      scheduling_state: SchedulingState;
      call_type: CallType;
      call_state: CallState;
      feedback_rating: FeedbackRating;
      report_category: ReportCategory;
      gender: DbGender;
      sexuality: DbSexuality;
      show_me_preference: DbShowMePreference;
    };
  };
}
