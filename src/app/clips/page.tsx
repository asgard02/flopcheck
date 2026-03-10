"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function ClipsPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message ?? "Tu seras notifié à la sortie !");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Erreur.");
      }
    } catch {
      setStatus("error");
      setMessage("Erreur réseau.");
    }
  };

  return (
    <div className="min-h-screen bg-[#080809] text-zinc-300 overflow-hidden">
      <Sidebar activeItem="clips" />
      <div className="pl-[60px] min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-52px)] px-6 py-12">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-[#0f0f12] bg-[#0a0a0c] p-10 text-center">
              <span className="text-6xl block mb-6">✂️</span>
              <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-2xl sm:text-3xl text-white mb-3">
                Clips IA — bientôt disponible
              </h1>
              <p className="font-mono text-sm text-zinc-500 mb-8 leading-relaxed">
                Génère automatiquement des shorts et clips à partir de tes longues vidéos. On travaille dessus.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder="ton@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "loading"}
                  className="w-full h-11 px-4 rounded-lg border border-[#0f0f12] bg-[#0d0d0f] text-white placeholder-zinc-600 font-mono text-sm outline-none focus:border-[#1a1a1e] focus:ring-1 focus:ring-[#1a1a1e] disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full h-11 rounded-lg bg-[#00ff88] text-[#080809] font-mono text-sm font-bold hover:bg-[#00ff88]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? "Envoi..." : "Me notifier"}
                </button>
              </form>

              {message && (
                <p
                  className={`mt-4 font-mono text-xs ${
                    status === "success" ? "text-[#00ff88]" : "text-[#ff3b3b]"
                  }`}
                >
                  {message}
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
