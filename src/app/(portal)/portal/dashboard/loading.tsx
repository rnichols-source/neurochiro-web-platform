export default function Loading() {
  return (
    <div className="space-y-6 pb-20 animate-pulse">
      <div className="h-8 w-32 bg-white/[0.08] rounded-xl" />
      <div className="h-40 bg-white/[0.06] rounded-2xl" />
      <div className="h-20 bg-white/[0.06] rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => (
          <div key={i} className="h-16 bg-white/[0.06] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
