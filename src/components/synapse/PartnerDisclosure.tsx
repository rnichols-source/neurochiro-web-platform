import { disclosureText, type DisclosureKind } from '@/lib/synapse/disclosure'

export default function PartnerDisclosure({ kind }: { kind: DisclosureKind }) {
  return (
    <p className="text-xs leading-snug text-gray-500" data-disclosure={kind}>
      {disclosureText(kind)}
    </p>
  )
}
