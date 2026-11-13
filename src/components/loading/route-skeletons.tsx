/** Instant route fallbacks. Colors follow each portal. No type, so no extra font is loaded. */

export function CommunityRouteSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-8 w-48 rounded-xl bg-white" />
      <div className="h-4 w-64 max-w-full rounded-lg bg-white" />
      <div className="h-40 rounded-[22px] bg-white" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-28 rounded-[22px] bg-white" />
        <div className="h-28 rounded-[22px] bg-white" />
      </div>
    </div>
  )
}

export function DoctorRouteSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-8 w-64 rounded-lg bg-portal-surface" />
      <div className="h-4 w-80 max-w-full rounded-lg bg-portal-surface" />
      <div className="h-40 rounded-xl border border-portal-border bg-white" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-32 rounded-xl border border-portal-border bg-white" />
        <div className="h-32 rounded-xl border border-portal-border bg-white" />
      </div>
    </div>
  )
}

export function AdminRouteSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-white" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-[18px] bg-white" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-[22px] bg-white" />
    </div>
  )
}
