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
  User as UserIcon
} from "lucide-react";
import Link from "next/link";
import { getAuditLogs } from "../logs/actions";
import { getTalentUsers } from "../users/actions";
import { formatDistanceToNow } from "date-fns";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || "";
  
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function searchAll() {
      if (!query) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Search logs
        const logResults = await getAuditLogs({ search: query, limit: 10 });
        setLogs(logResults);

        // Search users (Students + Doctors)
        const studentResults = await getTalentUsers({ type: 'Students', search: query, limit: 5 });
        const doctorResults = await getTalentUsers({ type: 'Doctors', search: query, limit: 5 });
        setUsers([...studentResults.users, ...doctorResults.users]);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }

    searchAll();
  }, [query]);

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-10">
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-neuro-orange">
          <Search className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-[0.4em]">Global Search</span>
        </div>
        <h1 className="text-4xl font-heading font-black text-white tracking-tight">
          Search Results for <span className="text-neuro-orange">"{query}"</span>
        </h1>
        <p className="text-gray-400 text-lg font-medium">Results aggregated across all platform resources.</p>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-[3rem] border border-white/5">
          <Loader2 className="w-12 h-12 text-neuro-orange animate-spin mb-4" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Scanning Database Nodes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Results */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Users Found ({users.length})</h3>
              <Link href="/admin/users" className="text-[10px] font-black text-neuro-orange uppercase tracking-widest hover:underline">View All</Link>
            </div>
            
            <div className="space-y-3">
              {users.length === 0 ? (
                <div className="p-8 bg-white/5 rounded-3xl border border-white/5 text-center">
                  <UserIcon className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">No users match</p>
                </div>
              ) : (
                users.map(user => (
                  <div key={user.id} className="p-4 bg-white/5 rounded-3xl border border-white/5 hover:border-neuro-orange/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-neuro-navy flex items-center justify-center border border-white/10 text-xs font-black text-white">
                        {user.full_name?.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user.full_name}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{user.role}</p>
                      </div>
                      <Link href={`/admin/users?q=${user.email}`} className="p-2 bg-white/5 rounded-lg text-gray-500 group-hover:text-white transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Log Results */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">System Events ({logs.length})</h3>
              <Link href="/admin/logs" className="text-[10px] font-black text-neuro-orange uppercase tracking-widest hover:underline">Full Audit Trail</Link>
            </div>

            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="p-20 bg-white/5 rounded-[3rem] border border-white/5 text-center">
                  <History className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">No matching events in the audit trail</p>
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all group flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 text-blue-500">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white group-hover:text-neuro-orange transition-colors truncate">{log.event}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{log.user}</span>
                          <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">•</span>
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                      <Database className="w-3 h-3 text-gray-600" />
                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest font-mono">{log.target}</span>
                    </div>
                    <Link href="/admin/logs" className="p-2 bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GlobalSearchPage() {
  return (
    <Suspense fallback={
      <div className="p-8 max-w-[1200px] mx-auto space-y-10">
        <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-[3rem] border border-white/5">
          <Loader2 className="w-12 h-12 text-neuro-orange animate-spin mb-4" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Initializing Search...</p>
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
