'use client';

import { PATIENT_REQUESTS_HINT } from '@/lib/portal/stats';

export default function LeadsHeader({
  total,
  fresh,
  contacted,
  booked,
}: {
  total: number;
  fresh: number;
  contacted: number;
  booked: number;
}) {
  return (
    <p className="text-sm text-portal-ink-2 mb-4" title={PATIENT_REQUESTS_HINT} data-patient-requests={total}>
      This month: {total} patient requests · {fresh} new · {contacted} contacted · {booked} booked
    </p>
  );
}
