import { NextRequest, NextResponse } from "next/server";
import { extractVideoId } from "@/lib/youtube";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase";

type YouTubeVideoData = {
  title: string;
  description: string;
  tags: string[];
  duration: string;
  viewCount: string;
  publishedAt: string;
  channelTitle: string;
  channelId: string;
  subscriberCount: string;
};

async function fetchChannelStats(apiKey: string, channelId: string): Promise<string> {
  if (!channelId) return "0";
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("id", channelId);
  url.searchParams.set("part", "statistics");
  url.searchParams.set("key", apiKey);
  const res = await fetch(url.toString());
  if (!res.ok) return "0";
  const data = await res.json();
  const stats = data.items?.[0]?.statistics;
  return stats?.subscriberCount ?? "0";
}

async function fetchYouTubeData(videoId: string, apiKey: string): Promise<YouTubeVideoData> {
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("id", videoId);
  url.searchParams.set("part", "snippet,contentDetails,statistics");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 403 && body.error?.errors?.[0]?.reason === "quotaExceeded") {
      throw new Error("QUOTA_EXCEEDED");
    }
    if (res.status === 404 || body.error?.code === 404) {
      throw new Error("VIDEO_NOT_FOUND");
    }
    throw new Error("YOUTUBE_API_ERROR");
  }

  const data = await res.json();
  const item = data.items?.[0];

  if (!item) {
    throw new Error("VIDEO_NOT_FOUND");
  }

  const snippet = item.snippet || {};
  const contentDetails = item.contentDetails || {};
  const statistics = item.statistics || {};
  const channelId = snippet.channelId || "";

  const subscriberCount = await fetchChannelStats(apiKey, channelId);

  return {
    title: snippet.title || "",
    description: snippet.description || "",
    tags: snippet.tags || [],
    duration: contentDetails.duration || "",
    viewCount: statistics.viewCount || "0",
    publishedAt: snippet.publishedAt || "",
    channelTitle: snippet.channelTitle || "",
    channelId,
    subscriberCount,
  };
}

function parseDuration(isoDuration: string): string {
  if (!isoDuration) return "Unknown";
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return isoDuration;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds) parts.push(`${seconds}s`);
  return parts.join(" ") || "0s";
}

export type DiagnosisJSON = {
  score: number;
  ratio_analysis?: {
    ratio: number;
    interpretation: string;
    benchmark: string;
  };
  context: string;
  verdict: string;
  overperformed: boolean;
  performance_breakdown?: {
    titre: number;
    description: number;
    tags: number;
    timing: number;
    duree: number;
  };
  kills: string[];
  title_analysis: string;
  title_fixed: string;
  description_problem: string;
  description_fixed: string;
  tags_analysis?: string;
  tags_fixed: string[];
  timing: string;
  thumbnail_tips?: string;
  quickwins: string[];
  next_video_idea?: string;
};

async function getOpenAIDiagnosis(videoData: YouTubeVideoData): Promise<DiagnosisJSON> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const duration = parseDuration(videoData.duration);
  const publishDate = videoData.publishedAt
    ? new Date(videoData.publishedAt).toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Unknown";

  const videoDataStr = JSON.stringify({
    title: videoData.title,
    description: videoData.description,
    tags: videoData.tags,
    viewCount: videoData.viewCount,
    subscriberCount: videoData.subscriberCount,
    duration,
    publishedAt: publishDate,
    channelTitle: videoData.channelTitle,
  });

  const prompt = `Tu es un analyste YouTube senior avec 10 ans d'expérience en croissance de chaînes et optimisation de contenu.
Tu analyses la performance réelle d'une vidéo en croisant toutes les données disponibles.

═══════════════════════════════
RÈGLE FONDAMENTALE — LE SCORE
═══════════════════════════════
Le score (1-10) mesure UNIQUEMENT le GAP entre performance réelle et potentiel maximum.
Il ne mesure PAS si la vidéo est "bonne" ou "mauvaise" dans l'absolu.

Logique du score :
- Compare viewCount vs subscriberCount pour détecter sur/sous-performance
- Une vidéo à 30M de vues sur une chaîne de 500K abonnés = score 9-10 (surperformance massive)
- Une vidéo à 10K vues sur une chaîne de 2M abonnés = score 2-3 (sous-performance critique)
- Une vidéo à 50K vues sur une chaîne de 50K abonnés = score 5-6 (dans la moyenne)
- Prends en compte la niche : gaming viral ≠ éducation de niche ≠ vlog lifestyle

═══════════════════════════════
CONTEXTE À ANALYSER
═══════════════════════════════
Avant de scorer, établis mentalement :
1. Le ratio vues/abonnés (viewCount ÷ subscriberCount)
   - < 0.1 → sous-performance
   - 0.1 à 0.5 → dans la moyenne
   - 0.5 à 2 → bonne performance
   - > 2 → surperformance (vidéo virale)
2. La niche et son niveau de concurrence
3. La durée vs les standards de la niche (YouTube Shorts < 60s, long format > 8 min)
4. Le timing (jour/heure/période de l'année)
5. La qualité du titre — curiosity gap, keyword, émotion, clarté
6. La description — SEO, mots-clés, structure, appels à l'action
7. Les tags — pertinence, volume de recherche estimé, diversité

═══════════════════════════════
DONNÉES DE LA VIDÉO
═══════════════════════════════
${videoDataStr}

═══════════════════════════════
FORMAT DE RÉPONSE
═══════════════════════════════
Retourne UNIQUEMENT ce JSON. Zéro markdown, zéro bloc de code, zéro texte avant ou après.

{
  "score": number (1-10),

  "ratio_analysis": {
    "ratio": number (viewCount ÷ subscriberCount, arrondi à 2 décimales),
    "interpretation": "string — que signifie ce ratio dans cette niche spécifique",
    "benchmark": "string — comparaison avec la moyenne de la niche"
  },

  "context": "string — explication précise du score basée sur les vraies stats, ratio, niche et timing",

  "verdict": "string — une phrase directe qui résume la vraie performance (pas de jugement moral)",

  "overperformed": boolean,

  "performance_breakdown": {
    "titre": number (1-10),
    "description": number (1-10),
    "tags": number (1-10),
    "timing": number (1-10),
    "duree": number (1-10)
  },

  "kills": [
    "string — ce qui aurait pu booster encore plus les vues (même si la vidéo a bien marché)",
    "string",
    "string",
    "string",
    "string"
  ],

  "title_analysis": "string — analyse précise du titre : hook, keyword, émotion, longueur, clarté",
  "title_fixed": "string — version améliorée du titre, même niche, même langue que l'original",

  "description_problem": "string — problèmes SEO et structure détectés",
  "description_fixed": "string — version améliorée avec mots-clés, structure et CTA",

  "tags_analysis": "string — évaluation des tags existants",
  "tags_fixed": ["string", "string", "string", "string", "string", "string", "string", "string"],

  "timing": "string — analyse du jour/heure de publication et recommandation précise pour cette niche",

  "thumbnail_tips": "string — conseils thumbnail basés sur le titre et la niche (sans voir l'image)",

  "quickwins": [
    "string — action concrète et immédiate pour la prochaine vidéo",
    "string",
    "string"
  ],

  "next_video_idea": "string — idée de prochaine vidéo basée sur la niche et ce qui a marché"
}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 429) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw new Error("OPENAI_API_ERROR");
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OPENAI_API_ERROR");
  }

  try {
    const parsed = JSON.parse(content) as DiagnosisJSON;
    return {
      score: typeof parsed.score === "number" ? parsed.score : 5,
      ratio_analysis: parsed.ratio_analysis,
      context: String(parsed.context ?? ""),
      verdict: String(parsed.verdict ?? ""),
      overperformed: Boolean(parsed.overperformed),
      performance_breakdown: parsed.performance_breakdown,
      kills: Array.isArray(parsed.kills) ? parsed.kills : [],
      title_analysis: String(parsed.title_analysis ?? ""),
      title_fixed: String(parsed.title_fixed ?? ""),
      description_problem: String(parsed.description_problem ?? ""),
      description_fixed: String(parsed.description_fixed ?? ""),
      tags_analysis: String(parsed.tags_analysis ?? ""),
      tags_fixed: Array.isArray(parsed.tags_fixed) ? parsed.tags_fixed : [],
      timing: String(parsed.timing ?? ""),
      thumbnail_tips: String(parsed.thumbnail_tips ?? ""),
      quickwins: Array.isArray(parsed.quickwins) ? parsed.quickwins : [],
      next_video_idea: String(parsed.next_video_idea ?? ""),
    };
  } catch {
    throw new Error("OPENAI_API_ERROR");
  }
}

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

    let { data: profile } = await supabase
      .from("profiles")
      .select("analyses_used, analyses_limit")
      .eq("id", user.id)
      .single();

    if (!profile && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const admin = createAdminClient();
        await admin.from("profiles").insert({
          id: user.id,
          email: user.email,
          username: user.user_metadata?.username ?? user.email?.split("@")[0],
          plan: "free",
          analyses_used: 0,
          analyses_limit: 3,
        });
        profile = { analyses_used: 0, analyses_limit: 3 };
      } catch {
        // Trigger may have created it, retry fetch
        const { data: retry } = await supabase
          .from("profiles")
          .select("analyses_used, analyses_limit")
          .eq("id", user.id)
          .single();
        profile = retry ?? null;
      }
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Profil non trouvé. Réessaie de te connecter." },
        { status: 403 }
      );
    }

    if (profile.analyses_used >= profile.analyses_limit) {
      return NextResponse.json(
        { error: "Quota d'analyses atteint. Passe à un plan supérieur." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const url = body?.url?.trim();

    if (!url) {
      return NextResponse.json(
        { error: "Champ vide." },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "URL invalide." },
        { status: 400 }
      );
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Erreur de configuration serveur." },
        { status: 500 }
      );
    }

    const videoData = await fetchYouTubeData(videoId, apiKey);
    const diagnosis = await getOpenAIDiagnosis(videoData);

    const videoDataWithDuration = {
      ...videoData,
      duration: parseDuration(videoData.duration),
    };

    const result = {
      diagnosis,
      videoData: videoDataWithDuration,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        video_url: url,
        video_id: videoId,
        video_title: videoData.title,
        video_thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        view_count: videoData.viewCount,
        subscriber_count: videoData.subscriberCount,
        score: diagnosis.score,
        result,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Supabase analyses insert error:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde." },
        { status: 500 }
      );
    }

    await supabase
      .from("profiles")
      .update({ analyses_used: (profile?.analyses_used ?? 0) + 1 })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      id: inserted?.id,
      videoId,
      videoData: videoDataWithDuration,
      diagnosis,
    } as const);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "QUOTA_EXCEEDED") {
      return NextResponse.json(
        { error: "Réessaie dans quelques minutes." },
        { status: 503 }
      );
    }

    if (message === "VIDEO_NOT_FOUND") {
      return NextResponse.json(
        { error: "Vidéo privée, supprimée ou indisponible." },
        { status: 404 }
      );
    }

    if (message === "YOUTUBE_API_ERROR") {
      return NextResponse.json(
        { error: "Réessaie dans quelques minutes." },
        { status: 503 }
      );
    }

    if (message.includes("API_KEY") || message.includes("not configured")) {
      return NextResponse.json(
        { error: "Erreur de configuration serveur." },
        { status: 500 }
      );
    }

    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: "Erreur." },
      { status: 500 }
    );
  }
}
