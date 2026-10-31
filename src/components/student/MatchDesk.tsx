'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/portal/PageHeader';
import {
  CARE_EXPLAIN,
  CARE_PACE,
  COMP_MODEL,
  EMPTY_ANSWERS,
  LOOKING,
  MATCH_STEPS,
  OUTCOMES,
  PATIENT_FOCUS,
  PRACTICE_MODEL,
  PRACTICE_SIZE,
  START_WINDOW,
  TECHNIQUE_OPTIONS,
  US_STATES,
  type MatchAnswers,
  type Option,
} from '@/config/match-questions';
import { decideMatch, moreMatches, reportMatchOutcome, saveMatchProfile, setMatchOpen, suggestMatchCall } from '@/lib/match/actions';
import type { MatchDeskData } from '@/lib/match/view';

const TIP = "How closely your answers line up. It's a starting point, not a verdict.";

export default function MatchDesk({ initial }: { initial: MatchDeskData }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<MatchAnswers>(initial.answers || EMPTY_ANSWERS);
  const [visible, setVisible] = useState(initial.visible);
  const [open, setOpen] = useState(initial.openToStudents);
  const [tab, setTab] = useState<'cards' | 'matches' | 'settings'>(initial.complete ? 'cards' : 'cards');
  const [cards, setCards] = useState(initial.candidates);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [showProfile, setShowProfile] = useState(!initial.complete);
  const startX = useRef<number | null>(null);

  const card = cards[index];
  const locked = !initial.ready || initial.notice === 'This is part of Pro.';

  async function save(next = answers, shown = visible) {
    setBusy(true);
    setError('');
    const result = await saveMatchProfile(next, shown);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return false;
    }
    if (result.complete) window.location.reload();
    return true;
  }

  function toggle(list: string[], key: string, max = 8) {
    if (list.includes(key)) return list.filter((item) => item !== key);
    if (list.length >= max) return list;
    return [...list, key];
  }

  async function useQuiz() {
    const { suggestTechniqueKeys } = await import('./quiz-suggest');
    const keys = suggestTechniqueKeys();
    if (!keys.length) {
      setError('Finish the technique quiz first, then come back.');
      return;
    }
    setAnswers((current) => ({ ...current, technique: keys }));
    setError('');
  }

  async function choose(decision: 'interested' | 'not_now') {
    if (!card || busy) return;
    setBusy(true);
    setError('');
    const result = await decideMatch(card.userId, decision);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.matched) {
      setNote('You both said yes. Open Matches to message.');
      setTab('matches');
      window.location.reload();
      return;
    }
    const next = index + 1;
    if (next >= cards.length && cursor) {
      const more = await moreMatches(cursor);
      setCards(more.candidates);
      setCursor(more.nextCursor);
      setIndex(0);
      return;
    }
    setIndex(next);
  }

  const lookingKey = initial.side === 'doctor' ? 'offers' : 'looking_for';

  return (
    <div>
      <PageHeader title="ChiroMatch" description="You and a practice both say yes before anyone is introduced." />
      {initial.notice ? <p className="mb-4 text-base text-portal-ink">{initial.notice}</p> : null}
      {error ? <p className="mb-4 text-base text-portal-ink">{error}</p> : null}
      {note ? <p className="mb-4 text-base text-portal-ink">{note}</p> : null}
      {initial.complete && !locked ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {(['cards', 'matches', 'settings'] as const).map((item) => (
            <button key={item} type="button" onClick={() => { setTab(item); setShowProfile(false); }} className={`min-h-11 rounded-lg px-4 text-sm font-bold ${tab === item && !showProfile ? 'bg-portal-accent text-white' : 'border border-portal-border bg-white text-portal-ink'}`}>
              {item === 'cards' ? 'Cards' : item === 'matches' ? 'Matches' : 'Settings'}
            </button>
          ))}
          <button type="button" onClick={() => setShowProfile(true)} className="min-h-11 rounded-lg border border-portal-border bg-white px-4 text-sm font-bold text-portal-ink">Edit answers</button>
        </div>
      ) : null}

      {!locked && (showProfile || !initial.complete) ? (
        <section className="rounded-xl border border-portal-border bg-white p-4">
          <p className="text-sm font-bold text-portal-ink">{step + 1} of {MATCH_STEPS.length}</p>
          <h2 className="mt-2 text-xl font-bold text-portal-ink">{stepTitle(MATCH_STEPS[step], initial.side)}</h2>
          <div className="mt-4 space-y-2">
            {MATCH_STEPS[step] === 'technique' ? (
              <>
                {initial.side === 'student' ? <button type="button" onClick={useQuiz} className="min-h-11 rounded-lg border border-portal-border px-4 text-sm font-bold text-portal-ink">Use my quiz result</button> : null}
                <OptionList options={TECHNIQUE_OPTIONS} selected={answers.technique} onToggle={(key) => setAnswers({ ...answers, technique: toggle(answers.technique, key, 3) })} />
              </>
            ) : null}
            {MATCH_STEPS[step] === 'patient_focus' ? <OptionList options={PATIENT_FOCUS} selected={answers.patient_focus} onToggle={(key) => setAnswers({ ...answers, patient_focus: toggle(answers.patient_focus, key) })} /> : null}
            {MATCH_STEPS[step] === 'practice_model' ? <OptionList options={PRACTICE_MODEL} selected={answers.practice_model ? [answers.practice_model] : []} onToggle={(key) => setAnswers({ ...answers, practice_model: key })} /> : null}
            {MATCH_STEPS[step] === 'practice_size' ? <OptionList options={PRACTICE_SIZE} selected={answers.practice_size ? [answers.practice_size] : []} onToggle={(key) => setAnswers({ ...answers, practice_size: key })} /> : null}
            {MATCH_STEPS[step] === 'location' && initial.side === 'student' ? (
              <div className="space-y-3">
                <label className="block text-base text-portal-ink">
                  Add a state
                  <select className="mt-1 min-h-11 w-full rounded-lg border border-portal-border px-3 text-base" value="" onChange={(event) => setAnswers({ ...answers, states: toggle(answers.states, event.target.value, 10) })}>
                    <option value="">Choose</option>
                    {US_STATES.map((state) => <option key={state.key} value={state.key}>{state.label}</option>)}
                  </select>
                </label>
                <p className="text-base text-portal-ink">{answers.states.join(', ') || 'No states yet.'}</p>
                <label className="flex min-h-11 items-center gap-3 text-base text-portal-ink">
                  <input type="checkbox" className="h-5 w-5" checked={answers.relocate_anywhere} onChange={(event) => setAnswers({ ...answers, relocate_anywhere: event.target.checked })} />
                  Willing to relocate anywhere
                </label>
                <label className="block text-base text-portal-ink">
                  Max distance in miles
                  <input type="number" min={0} max={3000} inputMode="numeric" className="mt-1 min-h-11 w-full rounded-lg border border-portal-border px-3 text-base" value={answers.max_distance_miles ?? ''} onChange={(event) => setAnswers({ ...answers, max_distance_miles: event.target.value === '' ? null : Number(event.target.value) })} />
                </label>
              </div>
            ) : null}
            {MATCH_STEPS[step] === 'location' && initial.side === 'doctor' ? <p className="text-base text-portal-ink">We use your clinic location{initial.clinicLabel ? `: ${initial.clinicLabel}` : '.'}</p> : null}
            {MATCH_STEPS[step] === 'start_window' ? <OptionList options={START_WINDOW} selected={answers.start_window ? [answers.start_window] : []} onToggle={(key) => setAnswers({ ...answers, start_window: key })} /> : null}
            {MATCH_STEPS[step] === 'comp_model' ? <OptionList options={COMP_MODEL} selected={answers.comp_model ? [answers.comp_model] : []} onToggle={(key) => setAnswers({ ...answers, comp_model: key })} /> : null}
            {MATCH_STEPS[step] === 'care_style' ? (
              <div className="space-y-4">
                <p className="text-base font-bold text-portal-ink">How you explain care</p>
                <OptionList options={CARE_EXPLAIN} selected={answers.care_explain ? [answers.care_explain] : []} onToggle={(key) => setAnswers({ ...answers, care_explain: key })} />
                <p className="text-base font-bold text-portal-ink">Visit pace</p>
                <OptionList options={CARE_PACE} selected={answers.care_pace ? [answers.care_pace] : []} onToggle={(key) => setAnswers({ ...answers, care_pace: key })} />
              </div>
            ) : null}
            {MATCH_STEPS[step] === 'looking' ? (
              <OptionList
                options={LOOKING}
                selected={answers[lookingKey]}
                onToggle={(key) => setAnswers({ ...answers, [lookingKey]: toggle(answers[lookingKey], key) })}
              />
            ) : null}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" className="min-h-11 rounded-lg border border-portal-border px-4 text-sm font-bold text-portal-ink" disabled={step === 0 || busy} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</button>
            <button
              type="button"
              className="min-h-11 rounded-lg bg-portal-ink px-4 text-sm font-bold text-white"
              disabled={busy}
              onClick={async () => {
                const ok = await save();
                if (!ok) return;
                if (step < MATCH_STEPS.length - 1) setStep(step + 1);
              }}
            >
              {step === MATCH_STEPS.length - 1 ? 'Save' : 'Save and continue'}
            </button>
          </div>
        </section>
      ) : null}

      {!locked && !showProfile && initial.complete && tab === 'cards' ? (
        card ? (
          <article
            className="rounded-xl border border-portal-border bg-white p-4"
            tabIndex={0}
            aria-label="Candidate"
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') void choose('interested');
              if (event.key === 'ArrowLeft') void choose('not_now');
            }}
            onPointerDown={(event) => { startX.current = event.clientX; }}
            onPointerUp={(event) => {
              if (startX.current == null) return;
              const delta = event.clientX - startX.current;
              startX.current = null;
              if (delta > 80) void choose('interested');
              if (delta < -80) void choose('not_now');
            }}
          >
            <p className="text-sm text-portal-ink-2" title={TIP}>Match {card.pct}%</p>
            <p className="text-sm text-portal-ink-2">{TIP}</p>
            <div className="mt-3 flex items-start gap-3">
              {card.photoUrl ? <img src={card.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" /> : null}
              <div>
                <h2 className="text-xl font-bold text-portal-ink">{card.title}</h2>
                <p className="text-base text-portal-ink-2">{card.subtitle}</p>
              </div>
            </div>
            <p className="mt-3 text-base text-portal-ink">{card.reason}</p>
            {card.facts.length ? <p className="mt-2 text-base text-portal-ink">{card.facts.join(' · ')}</p> : null}
            {card.profileHref ? <Link href={card.profileHref} className="mt-2 inline-flex min-h-11 items-center text-base font-bold text-portal-accent">View profile</Link> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => choose('not_now')} className="min-h-11 rounded-lg border border-portal-border px-4 text-sm font-bold text-portal-ink">Not now</button>
              <button type="button" disabled={busy} onClick={() => choose('interested')} className="min-h-11 rounded-lg bg-portal-accent px-4 text-sm font-bold text-white">Interested</button>
            </div>
          </article>
        ) : <p className="text-base text-portal-ink">{initial.empty || "No new matches right now. We'll email you when a practice that fits joins."}</p>
      ) : null}

      {!locked && !showProfile && initial.complete && tab === 'matches' ? (
        <div className="space-y-3">
          {initial.matches.length === 0 ? <p className="text-base text-portal-ink">No matches yet. When you both say yes, the conversation shows up here.</p> : null}
          {initial.matches.map((match) => (
            <MatchRow key={match.id} match={match} side={initial.side} />
          ))}
        </div>
      ) : null}

      {!locked && !showProfile && initial.complete && tab === 'settings' ? (
        <section className="rounded-xl border border-portal-border bg-white p-4 space-y-3">
          <label className="flex min-h-11 items-center gap-3 text-base text-portal-ink">
            <input type="checkbox" className="h-5 w-5" checked={visible} onChange={(event) => setVisible(event.target.checked)} />
            Show me in ChiroMatch
          </label>
          {initial.side === 'doctor' ? (
            <label className="flex min-h-11 items-center gap-3 text-base text-portal-ink">
              <input type="checkbox" className="h-5 w-5" checked={open} onChange={(event) => setOpen(event.target.checked)} />
              Open to students
            </label>
          ) : null}
          <button
            type="button"
            className="min-h-11 rounded-lg bg-portal-ink px-4 text-sm font-bold text-white"
            disabled={busy}
            onClick={async () => {
              const saved = await save(answers, visible);
              if (!saved) return;
              if (initial.side === 'doctor') {
                const result = await setMatchOpen(open);
                if (result.error) setError(result.error);
              }
            }}
          >
            Save settings
          </button>
        </section>
      ) : null}
    </div>
  );
}

function stepTitle(step: (typeof MATCH_STEPS)[number], side: 'student' | 'doctor') {
  if (step === 'technique') return 'Which techniques do you use? Pick up to 3.';
  if (step === 'patient_focus') return 'Who do you want to care for?';
  if (step === 'practice_model') return 'How does the practice get paid?';
  if (step === 'practice_size') return 'How big is the practice?';
  if (step === 'location') return side === 'doctor' ? 'Where is the clinic?' : 'Where do you want to be?';
  if (step === 'start_window') return 'When do you want to start?';
  if (step === 'comp_model') return 'How should pay work?';
  if (step === 'care_style') return 'How do you like to practice?';
  return side === 'doctor' ? 'What can you offer a student?' : 'What are you looking for?';
}

function OptionList({ options, selected, onToggle }: { options: Option[]; selected: string[]; onToggle: (key: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = selected.includes(option.key);
        return (
          <button key={option.key} type="button" aria-pressed={on} onClick={() => onToggle(option.key)} className={`min-h-11 rounded-lg px-3 text-sm font-bold ${on ? 'bg-portal-ink text-white' : 'border border-portal-border bg-white text-portal-ink'}`}>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function MatchRow({ match, side }: { match: MatchDeskData['matches'][number]; side: 'student' | 'doctor' }) {
  const [times, setTimes] = useState(['', '', '']);
  const [outcome, setOutcome] = useState('talked');
  const [message, setMessage] = useState('');
  const messages = side === 'student' ? `/student/messages?c=${match.conversationId}` : `/doctor/messages?c=${match.conversationId}`;

  return (
    <article className="rounded-xl border border-portal-border bg-white p-4">
      <h2 className="text-lg font-bold text-portal-ink">{match.title}</h2>
      <p className="text-sm text-portal-ink-2" title={TIP}>Match {match.pct}%</p>
      <p className="mt-1 text-base text-portal-ink">{match.reason}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {match.conversationId ? <Link href={messages} className="inline-flex min-h-11 items-center rounded-lg bg-portal-ink px-4 text-sm font-bold text-white">Message</Link> : <p className="text-sm text-portal-ink-2">The message thread opens after the database update.</p>}
        {side === 'student' && match.doctorId ? <Link href={`/student/doctors?doctor=${match.doctorId}`} className="inline-flex min-h-11 items-center rounded-lg border border-portal-border px-4 text-sm font-bold text-portal-ink">Request a shadow day</Link> : null}
        {match.bookingUrl ? <a href={match.bookingUrl} className="inline-flex min-h-11 items-center rounded-lg border border-portal-border px-4 text-sm font-bold text-portal-ink" target="_blank" rel="noreferrer">Book a time</a> : null}
      </div>
      {!match.bookingUrl && match.conversationId ? (
        <form className="mt-3 space-y-2" onSubmit={async (event) => {
          event.preventDefault();
          const result = await suggestMatchCall(match.id, times);
          setMessage(result.error || 'Sent.');
        }}>
          {times.map((time, index) => (
            <input key={index} value={time} onChange={(event) => setTimes((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`Time ${index + 1}`} className="min-h-11 w-full rounded-lg border border-portal-border px-3 text-base" />
          ))}
          <button type="submit" className="min-h-11 rounded-lg border border-portal-border px-4 text-sm font-bold text-portal-ink">Suggest a call</button>
        </form>
      ) : null}
      <form className="mt-3 flex flex-wrap gap-2" onSubmit={async (event) => {
        event.preventDefault();
        const result = await reportMatchOutcome(match.id, outcome, '');
        setMessage(result.error || 'Saved.');
      }}>
        <select value={outcome} onChange={(event) => setOutcome(event.target.value)} className="min-h-11 rounded-lg border border-portal-border px-3 text-base">
          {OUTCOMES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
        </select>
        <button type="submit" className="min-h-11 rounded-lg border border-portal-border px-4 text-sm font-bold text-portal-ink">Save outcome</button>
      </form>
      {message ? <p className="mt-2 text-sm text-portal-ink-2">{message}</p> : null}
    </article>
  );
}
