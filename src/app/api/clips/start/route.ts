import { NextRequest, NextResponse } from "next/server";
import { extractVideoId } from "@/lib/youtube";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: NextRequest) {
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

    if (!profile) {
      return NextResponse.json(
        { error: "Profil non trouvé." },
        { status: 403 }
      );
    }

    if (profile.plan === "free") {
      return NextResponse.json(
        { error: "Les clips sont réservés aux plans Pro et supérieurs. Passe à l'upgrade." },
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

    const body = await request.json();
    const url = body?.url?.trim();

    if (!url) {
      return NextResponse.json(
        { error: "URL vidéo requise." },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "URL YouTube invalide." },
        { status: 400 }
      );
    }

    const res = await fetch(`${backendUrl.replace(/\/$/, "")}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-backend-secret": backendSecret,
      },
      body: JSON.stringify({ videoUrl: url }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Erreur backend." },
        { status: res.status >= 500 ? 503 : res.status }
      );
    }

    return NextResponse.json({ jobId: data.jobId });
  } catch (err) {
    console.error("Clips start error:", err);
    return NextResponse.json(
      { error: "Erreur." },
      { status: 500 }
    );
  }
}
