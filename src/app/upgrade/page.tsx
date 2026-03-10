"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Tag, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

type Plan = {
  name: string;
  analyses: number;
  price: string;
};

const PLANS: Plan[] = [
  { name: "Free", analyses: 3, price: "0€" },
  { name: "Pro", analyses: 50, price: "9€/mois" },
  { name: "Unlimited", analyses: 999, price: "29€/mois" },
];

export default function UpgradePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profile, setProfile] = useState<{ plan: string; analyses_limit: number } | null>(null);
  const [badgeRefresh, setBadgeRefresh] = useState(0);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => data && setProfile({ plan: data.plan, analyses_limit: data.analyses_limit }))
      .catch(() => {});
  }, [badgeRefresh]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Code invalide." });
        return;
      }

      setMessage({ type: "success", text: data.message || "Code appliqué !" });
      setCode("");
      setBadgeRefresh((c) => c + 1);
      if (profile) {
        setProfile({
          plan: data.plan ?? profile.plan,
          analyses_limit: data.analyses_limit ?? profile.analyses_limit,
        });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur réseau." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080809] text-zinc-300">
      <Sidebar activeItem="accueil" />
      <div className="pl-[60px] min-h-screen flex flex-col">
        <Header refreshBadge={badgeRefresh} />

        <main className="flex-1 px-6 py-8">
          <div className="max-w-2xl mx-auto">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500 hover:text-[#00ff88] transition-colors mb-8"
            >
              <ArrowLeft className="size-4" />
              Retour à l&apos;accueil
            </Link>

            <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-2xl text-white mb-2">
              Plan & Upgrade
            </h1>
            <p className="font-mono text-sm text-zinc-500 mb-10">
              {profile && (
                <>Ton plan actuel : <span className="text-[#00ff88] capitalize">{profile.plan}</span> ({profile.analyses_limit} analyses)</>
              )}
            </p>

            {/* Section Code promo */}
            <section className="rounded-xl border border-[#0f0f12] bg-[#0c0c0e] p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Tag className="size-5 text-[#00ff88]" />
                <h2 className="font-[family-name:var(--font-syne)] font-bold text-white">
                  Code promo
                </h2>
              </div>
              <p className="font-mono text-xs text-zinc-500 mb-4">
                Tu as un code ? Entre-le ici pour passer au plan supérieur ou obtenir une réduction.
              </p>
              <form onSubmit={handleRedeem} className="flex gap-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setMessage(null);
                  }}
                  placeholder="FLOPPRO"
                  disabled={loading}
                  className="flex-1 h-11 px-4 rounded-lg border border-[#0f0f12] bg-[#0d0d0f] text-white placeholder-zinc-600 font-mono text-sm outline-none transition-all focus:border-[#1a1a1e] focus:ring-1 focus:ring-[#1a1a1e] disabled:opacity-50 uppercase"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 px-5 rounded-lg bg-[#00ff88] text-[#080809] font-[family-name:var(--font-syne)] font-bold text-sm hover:bg-[#00ff88]/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Appliquer
                    </>
                  ) : (
                    "Appliquer"
                  )}
                </button>
              </form>
              {message && (
                <p
                  className={`mt-3 font-mono text-xs ${
                    message.type === "success" ? "text-[#00ff88]" : "text-[#ff3b3b]"
                  }`}
                >
                  {message.text}
                </p>
              )}
            </section>

            {/* Section Paiement */}
            <section className="rounded-xl border border-[#0f0f12] bg-[#0c0c0e] p-6 opacity-60">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="size-5 text-zinc-500" />
                <h2 className="font-[family-name:var(--font-syne)] font-bold text-zinc-400">
                  Paiement
                </h2>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-500">
                  Bientôt
                </span>
              </div>
              <p className="font-mono text-xs text-zinc-600 mb-4">
                Le paiement en ligne sera disponible prochainement. En attendant, utilise un code promo pour obtenir plus d&apos;analyses.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLANS.map((plan) => (
                  <div
                    key={plan.name}
                    className="rounded-lg border border-[#0f0f12] bg-[#0d0d0f] p-4 text-center"
                  >
                    <p className="font-[family-name:var(--font-syne)] font-bold text-white">
                      {plan.name}
                    </p>
                    <p className="font-mono text-xs text-zinc-500 mt-1">
                      {plan.analyses} analyses
                    </p>
                    <p className="font-mono text-sm text-zinc-400 mt-2">{plan.price}</p>
                    <button
                      type="button"
                      disabled
                      className="mt-3 w-full py-2 rounded-lg font-mono text-xs font-medium bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    >
                      Indisponible
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
