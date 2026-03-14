"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Film, Loader2, Scissors, Trash2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useProfile } from "@/lib/profile-context";

type JobStatus = "pending" | "processing" | "done" | "error";

type ClipJob = {
  id: string;
  url: string;
  duration: number;
  status: JobStatus;
  error?: string | null;
  clips: { downloadUrl?: string }[];
  created_at: string;
};

function formatDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ClipProjetPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProjets = searchParams.get("from") === "projets";
  const backHref = fromProjets ? "/projets?tab=clips" : "/dashboard";
  const { profile } = useProfile();
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<ClipJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    params.then((p) => setJobId(p.jobId));
  }, [params]);

  useEffect(() => {
    if (!jobId || !profile || profile.plan === "free") return;

    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/clips/${jobId}`);
        if (!res.ok) {
          setJob(null);
          return;
        }
        const data = await res.json();
        setJob({
          id: jobId,
          url: data.url ?? "",
          duration: data.duration ?? 60,
          status: data.status,
          error: data.error,
          clips: Array.isArray(data.clips) ? data.clips : [],
          created_at: data.created_at ?? new Date().toISOString(),
        });
      } catch {
        setJob(null);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId, profile]);

  useEffect(() => {
    if (profile === null) return;
    if (profile?.plan === "free") {
      router.replace("/plans");
    }
  }, [profile, router]);

  if (profile?.plan === "free") {
    return (
      <div className="min-h-screen bg-[#080809] flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#9b6dff]" />
      </div>
    );
  }

  if (loading || !job) {
    return (
      <div className="min-h-screen bg-[#080809] text-zinc-300">
        <Sidebar activeItem="accueil" />
        <div className="pl-[60px] min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            {loading ? (
              <Loader2 className="size-12 animate-spin text-[#9b6dff]" />
            ) : (
              <div className="text-center">
                <p className="font-mono text-zinc-500 mb-4">
                  Projet introuvable
                </p>
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-2 font-mono text-sm text-[#9b6dff] hover:text-[#9b6dff]/80"
                >
                  <ArrowLeft className="size-4" />
                  Retour aux clips
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  const sourceLabel = job.url.replace(/^https?:\/\//, "").slice(0, 50);
  const clips = job.clips ?? [];
  const isDone = job.status === "done" && clips.length > 0;

  const handleDelete = async () => {
    if (!jobId || deleting) return;
    if (!confirm("Supprimer ce projet et tous les clips ?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clips/${jobId}`, { method: "DELETE" });
      if (res.ok) router.push(backHref);
    } finally {
      setDeleting(false);
    }
  };

  const handleRefaireClips = () => {
    if (!job?.url) return;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("vyrll_pending_clip_url", job.url);
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#080809] text-zinc-300 overflow-hidden">
      <Sidebar activeItem="accueil" />
      <div className="pl-[60px] min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="max-w-6xl mx-auto">
            {/* Back + Refaire + Delete */}
            <div className="flex items-center justify-between gap-4 mb-8">
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 font-mono text-sm text-zinc-500 hover:text-[#9b6dff] transition-colors"
              >
                <ArrowLeft className="size-4" />
                Retour aux clips
              </Link>
              <div className="flex items-center gap-4">
                {job.url && (
                  <button
                    type="button"
                    onClick={handleRefaireClips}
                    className="inline-flex items-center gap-2 font-mono text-sm text-zinc-500 hover:text-[#9b6dff] transition-colors"
                  >
                    <Scissors className="size-4" />
                    Refaire des clips
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 font-mono text-sm text-zinc-500 hover:text-[#ff3b3b] transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Supprimer
                </button>
              </div>
            </div>

            {/* Header */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#9b6dff]/10 border border-[#9b6dff]/20 mb-4">
                <Film className="size-3.5 text-[#9b6dff]" />
                <span className="font-mono text-xs text-[#9b6dff] uppercase tracking-wider">
                  Projet clips
                </span>
              </div>
              <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-2xl sm:text-3xl text-white mb-2">
                {isDone ? `${clips.length} clip${clips.length > 1 ? "s" : ""} généré${clips.length > 1 ? "s" : ""}` : "Génération en cours"}
              </h1>
              <p className="font-mono text-sm text-zinc-500 truncate max-w-xl">
                {sourceLabel}…
              </p>
              <p className="font-mono text-xs text-zinc-600 mt-1">
                {job.duration}s · {formatDate(job.created_at)}
              </p>
            </div>

            {/* Status */}
            {job.status === "pending" || job.status === "processing" ? (
              <div className="rounded-2xl border border-[#0f0f12] bg-[#0c0c0e] p-8 text-center">
                <Loader2 className="size-12 animate-spin text-[#9b6dff] mx-auto mb-4" />
                <p className="font-mono text-sm text-zinc-400">
                  Téléchargement, transcription et découpe en cours…
                </p>
                <p className="font-mono text-xs text-zinc-600 mt-2">
                  ~2–3 min
                </p>
              </div>
            ) : job.status === "error" ? (
              <div className="rounded-2xl border border-[#ff3b3b]/30 bg-[#ff3b3b]/5 p-8 text-center">
                <p className="font-mono text-sm text-[#ff3b3b]">
                  {job.error ?? "Erreur lors de la génération"}
                </p>
              </div>
            ) : isDone ? (
              /* Clips grid with video players */
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {clips.map((clip, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-[#0f0f12] bg-[#0c0c0e] overflow-hidden hover:border-[#1a1a1e] transition-all group"
                  >
                    <div className="relative aspect-[9/16] bg-black">
                      <video
                        src={clip.downloadUrl}
                        controls
                        playsInline
                        className="w-full h-full object-contain"
                        preload="metadata"
                      />
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/60 font-mono text-xs text-white">
                        Clip {i + 1}
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between gap-2">
                      <span className="font-mono text-sm text-zinc-400">
                        Clip {i + 1}
                      </span>
                      <a
                        href={clip.downloadUrl}
                        download={`clip-${i + 1}.mp4`}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-gradient text-[#080809] font-mono text-xs font-bold hover:opacity-90 transition-opacity"
                      >
                        <Download className="size-3.5" />
                        Télécharger
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
