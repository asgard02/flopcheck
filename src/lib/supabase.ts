import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required"
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export type Profile = {
  id: string;
  email: string | null;
  username: string | null;
  plan: string;
  analyses_used: number;
  analyses_limit: number;
  created_at: string;
};

export type AnalysisRow = {
  id: string;
  user_id: string;
  video_url: string;
  video_id: string;
  video_title: string | null;
  video_thumbnail: string | null;
  view_count: string | null;
  subscriber_count: string | null;
  score: number | null;
  result: Record<string, unknown>;
  created_at: string;
};
