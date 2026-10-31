'use client';

export default function NeurosFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="bg-portal-sidebar px-6 py-3 flex items-center gap-3 rounded-xl mb-6">
        <span className="text-sm font-bold text-white">NeurOS</span>
        <span className="text-xs text-white/70">Practice operating system</span>
      </div>
      {children}
    </div>
  );
}
