"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import type { HistoryItem } from "@/components/dashboard/types";

export default function HistoriquePage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#080809] text-zinc-300">
      <Sidebar activeItem="historique" />
      <div className="pl-[60px] min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 px-6 py-8">
          <div className="max-w-5xl mx-auto">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500 hover:text-[#00ff88] transition-colors mb-8"
            >
              <ArrowLeft className="size-4" />
              Retour à l&apos;accueil
            </Link>

            <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-2xl text-white mb-6">
              Historique des analyses
            </h1>

            {loading ? (
              <div className="flex items-center gap-3 font-mono text-sm text-zinc-500 py-12">
                <span className="size-2 rounded-full bg-[#00ff88] animate-pulse" />
                Chargement...
              </div>
            ) : history.length === 0 ? (
              <p className="font-mono text-sm text-zinc-500 py-12">
                Aucune analyse enregistrée.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="relative flex flex-col rounded-xl border border-[#0f0f12] bg-[#0c0c0e] hover:bg-[#0d0d0f] hover:border-[#1a1a1e] transition-all overflow-hidden group"
                  >
                    <button
                      type="button"
                      onClick={() => router.push(`/analyse/${item.id}`)}
                      className="flex flex-col text-left w-full"
                    >
                      <div className="w-full aspect-video overflow-hidden bg-[#0d0d0f]">
                        <Image
                          src={`https://img.youtube.com/vi/${item.video_id}/maxresdefault.jpg`}
                          alt=""
                          width={640}
                          height={360}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-white line-clamp-2">
                          {item.video_title || "Sans titre"}
                        </p>
                        <p className="mt-1.5 font-mono text-xs flex items-center gap-2 flex-wrap">
                          <span
                            className="font-bold"
                            style={{
                              color:
                                item.score >= 7
                                  ? "#00ff88"
                                  : item.score >= 4
                                    ? "#facc15"
                                    : "#ff3b3b",
                            }}
                          >
                            {item.score}/10
                          </span>
                          <span className="text-zinc-500">
                            · {item.channel_title || "—"}
                          </span>
                          <span className="text-zinc-600">
                            · {new Date(item.created_at).toLocaleDateString("fr-FR")}
                          </span>
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const res = await fetch(`/api/history/${item.id}`, { method: "DELETE" });
                          if (res.ok) setHistory((prev) => prev.filter((h) => h.id !== item.id));
                        } catch {
                          // ignore
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 text-zinc-400 hover:text-[#ff3b3b] hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
