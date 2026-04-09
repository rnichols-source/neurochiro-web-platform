import { ARTICLES } from "@/lib/articles";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function PortalLearnPage() {
  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-heading font-black text-neuro-navy">Learn</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ARTICLES.map((article) => (
          <Link key={article.slug} href={`/learn/${article.slug}`} target="_blank" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all">
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
    </div>
  );
}
