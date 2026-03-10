import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Service non disponible." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email requis." },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Email invalide." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from("waitlist").insert({ email });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: true, message: "Tu es déjà inscrit !" }
        );
      }
      console.error("Waitlist insert error:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'inscription." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tu seras notifié à la sortie !",
    });
  } catch (err) {
    console.error("Waitlist API error:", err);
    return NextResponse.json(
      { error: "Erreur." },
      { status: 500 }
    );
  }
}
