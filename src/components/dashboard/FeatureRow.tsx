"use client";

const features = ["IA", "SEO", "Diagnostic", "Quick wins", "Score", "Suggestions"];

export function FeatureRow() {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-10">
      {features.map((label) => (
        <span
          key={label}
          className="px-3 py-1 rounded-full text-xs text-zinc-500 bg-zinc-800/50 border border-zinc-800/80"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
