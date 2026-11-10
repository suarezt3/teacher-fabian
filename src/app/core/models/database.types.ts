export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type EnglishLevel =
  | 'A1'
  | 'A2'
  | 'B1'
  | 'B2'
  | 'C1'
  | 'C2'
  | 'NO_CONOZCO';

export interface OnboardingPayload {
  whatsapp_number: string;
  age: number;
  country_city: string;
  gender: string;
  education_level: string;
  occupation: string;
  profession_area?: string | null;
  previous_study_type: string;
  study_duration: string;
  international_exam: string;
  english_level: EnglishLevel;
  speaking_comfort: string;
  previous_club_experience: string;
  learning_goals: string[];
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          english_level: EnglishLevel | null;
          interest_topics: string[];
          accepted_respect_code: boolean;
          avatar_url: string | null;
          preferred_schedule: string | null;
          form_completed: boolean;
          whatsapp_number?: string | null;
          age?: number | null;
          country_city?: string | null;
          gender?: string | null;
          education_level?: string | null;
          occupation?: string | null;
          profession_area?: string | null;
          previous_study_type?: string | null;
          study_duration?: string | null;
          international_exam?: string | null;
          learning_goals?: string[];
          speaking_comfort?: string | null;
          previous_club_experience?: string | null;
          data_processing_authorized?: boolean;
          data_authorized_at?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          english_level?: EnglishLevel | null;
          interest_topics?: string[];
          accepted_respect_code?: boolean;
          avatar_url?: string | null;
          preferred_schedule?: string | null;
          form_completed?: boolean;
          whatsapp_number?: string | null;
          age?: number | null;
          country_city?: string | null;
          gender?: string | null;
          education_level?: string | null;
          occupation?: string | null;
          profession_area?: string | null;
          previous_study_type?: string | null;
          study_duration?: string | null;
          international_exam?: string | null;
          learning_goals?: string[];
          speaking_comfort?: string | null;
          previous_club_experience?: string | null;
          data_processing_authorized?: boolean;
          data_authorized_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          english_level?: EnglishLevel | null;
          interest_topics?: string[];
          accepted_respect_code?: boolean;
          avatar_url?: string | null;
          preferred_schedule?: string | null;
          form_completed?: boolean;
          whatsapp_number?: string | null;
          age?: number | null;
          country_city?: string | null;
          gender?: string | null;
          education_level?: string | null;
          occupation?: string | null;
          profession_area?: string | null;
          previous_study_type?: string | null;
          study_duration?: string | null;
          international_exam?: string | null;
          learning_goals?: string[];
          speaking_comfort?: string | null;
          previous_club_experience?: string | null;
          data_processing_authorized?: boolean;
          data_authorized_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversation_rooms: {
        Row: {
          id: string;
          title: string;
          topic: string;
          level: string;
          schedule: string;
          mentor_name: string;
          scheduled_at: string;
          max_participants: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          topic: string;
          level: string;
          schedule: string;
          mentor_name?: string;
          scheduled_at: string;
          max_participants?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          topic?: string;
          level?: string;
          schedule?: string;
          mentor_name?: string;
          scheduled_at?: string;
          max_participants?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
