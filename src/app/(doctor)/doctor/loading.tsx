export default function DoctorLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-hidden>
      <div className="h-8 w-64 bg-portal-surface rounded-lg" />
      <div className="h-4 w-80 max-w-full bg-portal-surface rounded-lg" />
      <div className="h-40 bg-white border border-portal-border rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-32 bg-white border border-portal-border rounded-xl" />
        <div className="h-32 bg-white border border-portal-border rounded-xl" />
      </div>
    </div>
  );
}
