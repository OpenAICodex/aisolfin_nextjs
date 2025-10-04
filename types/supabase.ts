/**
 * Partial Supabase typings for the project's database. These interfaces
 * describe tables used by the application. The complete types can be
 * generated using the Supabase CLI but are provided here manually to keep
 * the code self contained.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          role: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          role?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          role?: string | null;
        };
      };
      evaluations: {
        Row: {
          id: string;
          user_id: string;
          input: unknown;
          outputs: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          input: unknown;
          outputs: unknown;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          input?: unknown;
          outputs?: unknown;
          created_at?: string;
        };
      };
      rate_limits: {
        Row: {
          user_id: string;
          date: string;
          count: number;
        };
        Insert: {
          user_id: string;
          date: string;
          count: number;
        };
        Update: {
          user_id?: string;
          date?: string;
          count?: number;
        };
      };
    };
  };
}