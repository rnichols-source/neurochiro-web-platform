"use client";

import { useEffect, useState } from "react";
import { Star, Send, Loader2, ShieldCheck } from "lucide-react";
import { getVendorReviews, submitReview } from "../review-actions";

interface Review {
  id: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  doctor: { name: string; clinic: string; location: string; photoUrl: string | null } | null;
}

export default function VendorReviews({ vendorId }: { vendorId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getVendorReviews(vendorId).then((data) => {
      setReviews(data);
      setLoading(false);
    });
  }, [vendorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError("");
    const result = await submitReview(vendorId, rating, text);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    // Refresh reviews
    const updated = await getVendorReviews(vendorId);
    setReviews(updated);
    setShowForm(false);
    setText("");
    setRating(5);
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
        <h2 className="text-lg font-black text-neuro-navy mb-4">Reviews</h2>
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-neuro-navy">Reviews</h2>
          {avgRating && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="text-sm font-bold text-neuro-navy">{avgRating}</span>
              <span className="text-xs text-gray-400">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
            </div>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-neuro-navy text-white text-xs font-bold rounded-lg hover:bg-neuro-navy-light transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Rating</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-0.5"
                >
                  <Star className={`w-5 h-5 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            required
            placeholder="Share your experience with this vendor..."
            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm resize-none focus:outline-neuro-orange"
          />
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <ShieldCheck className="w-3 h-3" /> Only verified NeuroChiro doctors can review
          </div>
          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-neuro-orange text-white text-xs font-bold rounded-lg hover:bg-neuro-orange/90 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Submit Review
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 text-xs font-bold hover:text-gray-600">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <p className="text-gray-400 text-sm">No reviews yet. Be the first to share your experience.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  {review.doctor?.photoUrl ? (
                    <img src={review.doctor.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-neuro-navy/5 flex items-center justify-center text-xs font-black text-neuro-navy">
                      {review.doctor?.name?.split(' ').map(n => n[0]).join('') || '?'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-neuro-navy">{review.doctor?.name || 'Verified Doctor'}</p>
                    {review.doctor?.clinic && (
                      <p className="text-xs text-gray-400">{review.doctor.clinic}{review.doctor.location ? ` — ${review.doctor.location}` : ''}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{review.reviewText}</p>
              <p className="text-[10px] text-gray-300 mt-2">{new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
