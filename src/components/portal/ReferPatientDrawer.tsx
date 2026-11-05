'use client';

import { useEffect, useState } from 'react';
import { usePortal } from '@/components/portal/PortalProvider';
import { getCountryByIso2, getCountryDropdownOptions } from '@/config/countries';
import {
  referralDoctor,
  referralDoctorForUser,
  referralShortcuts,
  searchReferralDoctors,
  sendPatientReferral,
  starReferralDoctor,
} from '@/app/(doctor)/doctor/referrals/actions';
import { formatDistance, referralCountry } from '@/lib/referrals/pure';
import type { ReferableDoctor } from '@/lib/referrals/search';

type Choice = { city: string; state: string; lat: number; lng: number };

function doctorTitle(doctor: ReferableDoctor) {
  return `Dr. ${doctor.firstName} ${doctor.lastName}`.trim();
}

export default function ReferPatientDrawer({
  initialDoctorId,
  initialUserId,
  onClose,
}: {
  initialDoctorId?: string;
  initialUserId?: string;
  onClose: () => void;
}) {
  const portal = usePortal();
  const homeCountry = referralCountry(portal.doctor?.country || 'US');
  const homeState = portal.doctor?.state || '';
  const [country, setCountry] = useState(homeCountry);
  const [step, setStep] = useState<1 | 2>(initialDoctorId || initialUserId ? 2 : 1);
  const [query, setQuery] = useState('');
  const [choices, setChoices] = useState<Choice[] | null>(null);
  const [doctors, setDoctors] = useState<ReferableDoctor[]>([]);
  const [recent, setRecent] = useState<ReferableDoctor[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<ReferableDoctor | null>(null);
  const [acceptingOnly, setAcceptingOnly] = useState(false);
  const [searched, setSearched] = useState(false);
  const [note, setNote] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [hints, setHints] = useState<{ city: string; state: string; count: number }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentName, setSentName] = useState('');
  const [form, setForm] = useState({
    first: '',
    initial: '',
    phone: '',
    email: '',
    zip: '',
    reason: '',
    urgency: 'routine' as 'routine' | 'urgent',
    consent: false,
  });

  useEffect(() => {
    let cancelled = false;
    referralShortcuts().then((data) => {
      if (cancelled) return;
      setRecent(data.recent);
      setFavoriteIds(data.favoriteIds);
    }).catch(() => {});
    if (initialDoctorId) {
      referralDoctor(initialDoctorId).then((doctor) => {
        if (!cancelled && doctor) setSelected(doctor);
      }).catch(() => {});
    } else if (initialUserId) {
      referralDoctorForUser(initialUserId).then((doctor) => {
        if (!cancelled && doctor) setSelected(doctor);
      }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [initialDoctorId, initialUserId]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const handle = setTimeout(() => {
      fetch(`/api/directory/autocomplete?q=${encodeURIComponent(trimmed)}&type=all&country=${encodeURIComponent(country)}`)
        .then((res) => res.json())
        .then((data) => {
          const cities = Array.isArray(data?.cities) ? data.cities : [];
          const sorted = [...cities].sort((a, b) => {
            const aHome = a.state === homeState ? 0 : 1;
            const bHome = b.state === homeState ? 0 : 1;
            return aHome - bHome || (b.count || 0) - (a.count || 0);
          });
          setHints(sorted.slice(0, 6));
        })
        .catch(() => setHints([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query, country, homeState]);

  const visibleHints = query.trim().length < 2 ? [] : hints;

  async function runSearch(nextQuery: string, place?: Choice | null) {
    setBusy(true);
    setError('');
    const result = await searchReferralDoctors({
      query: nextQuery,
      country,
      specialty: specialty.trim() || null,
      acceptingOnly,
      place: place || null,
    });
    setBusy(false);
    setSearched(true);
    if (!result) {
      setError('Sign in to search.');
      setNote('');
      return;
    }
    setChoices(result.choices);
    setDoctors(result.doctors);
    setNote(result.note || '');
    if (!result.doctors.length && !result.choices?.length && result.label) setNote(result.note || result.label);
  }

  async function star(id: string) {
    const result = await starReferralDoctor(id);
    if (result.unavailable) return;
    setFavoriteIds((ids) => result.favorited ? [...ids, id] : ids.filter((item) => item !== id));
  }

  function pick(doctor: ReferableDoctor) {
    setSelected(doctor);
    setStep(2);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError('');
    const result = await sendPatientReferral({
      receivingDoctorId: selected.id,
      patientFirstName: form.first,
      patientLastInitial: form.initial,
      patientPhone: form.phone,
      patientEmail: form.email,
      patientZip: form.zip,
      reason: form.reason,
      urgency: form.urgency,
      consentConfirmed: form.consent,
    });
    setBusy(false);
    if (!result.success || !result.referralId) {
      setError(result.error || 'Could not send.');
      setSentName('');
      return;
    }
    setSentName(result.message || `Sent to ${result.receiverName || doctorTitle(selected)}.`);
  }

  const receiver = selected ? doctorTitle(selected) : 'the doctor';
  const patient = form.first.trim() || 'The patient';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close referral" title="Close" onClick={onClose} />
      <aside className="relative h-full w-full md:max-w-md bg-portal-canvas shadow-xl overflow-y-auto p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-portal-ink">Refer a patient</h2>
          <button type="button" onClick={onClose} className="min-h-11 min-w-11 text-sm font-bold text-portal-ink" aria-label="Close" title="Close">Close</button>
        </div>
        {sentName ? (
          <div className="bg-white border border-portal-border rounded-xl p-4">
            <p className="text-[15px] leading-6 text-portal-ink">{sentName}</p>
            <button
              type="button"
              className="mt-4 min-h-11 px-4 rounded-lg bg-portal-accent text-white text-sm font-bold"
              onClick={() => {
                setSentName('');
                setSelected(null);
                setStep(1);
                setForm({ first: '', initial: '', phone: '', email: '', zip: '', reason: '', urgency: 'routine', consent: false });
              }}
            >
              Refer another
            </button>
          </div>
        ) : step === 1 ? (
          <div className="space-y-4">
            <label className="block text-sm font-bold text-portal-ink" htmlFor="referral-country">Country</label>
            <select
              id="referral-country"
              value={country}
              onChange={(event) => setCountry(referralCountry(event.target.value))}
              className="w-full min-h-11 px-3 rounded-lg border border-portal-border text-base bg-white"
            >
              <option value="ALL">All countries</option>
              {getCountryDropdownOptions().map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <label className="block text-sm font-bold text-portal-ink" htmlFor="referral-search">Name, city, or postal code</label>
            <input
              id="referral-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full min-h-11 px-3 rounded-lg border border-portal-border text-base bg-white"
              placeholder={country === 'IN' ? 'Mumbai, 110001, or a doctor\'s name' : 'City, postal code, or a doctor\'s name'}
            />
            {visibleHints.length > 0 ? (
              <ul className="bg-white border border-portal-border rounded-lg">
                {visibleHints.map((hint) => (
                  <li key={`${hint.city}-${hint.state}`}>
                    <button
                      type="button"
                      className="w-full min-h-11 px-3 text-left text-sm"
                      onClick={() => {
                        const label = hint.city ? `${hint.city}, ${hint.state}` : hint.state;
                        setQuery(label);
                        setHints([]);
                        runSearch(label);
                      }}
                    >
                      {hint.city ? `${hint.city}, ${hint.state}` : hint.state}
                      {hint.count ? ` · ${hint.count}` : ''}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <label className="min-h-11 inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={acceptingOnly} onChange={(event) => setAcceptingOnly(event.target.checked)} />
                Accepting patients
              </label>
              <input
                value={specialty}
                onChange={(event) => setSpecialty(event.target.value)}
                placeholder="Specialty or technique"
                aria-label="Specialty or technique"
                className="min-h-11 px-3 rounded-lg border border-portal-border text-base bg-white"
              />
            </div>
            <p className="text-sm text-portal-ink-2">Based on the doctor&apos;s listed specialties.</p>
            <button type="button" onClick={() => runSearch(query)} className="min-h-11 px-4 rounded-lg bg-portal-accent text-white text-sm font-bold" disabled={busy}>
              {busy ? 'Searching' : 'Search'}
            </button>
            {choices && choices.length > 0 ? (
              <div>
                <p className="text-sm font-bold text-portal-ink mb-2">Pick a place</p>
                <ul className="space-y-2">
                  {choices.map((choice) => (
                    <li key={`${choice.city}-${choice.state}`}>
                      <button type="button" className="min-h-11 w-full text-left px-3 rounded-lg bg-white border border-portal-border text-sm font-bold" onClick={() => runSearch(`${choice.city}, ${choice.state}`, choice)}>
                        {choice.city}, {choice.state}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {recent.length > 0 ? (
              <ChipRow title="Recent" doctors={recent} onPick={pick} />
            ) : null}
            {error ? <p className="text-sm text-portal-danger">{error}</p> : null}
            {searched && !busy && doctors.length === 0 && !choices?.length ? (
              <p className="text-sm text-portal-ink-2">{note || 'No active member matches. Inactive and unapproved doctors are hidden.'}</p>
            ) : null}
            <ul className="space-y-2">
              {doctors.map((doctor) => (
                <li key={doctor.id} className="bg-white border border-portal-border rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-portal-ink">{doctorTitle(doctor)}</p>
                      <p className="text-xs text-portal-muted">
                        {[doctor.clinicName, doctor.city, doctor.state, extraCountry(doctor.country, country)].filter(Boolean).join(' · ')}
                        {doctor.distanceMiles != null ? ` · ${formatDistance(doctor.distanceMiles, country)}` : ''}
                      </p>
                    </div>
                    <button type="button" className="min-h-11 min-w-11 text-sm font-bold" aria-label={favoriteIds.includes(doctor.id) ? 'Remove favorite' : 'Save favorite'} title="Favorite" onClick={() => star(doctor.id)}>
                      {favoriteIds.includes(doctor.id) ? 'Saved' : 'Save'}
                    </button>
                  </div>
                  <button type="button" onClick={() => pick(doctor)} className="mt-2 min-h-11 px-3 rounded-lg bg-portal-accent text-white text-sm font-bold">
                    Refer to {doctorTitle(doctor)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-sm text-portal-ink-2">{selected ? `Sending to ${doctorTitle(selected)}` : 'Choose a doctor'}</p>
            {selected?.unavailableReason ? <p className="text-sm text-portal-danger">{selected.unavailableReason}</p> : null}
            {!selected ? (
              <button type="button" className="min-h-11 text-sm font-bold" onClick={() => setStep(1)}>Pick a doctor</button>
            ) : (
              <button type="button" className="min-h-11 text-sm font-bold text-portal-accent" onClick={() => setStep(1)}>Change doctor</button>
            )}
            <Field label="First name" value={form.first} onChange={(first) => setForm({ ...form, first })} required />
            <Field label="Last initial" value={form.initial} onChange={(initial) => setForm({ ...form, initial: initial.slice(0, 1) })} required />
            <Field label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} required />
            <Field label="Email (optional)" value={form.email} onChange={(email) => setForm({ ...form, email })} />
            <Field label={`${postalLabel(country)} (optional)`} value={form.zip} onChange={(zip) => setForm({ ...form, zip })} />
            <label className="block text-sm font-bold text-portal-ink">
              Why you are referring
              <textarea
                required
                value={form.reason}
                onChange={(event) => setForm({ ...form, reason: event.target.value })}
                maxLength={2000}
                className="mt-1 w-full min-h-24 p-3 rounded-lg border border-portal-border text-base"
              />
            </label>
            <p className="text-xs text-portal-muted">Do not include diagnoses or other health details. Share those after they accept.</p>
            <label className="block text-sm font-bold text-portal-ink">
              Urgency
              <select
                value={form.urgency}
                onChange={(event) => setForm({ ...form, urgency: event.target.value === 'urgent' ? 'urgent' : 'routine' })}
                className="mt-1 w-full min-h-11 px-3 rounded-lg border border-portal-border text-base bg-white"
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label className="flex items-start gap-2 text-sm text-portal-ink">
              <input type="checkbox" checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} className="mt-1" />
              <span>{patient} agreed to have their name and phone shared with {receiver}.</span>
            </label>
            <p className="text-xs text-portal-muted">
              {receiver} gets an email right away. You will get an update when they accept, and again when {patient} is scheduled. {patient}&apos;s phone is shared only after {receiver} accepts.
            </p>
            {error ? <p className="text-sm text-portal-danger">{error}</p> : null}
            <button type="submit" disabled={busy || !selected || Boolean(selected?.unavailableReason)} className="min-h-11 w-full px-4 rounded-lg bg-portal-accent text-white text-sm font-bold disabled:opacity-50">
              {busy ? 'Sending' : 'Send referral'}
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}

function ChipRow({ title, doctors, onPick }: { title: string; doctors: ReferableDoctor[]; onPick: (doctor: ReferableDoctor) => void }) {
  return (
    <div>
      <p className="text-sm font-bold text-portal-ink mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {doctors.map((doctor) => (
          <button key={doctor.id} type="button" onClick={() => onPick(doctor)} className="min-h-11 px-3 rounded-lg bg-white border border-portal-border text-sm font-bold">
            {doctorTitle(doctor)}
          </button>
        ))}
      </div>
    </div>
  );
}

function extraCountry(code: string | null, searchCountry: string): string {
  if (!code) return '';
  if (referralCountry(searchCountry) !== 'ALL' && referralCountry(code) === referralCountry(searchCountry)) return '';
  return getCountryByIso2(referralCountry(code))?.name || '';
}

function postalLabel(country: string): string {
  return getCountryByIso2(referralCountry(country))?.postalLabel || 'Postal code';
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="block text-sm font-bold text-portal-ink">
      {label}
      <input
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={label === 'Phone' ? 'tel' : undefined}
        autoComplete={label === 'Phone' ? 'tel' : label.startsWith('Email') ? 'email' : undefined}
        className="mt-1 w-full min-h-11 px-3 rounded-lg border border-portal-border text-base bg-white"
      />
    </label>
  );
}
