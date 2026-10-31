"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Users, MapPin, DollarSign, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getActiveCycle, getMyMatchPositions } from "./actions";
import type { MatchCycle, MatchPosition } from "@/types/chiromatch";
import { deriveCycleStatus } from "@/lib/chiromatch-status";
import UpgradeGate from "@/components/doctor/UpgradeGate";
import HiringTabs from "../jobs/HiringTabs";

export default function DoctorChiroMatchPage() {
  return (
    <UpgradeGate feature="ChiroMatch" requiredTier="pro" description="Residency-style matching to find your ideal associate or next opportunity. Post positions and rank candidates automatically.">
      <DoctorChiroMatchContent />
    </UpgradeGate>
  );
}

function betweenCyclesCopy(cycle: MatchCycle | null) {
  const raw = cycle?.ranking_opens_at;
  if (!raw) return "Next cycle dates coming soon.";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Next cycle dates coming soon.";
  const formatted = date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  return `ChiroMatch is between cycles. Next cycle opens ${formatted}`;
}

function DoctorChiroMatchContent() {
  const [cycle, setCycle] = useState<MatchCycle | null>(null);
  const [positions, setPositions] = useState<MatchPosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getActiveCycle(), getMyMatchPositions()]).then(([c, p]) => {
      setCycle(c);
      setPositions(p);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <HiringTabs />
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-portal-muted" />
        </div>
      </div>
    );
  }

  const derived = cycle ? deriveCycleStatus(cycle, new Date()) : null;
  const rankingOpen = derived?.open === true;
  const showCycle = Boolean(cycle && derived && (rankingOpen || derived.phase === "closed"));
  const canCreatePosition = Boolean(cycle && derived && (rankingOpen || derived.phase === "upcoming"));
  const cyclePositions = cycle ? positions.filter((p) => p.cycle_id === cycle.id && p.status === "active") : [];
  const statusLabel = rankingOpen ? "Ranking open" : "Ranking closed";

  return (
    <div className="space-y-6">
      <HiringTabs />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-portal-ink">ChiroMatch</h1>
          <p className="mt-1 text-sm text-portal-ink-2">Match with associates through a ranking cycle.</p>
        </div>
        {canCreatePosition && (
          <Link
            href="/doctor/chiromatch/create"
            className="min-h-11 inline-flex items-center gap-2 px-4 rounded-lg bg-portal-accent text-white text-sm font-bold"
          >
            <Plus className="w-4 h-4" /> Create position
          </Link>
        )}
      </div>

      {showCycle && cycle ? (
        <div className="bg-white rounded-xl border border-portal-border p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-sm text-portal-muted mb-1">Current cycle</p>
              <h2 className="text-xl font-bold text-portal-ink">{cycle.name}</h2>
            </div>
            <span className="px-3 py-1 rounded-lg bg-portal-surface text-sm font-bold text-portal-ink">{statusLabel}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-portal-muted mb-1">Ranking opens</p>
              <p className="text-sm font-bold text-portal-ink">{new Date(cycle.ranking_opens_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-portal-muted mb-1">Ranking closes</p>
              <p className="text-sm font-bold text-portal-ink">{new Date(cycle.ranking_closes_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-portal-muted mb-1">Match day</p>
              <p className="text-sm font-bold text-portal-ink">{new Date(cycle.match_day).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-portal-border p-6">
          <p className="text-sm text-portal-ink">{betweenCyclesCopy(cycle)}</p>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-portal-ink mb-3">Your positions</h2>
        {cyclePositions.length === 0 ? (
          <div className="bg-white rounded-xl border border-portal-border p-6">
            <p className="text-sm text-portal-ink-2 mb-3">
              {cycle ? "You have not created any positions for this cycle yet." : "Positions show here when a cycle is scheduled."}
            </p>
            {canCreatePosition && (
              <Link href="/doctor/chiromatch/create" className="text-sm font-bold text-portal-accent inline-flex items-center gap-1">
                Create your first position <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {cyclePositions.map((pos) => (
              <div key={pos.id} className="bg-white rounded-xl border border-portal-border p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-portal-ink">{pos.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-portal-ink-2">
                      {pos.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {pos.city}{pos.state ? `, ${pos.state}` : ""}
                        </span>
                      )}
                      {pos.salary_min && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${pos.salary_min.toLocaleString()}{pos.salary_max ? ` – $${pos.salary_max.toLocaleString()}` : ""}
                        </span>
                      )}
                      {pos.mentorship_offered && <span>Mentorship</span>}
                    </div>
                  </div>
                  <Link
                    href={`/doctor/chiromatch/candidates?position=${pos.id}`}
                    className="min-h-11 px-3 inline-flex items-center gap-1 rounded-lg border border-portal-border text-sm font-bold text-portal-ink"
                  >
                    <Users className="w-4 h-4" /> View candidates
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
