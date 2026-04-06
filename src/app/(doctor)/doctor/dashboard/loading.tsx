export default function Loading() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-28 bg-gray-100 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-100 rounded-[2.5rem]" />
      <div className="h-48 bg-gray-100 rounded-[2.5rem]" />
    </div>
  );
}
