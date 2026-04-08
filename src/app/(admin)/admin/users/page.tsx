"use client";

import { Search, Loader2, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { getTalentUsers, UserType } from "./actions";

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<UserType>("Students");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchUsers = useCallback(
    async (isLoadMore = false) => {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const currentPage = isLoadMore ? page + 1 : 1;

      try {
        const result = await getTalentUsers({
          type: activeTab,
          search: searchQuery,
          page: currentPage,
          limit: 20,
        });

        if (isLoadMore) {
          setUsers((prev) => [...prev, ...result.users]);
        } else {
          setUsers(result.users);
        }

        setTotalCount(result.total);
        setHasMore(result.hasMore);
        setPage(currentPage);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, searchQuery, page]
  );

  useEffect(() => {
    fetchUsers(false);
  }, [activeTab]);

  const handleSearch = () => fetchUsers(false);

  const tabs: UserType[] = ["Students", "Doctors", "Vendors"];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-heading font-black text-white">Users</h1>
        <p className="text-gray-400 text-sm mt-1">
          {totalCount} total {activeTab.toLowerCase()}
        </p>
      </header>

      {/* Role filter tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === tab
                ? "bg-neuro-orange text-white"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neuro-orange transition-colors"
        />
      </div>

      {/* Users table */}
      <section className="bg-white/5 border border-white/5 rounded-xl overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-black/30 z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-neuro-orange animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/[0.03]">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-white/5">
                  Name
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-white/5">
                  Email
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-white/5">
                  Role
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-white/5 text-right">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length === 0 && !loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-gray-500 text-sm">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user, i) => (
                  <tr key={`${user.id}-${i}`} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.entity}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">{user.email}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium text-gray-300 capitalize">{user.role}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 text-right">{user.joined}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className="p-4 border-t border-white/5 text-center">
            <button
              onClick={() => fetchUsers(true)}
              disabled={loadingMore}
              className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loadingMore ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              Load more
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
