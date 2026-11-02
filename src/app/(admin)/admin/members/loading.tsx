export default function MembersLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6" aria-busy="true" aria-label="Loading members">
      <div className="h-8 w-40 rounded-xl bg-white" />
      <div className="h-11 w-full rounded-xl bg-white" />
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-14 rounded-2xl bg-white" />
        ))}
      </div>
    </div>
  )
}
