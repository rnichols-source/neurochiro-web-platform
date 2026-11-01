"use client";

import { useState } from "react";
import { SYNAPSE_CATEGORIES } from "@/lib/synapse/categories";
import { COUNTRY_LABELS, SYNAPSE_COUNTRIES, VETTING_CHECKS, formatDollars } from "@/lib/synapse/config";
import { getVettingQueue, saveVetting, approveSeat, setSeatStatus, createSeatCheckout, seatProof, type AddonOrderRow, type VettingSeat, type VettingVendor } from "./vetting-actions";

const TABS = ["applied", "in_review", "approved", "seats", "addons"] as const;

type Queue = { vendors: VettingVendor[]; seats: VettingSeat[]; orders: AddonOrderRow[]; schemaReady: boolean };

export default function AdminQueue({ initial }: { initial: Queue }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("applied");
  const [queue, setQueue] = useState<Queue>(initial);
  const [note, setNote] = useState<string | null>(null);

  async function load() {
    const data = await getVettingQueue();
    setQueue(data);
  }

  const shown = queue.vendors.filter((vendor) => {
    const status = vendor.vetting_status || "applied";
    if (tab === "applied") return status === "applied";
    if (tab === "in_review") return status === "in_review";
    if (tab === "approved") return status === "approved";
    return false;
  });

  return (
    <div className="space-y-4 p-4 md:p-8">
      <h1 className="font-heading text-2xl font-black text-[#1E2D3B]">Synapse vetting</h1>
      {!queue.schemaReady ? <p className="text-sm text-red-700">The Synapse tables are not in this database yet. Review the migration before approving seats.</p> : null}
      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={`min-h-11 rounded-xl px-3 text-sm font-bold ${tab === item ? "bg-[#1E2D3B] text-white" : "bg-white text-[#1E2D3B]"}`}>
            {item.replace("_", " ")}
          </button>
        ))}
      </div>
      {note ? <p className="text-sm text-[#1E2D3B]">{note}</p> : null}

      {tab === "seats" ? (
        <ul className="space-y-3">
          {queue.seats.map((seat) => (
            <li key={seat.id} className="rounded-2xl bg-white p-4">
              <p className="font-bold">{seat.category_key} · {seat.country} · {seat.tier}</p>
              <p className="text-sm text-gray-500">{seat.status} · {seat.fee_cents ? formatDollars(seat.fee_cents) : "fee pending"} · members {seat.member_count_snapshot ?? "—"}</p>
              <SeatTools seat={seat} onDone={async (message) => { setNote(message); await load(); }} />
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "addons" ? (
        <ul className="space-y-3">
          {queue.orders.map((order) => (
            <li key={order.id} className="rounded-2xl bg-white p-4 text-sm">
              <p className="font-bold">{order.addon_key}</p>
              <p>{order.status} · {order.amount_cents ? formatDollars(order.amount_cents) : ""}</p>
              <p className="text-gray-500">{order.scheduled_for ? `Scheduled ${order.scheduled_for}` : "Not scheduled"}</p>
            </li>
          ))}
          {queue.orders.length === 0 ? <p className="text-sm text-gray-500">No add-on orders yet.</p> : null}
        </ul>
      ) : null}

      {tab !== "seats" && tab !== "addons" ? (
        <ul className="space-y-4">
          {shown.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} onDone={async (message) => { setNote(message); await load(); }} />
          ))}
          {shown.length === 0 ? <p className="text-sm text-gray-500">Nothing in this tab.</p> : null}
        </ul>
      ) : null}
    </div>
  );
}

function VendorCard({ vendor, onDone }: { vendor: VettingVendor; onDone: (message: string) => void }) {
  const [checklist, setChecklist] = useState<Record<string, boolean>>(vendor.vetting_checklist || {});
  const [notes, setNotes] = useState(vendor.vetting_notes || "");
  const [tier, setTier] = useState<"anchor" | "ally">(vendor.tier === "ally" ? "ally" : "anchor");
  const [categoryKey, setCategoryKey] = useState(vendor.categories?.[0] || "software");
  const [country, setCountry] = useState(vendor.country || "US");
  const [founding, setFounding] = useState(false);

  return (
    <li className="space-y-3 rounded-2xl bg-white p-4">
      <div>
        <h2 className="font-bold text-[#1E2D3B]">{vendor.name}</h2>
        <p className="text-sm text-gray-500">{vendor.contact_email} · {vendor.website_url}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {VETTING_CHECKS.map((item) => (
          <label key={item.key} className="flex min-h-11 items-start gap-2 text-sm">
            <input type="checkbox" checked={Boolean(checklist[item.key])} onChange={(event) => setChecklist({ ...checklist, [item.key]: event.target.checked })} />
            {item.label}
          </label>
        ))}
      </div>
      <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Notes" />
      <div className="flex flex-wrap gap-2">
        {["applied", "in_review", "approved", "rejected"].map((status) => (
          <button key={status} type="button" className="min-h-11 rounded-xl bg-gray-100 px-3 text-sm font-bold" onClick={async () => {
            const result = await saveVetting(vendor.id, { status, checklist, notes });
            onDone(result.error || `Saved as ${status}.`);
          }}>{status.replace("_", " ")}</button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <select value={tier} onChange={(event) => setTier(event.target.value as "anchor" | "ally")} className="min-h-11 rounded-xl border px-3">
          <option value="anchor">Anchor</option>
          <option value="ally">Ally</option>
        </select>
        <select value={categoryKey} onChange={(event) => setCategoryKey(event.target.value)} className="min-h-11 rounded-xl border px-3">
          {SYNAPSE_CATEGORIES.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
        </select>
        <select value={country} onChange={(event) => setCountry(event.target.value)} className="min-h-11 rounded-xl border px-3">
          {SYNAPSE_COUNTRIES.map((code) => <option key={code} value={code}>{COUNTRY_LABELS[code]}</option>)}
        </select>
        <label className="flex min-h-11 items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={founding} onChange={(event) => setFounding(event.target.checked)} /> Founding year 1
        </label>
      </div>
      <button type="button" className="min-h-11 rounded-xl bg-[#D66829] px-4 text-sm font-bold text-white" onClick={async () => {
        const result = await approveSeat({ vendorId: vendor.id, tier, categoryKey, country, founding });
        if (result.url) {
          await navigator.clipboard.writeText(result.url);
          onDone(`Checkout link copied. Fee ${result.feeCents ? formatDollars(result.feeCents) : ""}.`);
        } else {
          onDone(result.error || "Seat reserved.");
        }
      }}>Approve and copy checkout link</button>
    </li>
  );
}

function SeatTools({ seat, onDone }: { seat: VettingSeat; onDone: (message: string) => void }) {
  const [proof, setProof] = useState<string>("");
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" className="min-h-11 rounded-xl bg-gray-100 px-3 text-sm font-bold" onClick={async () => {
        const result = await seatProof(seat.vendor_id);
        setProof(`Proof ${result.proof.score ?? "n/a"} (${result.proof.flag}). Pledge ${result.pledgedAt || "none"}.`);
      }}>Proof score</button>
      {proof ? <p className="w-full text-sm">{proof}</p> : null}
      {(["at_risk", "review", "revoked", "lapsed", "active"] as const).map((status) => (
        <button key={status} type="button" className="min-h-11 rounded-xl bg-gray-100 px-3 text-sm font-bold" onClick={async () => {
          const result = await setSeatStatus(seat.id, status);
          onDone(result.error || `Marked ${status}.`);
        }}>{status}</button>
      ))}
      <button type="button" className="min-h-11 rounded-xl bg-[#1E2D3B] px-3 text-sm font-bold text-white" onClick={async () => {
        const result = await createSeatCheckout(seat.id);
        if (result.url) {
          await navigator.clipboard.writeText(result.url);
          onDone("Checkout link copied.");
        } else onDone(result.error || "No link.");
      }}>Copy checkout link</button>
    </div>
  );
}
