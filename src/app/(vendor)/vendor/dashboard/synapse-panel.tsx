"use client";

import { useState } from "react";
import { ADDONS, formatDollars } from "@/lib/synapse/config";
import PartnerDisclosure from "@/components/synapse/PartnerDisclosure";
import { loadVendorSynapse, replyToRequest, saveVendorPerk, startAddonCheckout, type VendorSynapse } from "./synapse-actions";

export default function SynapsePanel({ initial }: { initial: VendorSynapse | { error: string } }) {
  const [data, setData] = useState<VendorSynapse | null>("error" in initial ? null : initial);
  const [note, setNote] = useState<string | null>("error" in initial ? initial.error : null);

  async function refresh() {
    const next = await loadVendorSynapse();
    if ("error" in next) setNote(next.error);
    else setData(next);
  }

  if (!data) return <p className="text-sm text-gray-500">{note || "Synapse is unavailable."}</p>;

  const atRisk = data.seat && (data.seat.status === "at_risk" || data.seat.proofFlag === "at_risk" || data.seat.status === "review" || data.seat.proofFlag === "review");

  return (
    <div className="space-y-6">
      {note ? <p className="text-sm text-[#1E2D3B]">{note}</p> : null}
      {!data.schemaReady ? <p className="rounded-2xl bg-white p-4 text-sm">Synapse tables are not in this database yet. The migration has not been run.</p> : null}

      <section className="space-y-3 rounded-2xl bg-white p-4">
        <h2 className="font-heading text-xl font-black text-[#1E2D3B]">Seat</h2>
        {data.seat ? (
          <>
            <p className="text-sm">{data.seat.tier} · {data.seat.categoryKey} · {data.seat.country} · {data.seat.status}</p>
            <p className="text-sm text-gray-600">Term {data.seat.termStart ? new Date(data.seat.termStart).toLocaleDateString() : "not started"} to {data.seat.termEnd ? new Date(data.seat.termEnd).toLocaleDateString() : "—"}</p>
            <p className="text-sm">Current fee {data.seat.feeCents != null ? formatDollars(data.seat.feeCents) : "—"} · Renewal preview {data.seat.renewalCents != null ? formatDollars(data.seat.renewalCents) : "unavailable"}</p>
            <p className="text-sm">Proof Score {data.seat.proofScore ?? "n/a"} ({data.seat.proofFlag}). Pledge {data.seat.pledgedAt || "not recorded"}.</p>
            {atRisk ? <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">This seat is at risk or in review. NeuroChiro does not remove it automatically.</p> : null}
            <PartnerDisclosure kind={data.seat.tier === "ally" ? "ally" : "anchor"} />
          </>
        ) : <p className="text-sm text-gray-500">No seat is reserved yet.</p>}
      </section>

      <PerkEditor onDone={async (message) => { setNote(message); await refresh(); }} />

      <section className="space-y-2 rounded-2xl bg-white p-4">
        <h2 className="font-heading text-xl font-black">Your perks</h2>
        {data.perks.length === 0 ? <p className="text-sm text-gray-500">No perks saved.</p> : null}
        {data.perks.map((perk) => (
          <article key={perk.id} className="rounded-xl bg-[#F5F3EF] p-3 text-sm">
            <p className="font-bold">{perk.title}</p>
            <p>Code {perk.code} · {perk.audience} · {perk.active ? "active" : "hidden"}</p>
            <PartnerDisclosure kind={data.seat?.tier === "ally" ? "ally" : "anchor"} />
          </article>
        ))}
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4">
        <h2 className="font-heading text-xl font-black">Requests</h2>
        {data.requests.length === 0 ? <p className="text-sm text-gray-500">No open requests in your category and country.</p> : null}
        {data.requests.map((request) => (
          <article key={request.id} className="space-y-2 rounded-xl border border-gray-100 p-3">
            <p className="font-bold">{request.category}</p>
            <p className="text-sm">{request.description}</p>
            <p className="text-xs text-gray-500">{request.budget} · {request.timeline} · {request.state || "State hidden"} · {request.country}</p>
            {request.firstLookUntil ? <p className="text-xs">Anchor first look until {new Date(request.firstLookUntil).toLocaleString()}</p> : null}
            {request.canReply ? (
              <form className="grid gap-2" onSubmit={async (event) => {
                event.preventDefault();
                const formEl = event.currentTarget;
                const form = new FormData(formEl);
                const result = await replyToRequest(request.id, String(form.get("text") || ""), String(form.get("price") || ""));
                setNote("error" in result ? result.error : "Reply sent in the portal. No email was sent.");
                if (!("error" in result)) formEl.reset();
              }}>
                <textarea name="text" required rows={3} placeholder="Your quote" className="rounded-xl border px-3 py-2 text-sm" />
                <input name="price" placeholder="Price, optional" className="min-h-11 rounded-xl border px-3 text-sm" />
                <button type="submit" className="min-h-11 rounded-xl bg-[#1E2D3B] px-4 text-sm font-bold text-white">Reply in the portal</button>
              </form>
            ) : <p className="text-sm text-gray-600">The Anchor has first look. You can reply when that window ends.</p>}
          </article>
        ))}
      </section>

      <section className="space-y-2 rounded-2xl bg-white p-4">
        <h2 className="font-heading text-xl font-black">Demand</h2>
        <p className="text-xs text-gray-500">Counts under 10 are shown as &lt;10. No names or ids.</p>
        <p className="text-sm">Perk reveals: {data.demand.reveals.label}</p>
        <p className="text-sm">Active members in {data.country}: {data.demand.membersInCountry.label}</p>
        <DemandList title="Patient requests, last 90 days" rows={data.demand.leadsByPlace} />
        <DemandList title="Requests by category" rows={data.demand.rfpsByCategory} />
        <DemandList title="Redemptions by month" rows={data.demand.redemptionsByMonth} />
      </section>

      <section className="space-y-2 rounded-2xl bg-white p-4">
        <h2 className="font-heading text-xl font-black">Add-ons</h2>
        {ADDONS.map((addon) => (
          <button key={addon.key} type="button" className="flex min-h-11 w-full items-center justify-between rounded-xl bg-[#F5F3EF] px-3 text-left text-sm font-bold" onClick={async () => {
            const result = await startAddonCheckout(addon.key);
            if ("url" in result && result.url) window.location.href = result.url;
            if ("error" in result && result.error) setNote(result.error);
          }}>{addon.label}<span>{formatDollars(addon.cents)}</span></button>
        ))}
      </section>
    </div>
  );
}

function DemandList({ title, rows }: { title: string; rows: { key: string; label: string }[] }) {
  return (
    <div>
      <p className="mt-2 text-xs font-bold uppercase tracking-widest text-gray-400">{title}</p>
      {rows.length === 0 ? <p className="text-sm text-gray-500">None.</p> : null}
      <ul>
        {rows.map((row) => <li key={row.key} className="text-sm">{row.key}: {row.label}</li>)}
      </ul>
    </div>
  );
}

function PerkEditor({ onDone }: { onDone: (message: string) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [audience, setAudience] = useState<"doctor" | "student" | "both">("doctor");
  const [value, setValue] = useState("");
  const [active, setActive] = useState(true);
  const [pledged, setPledged] = useState(false);

  return (
    <form className="grid gap-3 rounded-2xl bg-white p-4" onSubmit={async (event) => {
      event.preventDefault();
      const result = await saveVendorPerk({
        title, description, code, redeemUrl: "", estValueDollars: Number(value || 0), audience, active, endsAt, pledged,
      });
      onDone("error" in result ? result.error : "Perk saved. The code stays off the public page.");
      if (!("error" in result)) {
        setTitle("");
        setDescription("");
        setCode("");
        setPledged(false);
      }
    }}>
      <h2 className="font-heading text-xl font-black">Member perk</h2>
      <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Title" className="min-h-11 rounded-xl border px-3" />
      <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="What the member gets" className="rounded-xl border px-3 py-2 text-sm" />
      <input value={code} onChange={(event) => setCode(event.target.value)} required placeholder="Code" className="min-h-11 rounded-xl border px-3 font-mono" />
      <input type="date" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="min-h-11 rounded-xl border px-3" />
      <input value={value} onChange={(event) => setValue(event.target.value)} inputMode="decimal" placeholder="Estimated value in dollars" className="min-h-11 rounded-xl border px-3" />
      <select value={audience} onChange={(event) => setAudience(event.target.value as "doctor" | "student" | "both")} className="min-h-11 rounded-xl border px-3">
        <option value="doctor">Doctors</option>
        <option value="student">Students</option>
        <option value="both">Doctors and students</option>
      </select>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Active</label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={pledged} onChange={(event) => setPledged(event.target.checked)} /> I reconfirm this is our best member price.</label>
      <button type="submit" className="min-h-11 rounded-xl bg-[#D66829] px-4 text-sm font-bold text-white">Save perk</button>
    </form>
  );
}
