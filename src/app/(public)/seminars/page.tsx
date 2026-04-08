"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { getSeminars } from "./actions";

export const dynamic = "force-dynamic";

export default function SeminarsPage() {
  const [seminars, setSeminars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const data = await getSeminars({});
      setSeminars(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = seminars.filter((s) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      s.title?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-dvh bg-gray-50 pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seminars</h1>
          <Link
            href="/host-a-seminar"
            className="px-5 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
          >
            Host a Seminar
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* List */}
        {loading ? (
          <p className="text-center text-gray-500 py-20">Loading seminars...</p>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((seminar) => (
              <div
                key={seminar.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-1">{seminar.title}</h2>
                <p className="text-sm text-gray-500 mb-3">
                  {seminar.dates} &middot; {seminar.city}{seminar.country ? `, ${seminar.country}` : ""}
                </p>
                <Link
                  href={`/seminars/${seminar.id}`}
                  className="text-sm font-medium text-orange-600 hover:underline"
                >
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-2">No upcoming seminars.</p>
            <p className="text-gray-400 text-sm">
              Be the first to{" "}
              <Link href="/host-a-seminar" className="text-orange-600 hover:underline">
                host one
              </Link>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
