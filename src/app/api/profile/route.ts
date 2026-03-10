import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(null);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(null);
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, username, plan, analyses_used, analyses_limit")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(null);
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(null);
  }
}
