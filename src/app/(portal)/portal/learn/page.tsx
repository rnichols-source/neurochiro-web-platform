"use client";

import { useState } from "react";
import { ARTICLES } from "@/lib/articles";
import Link from "next/link";
import { BookOpen, Search } from "lucide-react";

// Filter out doctor/business-focused articles from patient portal
const PATIENT_ARTICLES = ARTICLES.filter(a =>
  !['Business', 'Communication'].includes(a.category)
);

const CATEGORIES = ['All', ...new Set(PATIENT_ARTICLES.map(a => a.category))];

export default function PortalLearnPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = PATIENT_ARTICLES.filter(a => {
    const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || a.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-heading font-black text-neuro-navy">Learn</h1>
      <p className="text-gray-500 text-sm">Understand your nervous system and how chiropractic care helps.</p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search articles..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-neuro-orange"
        />
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              category === cat ? 'bg-neuro-navy text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((article) => (
          <Link key={article.slug} href={`/learn/${article.slug}`} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-neuro-orange mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-neuro-navy text-sm">{article.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{article.category} · {article.readTime}</p>
                <p className="text-gray-500 text-sm mt-2 line-clamp-2">{article.intro}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No articles found. Try a different search.</p>
        </div>
      )}
    </div>
  );
}
