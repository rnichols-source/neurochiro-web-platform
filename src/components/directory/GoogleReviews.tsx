"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, ExternalLink, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { fetchGoogleReviews } from "@/app/actions/reviews";

interface GoogleReviewsProps {
  placeId?: string;
  doctorName: string;
}

export default function GoogleReviews({ placeId, doctorName }: GoogleReviewsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(!!placeId);

  useEffect(() => {
    if (placeId) {
      const getReviews = async () => {
        const result = await fetchGoogleReviews(placeId);
        setData(result);
        setLoading(false);
      };
      getReviews();
    }
  }, [placeId]);

  if (!placeId) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 text-center">
        <ShieldCheck className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-20" />
        <h3 className="text-xl font-black text-white mb-2">Patient Reviews Coming Soon</h3>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">
          This clinician hasn't connected their Google Business profile yet.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 animate-pulse">
        <div className="h-8 w-48 bg-white/10 rounded-lg mb-6"></div>
        <div className="space-y-4">
          <div className="h-24 bg-white/5 rounded-2xl"></div>
          <div className="h-24 bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Stat Card */}
      <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neuro-orange to-blue-500 opacity-50"></div>
        
        <div className="flex items-center gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="text-5xl font-black text-white">{data?.rating || "5.0"}</span>
              <div className="flex flex-col">
                <div className="flex gap-0.5 text-neuro-orange">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Google Rating</span>
              </div>
            </div>
            <p className="text-slate-200 text-sm font-bold">Based on {data?.total_reviews || 0} Patient Reviews</p>
          </div>
        </div>

        <button 
          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=google&query_place_id=${placeId}`, '_blank')}
          className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-3 border border-white/10 shadow-xl"
        >
          View All on Google <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Review List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data?.reviews?.map((review: any, i: number) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/[0.05] transition-all"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-neuro-navy border border-white/10 flex items-center justify-center text-neuro-orange font-black text-lg overflow-hidden">
                {review.photo ? <img src={review.photo} alt={review.author} /> : review.author[0]}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{review.author}</h4>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 text-neuro-orange">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{review.time}</span>
                </div>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed line-clamp-4 font-medium italic">
              "{review.text}"
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
