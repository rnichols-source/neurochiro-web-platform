export default function Loading() {
  return (
    <div className="space-y-6 pb-20 animate-pulse">
      <div className="h-8 w-32 bg-gray-200 rounded-xl" />
      <div className="h-40 bg-gray-100 rounded-2xl" />
      <div className="h-20 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
