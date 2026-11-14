export default function StartsLoading() {
  return (
    <div className="space-y-4 px-4 py-8 lg:px-8" aria-busy="true" aria-label="Loading patients started">
      <div className="h-44 animate-pulse rounded-[22px] bg-white" />
      <div className="h-64 animate-pulse rounded-[22px] bg-white" />
      <div className="h-40 animate-pulse rounded-[22px] bg-white" />
    </div>
  )
}
