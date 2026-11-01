"use client";

import { useState } from "react";
import PartnerDisclosure from "@/components/synapse/PartnerDisclosure";
import { formatDollars } from "@/lib/synapse/config";
import { revealStudentPerk } from "./student-perk-actions";

export type StudentPerk = {
  id: string
  vendorName: string
  title: string
  description: string | null
  estValueCents: number | null
  tier: "anchor" | "ally"
};

export default function StudentPerkList({ perks }: { perks: StudentPerk[] }) {
  return (
    <section className="mb-6 space-y-3 px-4 pt-4">
      <h2 className="font-heading text-xl font-black text-[#1E2D3B]">Student perks</h2>
      {perks.map((perk) => <StudentPerkCard key={perk.id} perk={perk} />)}
    </section>
  );
}

function StudentPerkCard({ perk }: { perk: StudentPerk }) {
  const [code, setCode] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  return (
    <article className="space-y-2 rounded-2xl bg-white p-4">
      <p className="font-bold text-[#1E2D3B]">{perk.vendorName}</p>
      <p>{perk.title}</p>
      {perk.description ? <p className="text-sm text-gray-600">{perk.description}</p> : null}
      {perk.estValueCents ? <p className="text-sm text-gray-500">About {formatDollars(perk.estValueCents)}</p> : null}
      <PartnerDisclosure kind={perk.tier} />
      <button type="button" className="min-h-11 rounded-xl bg-[#1E2D3B] px-4 text-sm font-bold text-white" onClick={async () => {
        const result = await revealStudentPerk(perk.id);
        if ("code" in result) setCode(result.code);
        else setNote(result.error);
      }}>Reveal code</button>
      {code ? <p className="rounded-xl bg-[#F5F3EF] p-3 font-mono text-sm">{code}</p> : null}
      {note ? <p className="text-sm text-gray-600">{note}</p> : null}
    </article>
  );
}
