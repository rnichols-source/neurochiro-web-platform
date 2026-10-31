"use client";

export default function ViewTogglePill({
  view,
  onChange,
}: {
  view: "list" | "map";
  onChange: (view: "list" | "map") => void;
}) {
  const next = view === "list" ? "map" : "list";
  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      className="nc-view-toggle fixed left-1/2 z-[220] flex min-h-12 -translate-x-1/2 items-center rounded-full bg-neuro-navy px-5 text-sm font-bold text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-neuro-orange lg:hidden"
      style={{ bottom: "calc(16px + env(safe-area-inset-bottom))" }}
      aria-label={view === "list" ? "Show map" : "Show list"}
    >
      {view === "list" ? "🗺 Map" : "☰ List"}
    </button>
  );
}
