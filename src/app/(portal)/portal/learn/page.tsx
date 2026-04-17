"use client";

import { useState } from "react";
import { BookOpen, Search, ChevronDown, ChevronUp } from "lucide-react";

let ARTICLES: any[] = [];
try {
  ARTICLES = require("../articles-data").ARTICLES;
} catch {
  // Fallback if file doesn't exist
}

const CATEGORIES = ['All', ...new Set(ARTICLES.map((a: any) => a.category))] as string[];

export default function PortalLearnPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = ARTICLES.filter((a: any) => {
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
      <div className="space-y-3">
        {filtered.map((article: any) => {
          const isExpanded = expandedId === article.id;
          const preview = article.content.split('\n\n')[0] || '';

          return (
            <div key={article.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-all">
              <button
                onClick={() => setExpandedId(isExpanded ? null : article.id)}
                className="w-full text-left p-5 flex items-start gap-3"
              >
                <BookOpen className="w-5 h-5 text-neuro-orange mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-neuro-navy text-sm">{article.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{article.category} · {article.readTime}</p>
                  {!isExpanded && (
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">{preview}</p>
                  )}
                </div>
                <div className="flex-shrink-0 mt-1">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-300" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-300" />
                  )}
                </div>
              </button>
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                  <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-4">
                    {article.content.split('\n\n').map((paragraph: string, i: number) => {
                      const formatted = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                      if (paragraph.trim().startsWith('- ')) {
                        const items = paragraph.split('\n').filter((l: string) => l.trim().startsWith('- '));
                        return (
                          <ul key={i} className="list-disc pl-6 space-y-1">
                            {items.map((item: string, j: number) => (
                              <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            ))}
                          </ul>
                        );
                      }
                      return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
