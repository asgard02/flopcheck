"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ResultView } from "@/components/result/ResultView";
import type { HistoryItem } from "@/components/dashboard/types";

export default function AnalysePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [item, setItem] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/history/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Non trouvé");
        return res.json();
      })
      .then(setItem)
      .catch(() => setError("Analyse introuvable."))
      .finally(() => setLoading(false));
  }, [id]);

  const diagnosis = item?.diagnosis;
  const videoData = item?.video_data;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080809] text-zinc-300">
        <Sidebar />
        <div className="pl-[60px] min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3 font-mono text-sm text-zinc-500">
              <span className="size-2 rounded-full bg-[#00ff88] animate-pulse" />
              Chargement...
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !item || !diagnosis || !videoData) {
    return (
      <div className="min-h-screen bg-[#080809] text-zinc-300">
        <Sidebar />
        <div className="pl-[60px] min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex flex-col items-center justify-center gap-6">
            <p className="font-mono text-sm text-[#ff3b3b]">
              {error || "Analyse introuvable."}
            </p>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 font-mono text-sm text-[#00ff88] hover:underline"
            >
              Retour à l&apos;accueil
            </button>
          </main>
        </div>
      </div>
    );
  }

  const vd = videoData as {
    title?: string;
    description?: string;
    tags?: string[];
    duration?: string;
    viewCount?: string;
    publishedAt?: string;
    channelTitle?: string;
  };

  return (
    <ResultView
      videoId={item.video_id}
      videoData={vd}
      diagnosis={diagnosis}
      onBack={() => router.push("/dashboard")}
      onDelete={async () => {
        if (deleting) return;
        setDeleting(true);
        try {
          const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
          if (res.ok) router.push("/projets");
        } finally {
          setDeleting(false);
        }
      }}
      deleting={deleting}
      showDelete
    />
  );
}
