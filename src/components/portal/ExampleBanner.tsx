'use client';

export default function ExampleBanner({ onClear, onKeep }: { onClear: () => void; onKeep?: () => void }) {
  return (
    <div className="bg-portal-warning-bg border border-portal-border rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <p className="text-sm text-portal-ink flex-1">
        <span className="font-bold">Example data.</span> These numbers are a sample so you can see how it works.
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={onClear} className="min-h-11 px-3 rounded-lg bg-white border border-portal-border text-sm font-bold">Start blank</button>
        {onKeep ? (
          <button type="button" onClick={onKeep} className="min-h-11 px-3 rounded-lg bg-portal-accent text-white text-sm font-bold">Keep example</button>
        ) : null}
      </div>
    </div>
  );
}
