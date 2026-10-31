export default function Loading() {
  return (
    <div className="p-5 md:p-10 max-w-2xl mx-auto space-y-6 animate-pulse" aria-hidden="true">
      <div className="h-8 w-48 rounded-xl bg-[#e3e8ed]" />
      <div className="h-4 w-64 rounded-lg bg-[#e3e8ed]" />
      <div className="h-40 rounded-2xl bg-[#e3e8ed]" />
      <div className="h-16 rounded-xl bg-[#e3e8ed]" />
      <div className="h-16 rounded-xl bg-[#e3e8ed]" />
    </div>
  );
}
