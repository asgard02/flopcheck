import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Authentification non configurée." },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    if (!profile || profile.plan === "free") {
      return NextResponse.json(
        { error: "Accès refusé." },
        { status: 403 }
      );
    }

    const backendUrl = process.env.BACKEND_URL;
    const backendSecret = process.env.BACKEND_SECRET;

    if (!backendUrl || !backendSecret) {
      return NextResponse.json(
        { error: "Service clips non configuré." },
        { status: 503 }
      );
    }

    const { jobId } = await params;
    if (!jobId) {
      return NextResponse.json(
        { error: "jobId manquant." },
        { status: 400 }
      );
    }

    const res = await fetch(`${backendUrl.replace(/\/$/, "")}/jobs/${jobId}`, {
      headers: {
        "x-backend-secret": backendSecret,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Erreur backend." },
        { status: res.status >= 500 ? 503 : res.status }
      );
    }

    const baseUrl = request.nextUrl.origin;
    const clips = data.clips?.map((clip: { index: number }, i: number) => ({
      ...clip,
      downloadUrl: `${baseUrl}/api/clips/${jobId}/download/${i}`,
    }));

    return NextResponse.json({
      ...data,
      clips,
    });
  } catch (err) {
    console.error("Clips status error:", err);
    return NextResponse.json(
      { error: "Erreur." },
      { status: 500 }
    );
  }
}
