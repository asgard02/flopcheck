"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type HeaderProps = {
  onHistoryClick?: () => void;
  refreshBadge?: number;
};

export function Header({ refreshBadge = 0 }: HeaderProps) {
  const [analysesUsed, setAnalysesUsed] = useState(0);
  const [analysesLimit, setAnalysesLimit] = useState(3);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setAnalysesUsed(data.analyses_used ?? 0);
          setAnalysesLimit(data.analyses_limit ?? 3);
        }
      })
      .catch(() => {});
  }, [refreshBadge]);

  return (
    <header className="sticky top-0 z-20 flex h-[52px] items-center justify-end gap-3 px-6 bg-[#080809] border-b border-[#0f0f12]">
      <span className="font-mono text-xs text-zinc-500 px-3 py-1.5 rounded-md bg-[#0c0c0e] border border-[#0f0f12]">
        {analysesUsed}/{analysesLimit} analyses
      </span>
      <Link
        href="/upgrade"
        className="font-mono text-xs font-medium px-4 py-2 rounded-md bg-[#00ff88] text-[#080809] hover:bg-[#00ff88]/90 transition-colors"
      >
        Upgrade
      </Link>
    </header>
  );
}
