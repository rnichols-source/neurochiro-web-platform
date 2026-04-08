"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Users, 
  History, 
  ShieldCheck, 
  Clock, 
  ChevronRight,
  ArrowRight,
  Database,
  Loader2,
  X,
  User as UserIcon,
  Calendar,
  Stethoscope
} from "lucide-react";
import Link from "next/link";
import { searchAllResources } from "./actions";
import { formatDistanceToNow } from "date-fns";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || "";
  
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function search() {
      if (!query) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await searchAllResources(query);
      if (res.success) {
        setResults(res.data);
      }
      setLoading(false);
    }

    search();
  }, [query]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/5">
        <Loader2 className="w-12 h-12 text-neuro-orange animate-spin mb-4" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Scanning Platform Infrastructure...</p>
      </div>
    );
  }

  const doctors = results?.doctors || [];
  const seminars = results?.seminars || [];
  const logs = results?.logs || [];

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10">
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-neuro-orange">
          <Search className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-[0.4em]">Global Search Engine</span>
        </div>
        <h1 className="text-4xl font-heading font-black text-white tracking-tight">
          Results for <span className="text-neuro-orange">"{query}"</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          {/* Doctors Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest px-2">Clinical Directory ({doctors.length})</h3>
            <div className="space-y-3">
              {doctors.length === 0 ? (
                <p className="text-xs text-gray-600 px-2 italic">No doctors found.</p>
              ) : (
                doctors.map((doc: any) => (
                  <div key={doc.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">Dr. {doc.first_name} {doc.last_name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{doc.clinic_name}</p>
                      </div>
                      <Link href={`/admin/directory?search=${doc.last_name}`} className="p-2 hover:text-white text-gray-500">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Seminars Section */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest px-2">Seminars ({seminars.length})</h3>
            <div className="space-y-3">
              {seminars.length === 0 ? (
                <p className="text-xs text-gray-600 px-2 italic">No seminars found.</p>
              ) : (
                seminars.map((sem: any) => (
                  <div key={sem.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-neuro-orange/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-neuro-orange/10 flex items-center justify-center text-neuro-orange">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{sem.title}</p>
                        <p className="text-[10px] text-gray-500 truncate">{sem.city}, {sem.state}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Audit Log Results */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest px-2">System Events ({logs.length})</h3>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="p-20 bg-white/5 rounded-2xl border border-white/5 text-center">
                <History className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">No matching events</p>
              </div>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all group flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 text-blue-500">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white group-hover:text-neuro-orange transition-colors truncate">{log.event}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{log.user_name || log.user}</span>
                        <span className="text-xs font-black text-gray-700 uppercase tracking-widest">•</span>
                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{formatDistanceToNow(new Date(log.created_at || log.timestamp), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 shrink-0">
                    <Database className="w-3 h-3 text-gray-600" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono">{log.target}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GlobalSearchPage() {
  return (
    <Suspense fallback={
      <div className="p-8 max-w-[1200px] mx-auto space-y-10">
        <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/5">
          <Loader2 className="w-12 h-12 text-neuro-orange animate-spin mb-4" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Initializing Intelligence...</p>
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
