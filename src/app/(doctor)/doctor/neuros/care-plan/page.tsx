"use client";

import { useState } from "react";
import CarePlanCloser from "./CarePlanCloser";
import PatientHistory from "./PatientHistory";

export default function CarePlanPage() {
  const [view, setView] = useState<"builder" | "history">("builder");
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <div>
      {/* View toggle */}
      <div className="flex gap-0 bg-white rounded-xl border border-gray-200 overflow-hidden mb-6 max-w-xs">
        <button
          onClick={() => { setView("builder"); setEditId(null); }}
          className={`flex-1 py-2.5 text-xs font-bold text-center transition-all ${view === "builder" ? "bg-[#1E2D3B] text-white" : "text-gray-400"}`}
        >
          New Care Plan
        </button>
        <button
          onClick={() => setView("history")}
          className={`flex-1 py-2.5 text-xs font-bold text-center transition-all ${view === "history" ? "bg-[#1E2D3B] text-white" : "text-gray-400"}`}
        >
          Saved Plans
        </button>
      </div>

      {view === "builder" && <CarePlanCloser editId={editId} />}
      {view === "history" && (
        <PatientHistory onEdit={(id) => { setEditId(id); setView("builder"); }} />
      )}
    </div>
  );
}
