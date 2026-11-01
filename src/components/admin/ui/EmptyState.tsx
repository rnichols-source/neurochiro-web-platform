export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-8 text-center">
      <p className="font-heading text-base font-bold text-neuro-navy">{title}</p>
      {body ? <p className="mt-1 text-sm text-neuro-gray">{body}</p> : null}
    </div>
  )
}
