"use client";

import { useState } from "react";
import { Copy, Check, X } from "lucide-react";

export type DiagnosisResult = {
  score: number;
  context?: string;
  verdict: string;
  overperformed?: boolean;
  kills: string[];
  title_analysis?: string;
  title_original?: string;
  title_problem?: string;
  title_fixed: string;
  description_problem: string;
  description_fixed: string;
  tags_problem?: string;
  tags_fixed: string[];
  timing: string;
  quickwins: string[];
};

export type VideoData = {
  title: string;
  description: string;
  tags: string[];
  duration: string;
  viewCount: string;
  publishedAt: string;
  channelTitle: string;
};

type ResultPanelProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  loadingStep?: number;
  error: string | null;
  result: {
    diagnosis: DiagnosisResult;
    videoData: VideoData;
  } | null;
};

export function ResultPanel({
  open,
  onClose,
  loading,
  loadingStep = 0,
  error,
  result,
}: ResultPanelProps) {
  return (
    <>
      {/* Overlay - #00000040 */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel - 0 → 440px */}
      <aside
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-[#0c0c0e] border-l border-[#0f0f12] shadow-xl transition-[width] duration-300 ease-[cubic-bezier(.4,0,.2,1)] overflow-hidden"
        style={{ width: open ? "min(440px, 100vw)" : 0 }}
      >
        <div className="w-full min-h-full flex flex-col shrink-0 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#0f0f12] shrink-0">
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-white text-sm">
              Résultat d&apos;analyse
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-md text-zinc-500 hover:text-white hover:bg-[#0d0d0f] transition-colors"
              aria-label="Fermer"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading && (
              <LoadingSteps step={loadingStep} />
            )}

            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <p className="font-mono text-sm text-[#ff3b3b]">{error}</p>
              </div>
            )}

            {result && !loading && !error && (
              <ResultContent result={result} />
            )}

            {!loading && !error && !result && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <p className="font-mono text-sm text-zinc-500">
                  Lance une analyse pour voir le résultat ici.
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function LoadingSteps({ step }: { step: number }) {
  const steps = [
    "Récupération des données YouTube...",
    "Analyse IA en cours...",
    "Génération du diagnostic...",
  ];

  return (
    <div className="space-y-4 py-4">
      {steps.map((label, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 font-mono text-sm transition-opacity ${
            i <= step ? "text-zinc-300" : "text-zinc-600"
          }`}
        >
          <span
            className={`size-2 rounded-full shrink-0 ${
              i < step ? "bg-[#9b6dff]" : i === step ? "bg-[#9b6dff] animate-pulse" : "bg-zinc-600"
            }`}
          />
          {label}
        </div>
      ))}
    </div>
  );
}

function ResultContent({
  result,
}: {
  result: { diagnosis: DiagnosisResult; videoData: VideoData };
}) {
  const { diagnosis, videoData } = result;
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Score - arc SVG */}
      <ScoreArc score={diagnosis.score} />

      {/* Context & Verdict */}
      {diagnosis.context && (
        <div>
          <p className="font-mono text-xs text-zinc-500 uppercase mb-1">Contexte</p>
          <p className="text-sm text-zinc-400">{diagnosis.context}</p>
        </div>
      )}
      <div>
        <p className="font-mono text-xs text-zinc-500 uppercase mb-1">Verdict</p>
        <p className="text-sm text-zinc-300">{diagnosis.verdict}</p>
        {diagnosis.overperformed && (
          <span className="inline-block mt-1 font-mono text-xs text-[#4a9e6a]">↑ Overperformed</span>
        )}
      </div>

      {/* Ce qui aurait pu être encore mieux */}
      <div>
        <p className="font-mono text-xs text-zinc-500 uppercase mb-2">Ce qui aurait pu être encore mieux</p>
        <ul className="space-y-2">
          {diagnosis.kills.map((k, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="font-mono text-[#ff3b3b] shrink-0">[{i + 1}]</span>
              <span className="text-zinc-300">{k}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Titre */}
      <div>
        <p className="font-mono text-xs text-zinc-500 uppercase mb-2">Titre</p>
        <div className="space-y-2">
          {(diagnosis.title_analysis || diagnosis.title_problem) && (
            <p className="text-sm text-zinc-500">{diagnosis.title_analysis || diagnosis.title_problem}</p>
          )}
          <p className="text-sm text-zinc-500 line-through">
            {videoData.title}
          </p>
          <p className="text-sm text-[#4a9e6a]">{diagnosis.title_fixed}</p>
          <button
            type="button"
            onClick={() => copyToClipboard(diagnosis.title_fixed, "title")}
            className="flex items-center gap-1.5 rounded px-2 py-1 font-mono text-xs text-zinc-500 hover:text-zinc-300 hover:bg-[#0d0d0f] transition-colors"
          >
            {copiedId === "title" ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copiedId === "title" ? "Copié" : "Copier"}
          </button>
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="font-mono text-xs text-zinc-500 uppercase mb-2">Tags</p>
        <div className="flex flex-wrap gap-2">
          {diagnosis.tags_fixed.map((t, i) => (
            <span
              key={i}
              className="font-mono text-xs px-2 py-1 rounded bg-[#4a9e6a]/10 text-[#4a9e6a] border border-[#4a9e6a]/20"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Quick wins */}
      <div>
        <p className="font-mono text-xs text-zinc-500 uppercase mb-2">Quick wins</p>
        <ul className="space-y-2">
          {diagnosis.quickwins.map((w, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="font-mono text-[#9b6dff] shrink-0">[{i + 1}]</span>
              <span className="text-zinc-300">{w}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Meta */}
      <div className="pt-4 border-t border-[#0f0f12] font-mono text-xs text-zinc-500">
        {parseInt(videoData.viewCount, 10).toLocaleString()} vues · {videoData.duration}
      </div>
    </div>
  );
}

function ScoreArc({ score }: { score: number }) {
  const normalized = Math.min(10, Math.max(0, score));
  const percent = (normalized / 10) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const getScoreColor = () => {
    if (score >= 7) return "#4a9e6a";
    if (score >= 4) return "#facc15";
    return "#ff3b3b";
  };

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative flex items-center justify-center">
        <svg className="size-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#0f0f12"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={getScoreColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute font-[family-name:var(--font-syne)] font-extrabold text-2xl text-white">
          {score}
        </span>
      </div>
      <span className="font-mono text-xs text-zinc-500 mt-1">/10</span>
    </div>
  );
}
