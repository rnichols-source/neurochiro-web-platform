"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase-admin";

interface Article {
  id: string;
  title: string;
  body: string;
  published_at: string;
}

export default function VendorContent({ vendorId }: { vendorId: string }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/vendor-content?vendorId=${vendorId}`)
      .then(r => r.json())
      .then(data => { setArticles(data.articles || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [vendorId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
        <h2 className="text-lg font-black text-neuro-navy mb-4">Articles</h2>
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
      </div>
    );
  }

  if (articles.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-neuro-navy" />
        <h2 className="text-lg font-black text-neuro-navy">Articles & Resources</h2>
      </div>

      <div className="space-y-4">
        {articles.map((article) => (
          <div key={article.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
            <button
              onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
              className="w-full text-left"
            >
              <h3 className="font-bold text-neuro-navy hover:text-neuro-orange transition-colors">{article.title}</h3>
              <p className="text-[10px] text-gray-400 mt-1">
                {new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </button>
            {expandedId === article.id && (
              <div className="mt-3 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {article.body}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
