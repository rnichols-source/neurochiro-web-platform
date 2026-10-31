'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  acceptPatientReferral,
  addReferralFiles,
  cancelPatientReferral,
  contactedPatientReferral,
  declinePatientReferral,
  scheduledPatientReferral,
  signedAttachmentUrl,
} from '../actions';
import { ReferButton } from '@/components/portal/ReferralProvider';

export default function ReferralActions({
  id,
  status,
  mine,
  v2,
  otherName,
}: {
  id: string;
  status: string;
  mine: boolean;
  v2: boolean;
  otherName: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [fileId, setFileId] = useState('');

  async function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setError('');
    const result = await action();
    if (!result.success) {
      setError(result.error || 'Could not update this referral.');
      return;
    }
    router.refresh();
  }

  const open = status === 'pending' || status === 'sent' || status === 'viewed';

  return (
    <div className="space-y-3">
      {!mine && open ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="min-h-11 px-4 rounded-lg bg-portal-accent text-white text-sm font-bold" onClick={() => run(() => acceptPatientReferral(id))}>Accept</button>
          <button type="button" className="min-h-11 px-4 rounded-lg border border-portal-border bg-white text-sm font-bold" onClick={() => run(() => declinePatientReferral(id, reason))}>Decline</button>
          <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason (optional)" aria-label="Decline reason" className="min-h-11 px-3 rounded-lg border border-portal-border text-base" />
        </div>
      ) : null}
      {!mine && v2 && (status === 'accepted' || status === 'patient_contacted') ? (
        <div className="flex flex-wrap gap-2">
          {status === 'accepted' ? (
            <button type="button" className="min-h-11 px-4 rounded-lg bg-portal-accent text-white text-sm font-bold" onClick={() => run(() => contactedPatientReferral(id))}>I called them</button>
          ) : null}
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Booked date" className="min-h-11 px-3 rounded-lg border border-portal-border text-base" />
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Thank-you note (optional)" aria-label="Thank-you note" className="min-h-11 px-3 rounded-lg border border-portal-border text-base" />
          <button type="button" className="min-h-11 px-4 rounded-lg bg-portal-accent text-white text-sm font-bold" onClick={() => run(() => scheduledPatientReferral(id, date || null, note))}>Booked</button>
        </div>
      ) : null}
      {mine && (status === 'declined' || status === 'expired') ? (
        <ReferButton label="Refer to someone else" />
      ) : null}
      {mine && v2 && open ? (
        <button type="button" className="min-h-11 px-4 rounded-lg border border-portal-border bg-white text-sm font-bold" onClick={() => run(() => cancelPatientReferral(id))}>Cancel</button>
      ) : null}
      {mine && v2 ? (
        <form action={async (formData) => {
          const result = await addReferralFiles(id, formData);
          setError(result.success ? '' : result.error || 'Could not add that file.');
          if (result.success) router.refresh();
        }} className="flex flex-wrap gap-2 items-center">
          <input type="file" name="files" accept="application/pdf,image/jpeg,image/png,image/heic,image/heif" multiple aria-label="Referral files" className="text-base" />
          <button type="submit" className="min-h-11 px-4 rounded-lg border border-portal-border bg-white text-sm font-bold">Add files</button>
        </form>
      ) : null}
      <form className="flex gap-2" onSubmit={async (event) => {
        event.preventDefault();
        const url = await signedAttachmentUrl(fileId.trim());
        if (!url) {
          setError('That file is not available yet.');
          return;
        }
        window.open(url, '_blank', 'noopener');
      }}>
        <input value={fileId} onChange={(event) => setFileId(event.target.value)} placeholder="File id" aria-label="File id" className="min-h-11 px-3 rounded-lg border border-portal-border text-base" />
        <button type="submit" className="min-h-11 px-4 rounded-lg border border-portal-border bg-white text-sm font-bold">Open file</button>
      </form>
      {error ? <p className="text-sm text-portal-danger">{error}</p> : null}
      <p className="text-xs text-portal-muted">Updates go to {otherName}.</p>
    </div>
  );
}
