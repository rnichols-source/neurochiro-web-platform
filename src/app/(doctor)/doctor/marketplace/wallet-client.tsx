"use client";

import { useState } from "react";
import { SYNAPSE_CATEGORIES } from "@/lib/synapse/categories";
import { COUNTRY_LABELS, SYNAPSE_COUNTRIES, formatDollars } from "@/lib/synapse/config";
import PartnerDisclosure from "@/components/synapse/PartnerDisclosure";
import { submitRFP } from "@/app/(public)/marketplace/request/actions";
import { loadWallet, rateVendor, redeemPerk, revealPerkCode, type WalletData, type WalletPerk } from "./actions";

const BUDGETS = ["Under $5K", "$5K–$15K", "$15K–$50K", "$50K+", "Not sure"];
const TIMELINES = ["ASAP", "1–3 months", "3–6 months", "Flexible"];

export default function SynapseWallet({ initial }: { initial: WalletData }) {
  const [wallet, setWallet] = useState(initial);
  const [note, setNote] = useState<string | null>(null);

  async function refresh() {
    const next = await loadWallet();
    if (!("error" in next)) setWallet(next);
  }

  const groups = new Map<string, WalletPerk[]>();
  for (const perk of wallet.perks) {
    const list = groups.get(perk.categoryLabel) || [];
    list.push(perk);
    groups.set(perk.categoryLabel, list);
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D66829]">NeuroChiro Synapse</p>
        <h1 className="font-heading text-3xl font-black text-[#1E2D3B]">Synapse</h1>
        <p className="mt-1 text-sm text-gray-600">Member deals for {COUNTRY_LABELS[wallet.country]}.</p>
      </header>

      <section className="rounded-2xl bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Saved this year</p>
        <p className="mt-1 text-2xl font-black text-[#1E2D3B]">{formatDollars(wallet.savedCents)}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-2 rounded-full bg-[#D66829]" style={{ width: `${Math.round(wallet.ratio * 100)}%` }} />
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {wallet.reached ? "Your membership has paid for itself." : `${formatDollars(wallet.savedCents)} of ${formatDollars(wallet.goalCents)} toward your membership.`}
        </p>
      </section>

      {note ? <p className="text-sm text-[#1E2D3B]">{note}</p> : null}

      {!wallet.schemaReady || wallet.perks.length === 0 ? (
        <section className="rounded-2xl bg-white p-6">
          <h2 className="font-heading text-xl font-black text-[#1E2D3B]">Founding partners are being selected. Tell us what you want deals on.</h2>
          <a href="#request" className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-[#D66829]">Open the request form</a>
        </section>
      ) : (
        [...groups.entries()].map(([label, perks]) => (
          <section key={label} className="space-y-3">
            <h2 className="font-heading text-lg font-black text-[#1E2D3B]">{label}</h2>
            {perks.map((perk) => (
              <PerkCard key={perk.id} perk={perk} onNote={setNote} onRefresh={refresh} />
            ))}
          </section>
        ))
      )}

      <section id="request" className="space-y-3 rounded-2xl bg-white p-4">
        <h2 className="font-heading text-lg font-black text-[#1E2D3B]">Tell us what you want deals on</h2>
        <RequestForm country={wallet.country} onDone={async (message) => { setNote(message); await refresh(); }} />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-black text-[#1E2D3B]">Your requests</h2>
        {wallet.requests.length === 0 ? <p className="text-sm text-gray-500">No requests yet.</p> : null}
        {wallet.requests.map((request) => (
          <article key={request.id} className="rounded-2xl bg-white p-4">
            <p className="font-bold text-[#1E2D3B]">{request.category}</p>
            <p className="mt-1 text-sm text-gray-600">{request.description}</p>
            <p className="mt-2 text-xs text-gray-400">{request.budget} · {request.timeline} · {request.country}</p>
            {request.firstLookUntil ? <p className="mt-1 text-xs text-gray-500">Anchor first look until {new Date(request.firstLookUntil).toLocaleString()}</p> : null}
            <ul className="mt-3 space-y-2">
              {request.responses.map((response) => (
                <li key={response.id} className="rounded-xl bg-[#F5F3EF] p-3 text-sm">
                  <p className="font-bold">{response.vendorName}</p>
                  <p>{response.text}</p>
                  {response.price ? <p className="text-gray-500">{response.price}</p> : null}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}

function PerkCard({ perk, onNote, onRefresh }: { perk: WalletPerk; onNote: (message: string) => void; onRefresh: () => Promise<void> }) {
  const [code, setCode] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [ratingNote, setRatingNote] = useState("");
  const kind = perk.tier === "ally" ? "ally" : "anchor";

  return (
    <article className="space-y-3 rounded-2xl bg-white p-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#D66829]">{perk.tier === "anchor" ? "Anchor" : "Ally"}</p>
        <h3 className="font-heading text-lg font-black text-[#1E2D3B]">{perk.vendorName}</h3>
        <p className="font-bold">{perk.title}</p>
        {perk.description ? <p className="mt-1 text-sm text-gray-600">{perk.description}</p> : null}
        {perk.estValueCents ? <p className="mt-1 text-sm text-gray-500">About {formatDollars(perk.estValueCents)} in value</p> : null}
      </div>
      <PartnerDisclosure kind={kind} />
      <button type="button" className="min-h-11 rounded-xl bg-[#1E2D3B] px-4 text-sm font-bold text-white" onClick={async () => {
        const result = await revealPerkCode(perk.id);
        if ("code" in result) {
          setCode(result.code);
          onNote("Code revealed for this session. It is not on the public page.");
          await onRefresh();
        } else onNote(result.error);
      }}>Reveal code</button>
      {code ? <p className="rounded-xl bg-[#F5F3EF] p-3 font-mono text-sm">{code}</p> : <p className="text-sm text-gray-500">Members unlock this perk in the portal.</p>}
      {perk.redeemUrl && code ? <a href={perk.redeemUrl} className="inline-flex min-h-11 items-center text-sm font-bold text-[#D66829]" target="_blank" rel="noopener noreferrer">Open the partner checkout</a> : null}
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={async (event) => {
        event.preventDefault();
        const dollars = Number(amount);
        const cents = Number.isFinite(dollars) ? Math.round(dollars * 100) : -1;
        const result = await redeemPerk(perk.id, cents);
        onNote("error" in result ? result.error : "Recorded. Your saved-this-year total includes it.");
        if (!("error" in result)) {
          setAmount("");
          await onRefresh();
        }
      }}>
        <label className="flex min-h-11 flex-1 items-center gap-2 text-sm">
          I used this. Saved $
          <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" className="min-h-11 w-24 rounded-xl border px-2" />
        </label>
        <button type="submit" className="min-h-11 rounded-xl bg-gray-100 px-4 text-sm font-bold">Save</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button key={score} type="button" className={`min-h-11 min-w-11 rounded-xl text-sm font-bold ${perk.rating === score ? "bg-[#D66829] text-white" : "bg-gray-100"}`} onClick={async () => {
            const result = await rateVendor(perk.vendorId, score, ratingNote);
            onNote("error" in result ? result.error : `Rated ${perk.vendorName} ${score}.`);
            if (!("error" in result)) await onRefresh();
          }}>{score}</button>
        ))}
      </div>
      <input value={ratingNote} onChange={(event) => setRatingNote(event.target.value)} placeholder="Optional note" className="min-h-11 w-full rounded-xl border px-3 text-sm" />
    </article>
  );
}

function RequestForm({ country, onDone }: { country: string; onDone: (message: string) => void }) {
  const [category, setCategory] = useState("software");
  const [pickedCountry, setPickedCountry] = useState(country);
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState(BUDGETS[0]);
  const [timeline, setTimeline] = useState(TIMELINES[0]);

  return (
    <form className="grid gap-3" onSubmit={async (event) => {
      event.preventDefault();
      const result = await submitRFP({ category, description, budget, timeline, country: pickedCountry });
      if (result.error) onDone(result.error);
      else {
        setDescription("");
        onDone(result.firstLook ? "Request sent. The Anchor has 48 hours of first look." : "Request sent.");
      }
    }}>
      <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 rounded-xl border px-3">
        {SYNAPSE_CATEGORIES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
      </select>
      <select value={pickedCountry} onChange={(event) => setPickedCountry(event.target.value)} className="min-h-11 rounded-xl border px-3">
        {SYNAPSE_COUNTRIES.map((code) => <option key={code} value={code}>{COUNTRY_LABELS[code]}</option>)}
      </select>
      <textarea value={description} onChange={(event) => setDescription(event.target.value)} required rows={4} placeholder="What should a partner quote?" className="rounded-xl border px-3 py-2 text-sm" />
      <div className="grid gap-3 sm:grid-cols-2">
        <select value={budget} onChange={(event) => setBudget(event.target.value)} className="min-h-11 rounded-xl border px-3">{BUDGETS.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={timeline} onChange={(event) => setTimeline(event.target.value)} className="min-h-11 rounded-xl border px-3">{TIMELINES.map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <button type="submit" className="min-h-11 rounded-xl bg-[#D66829] px-4 text-sm font-bold text-white">Send request</button>
    </form>
  );
}
