'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star, ThumbsUp, CheckCircle, ChevronDown, Loader2 } from 'lucide-react'
import {
  getProductReviews,
  submitReview,
  canReview,
  markHelpful,
  type ProductReview,
} from './review-actions'

// ============================================================================
// StarRating — reusable star display
// ============================================================================

const STAR_SIZES = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
} as const

export function StarRating({
  rating,
  size = 'md',
}: {
  rating: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClass = STAR_SIZES[size]
  const stars = []

  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(
        <Star
          key={i}
          className={`${sizeClass} fill-neuro-orange text-neuro-orange`}
        />,
      )
    } else if (i - 0.5 <= rating) {
      // Half star via clip-path
      stars.push(
        <span key={i} className={`relative inline-block ${sizeClass}`}>
          <Star className={`absolute inset-0 ${sizeClass} text-gray-300`} />
          <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <Star className={`${sizeClass} fill-neuro-orange text-neuro-orange`} />
          </span>
        </span>,
      )
    } else {
      stars.push(
        <Star key={i} className={`${sizeClass} text-gray-300`} />,
      )
    }
  }

  return <span className="inline-flex items-center gap-0.5">{stars}</span>
}

// ============================================================================
// StarSelector — interactive star picker for review form
// ============================================================================

function StarSelector({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hover, setHover] = useState(0)

  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              i <= (hover || value)
                ? 'fill-neuro-orange text-neuro-orange'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </span>
  )
}

// ============================================================================
// ReviewCard
// ============================================================================

const ROLE_COLORS: Record<string, string> = {
  doctor: 'bg-blue-100 text-blue-700',
  student: 'bg-purple-100 text-purple-700',
  patient: 'bg-green-100 text-green-700',
}

const ROLE_LABELS: Record<string, string> = {
  doctor: 'Doctor',
  student: 'Student',
  patient: 'Patient',
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  )
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years !== 1 ? 's' : ''} ago`
}

function ReviewCard({ review }: { review: ProductReview }) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count)
  const [hasClicked, setHasClicked] = useState(false)

  async function handleHelpful() {
    if (hasClicked) return
    setHasClicked(true)
    setHelpfulCount((c) => c + 1)
    await markHelpful(review.id)
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="font-bold text-neuro-navy">{review.reviewer_name}</span>
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            ROLE_COLORS[review.reviewer_role] ?? 'bg-gray-100 text-gray-600'
          }`}
        >
          {ROLE_LABELS[review.reviewer_role] ?? review.reviewer_role}
        </span>
        {review.verified_purchase && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
            <CheckCircle className="w-3.5 h-3.5" />
            Verified Purchase
          </span>
        )}
      </div>

      {/* Stars + title */}
      <div className="flex items-center gap-2 mb-2">
        <StarRating rating={review.rating} size="sm" />
        <span className="font-bold text-neuro-navy text-sm">
          {review.title}
        </span>
      </div>

      {/* Body */}
      <p className="text-gray-600 text-sm leading-relaxed mb-4">
        {review.body}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {timeAgo(review.created_at)}
        </span>
        <button
          onClick={handleHelpful}
          disabled={hasClicked}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            hasClicked
              ? 'bg-neuro-orange/10 text-neuro-orange cursor-default'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          Helpful ({helpfulCount})
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// ReviewForm
// ============================================================================

function ReviewForm({
  productId,
  onSubmitted,
}: {
  productId: string
  onSubmitted: () => void
}) {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setErrorMsg('Please select a star rating.')
      setStatus('error')
      return
    }
    if (!title.trim()) {
      setErrorMsg('Please add a title.')
      setStatus('error')
      return
    }
    if (!body.trim()) {
      setErrorMsg('Please write a review.')
      setStatus('error')
      return
    }

    setStatus('loading')
    const result = await submitReview(productId, rating, title.trim(), body.trim())

    if (result.success) {
      setStatus('success')
      onSubmitted()
    } else {
      setErrorMsg(result.error ?? 'Something went wrong.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-200 p-8 text-center">
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <p className="font-bold text-green-800 text-lg">Thank you for your review!</p>
        <p className="text-green-600 text-sm mt-1">Your feedback helps the community.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm space-y-5">
      <h3 className="font-black text-neuro-navy text-lg">Write a Review</h3>

      {/* Star selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Your Rating
        </label>
        <StarSelector value={rating} onChange={setRating} />
      </div>

      {/* Title */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-semibold text-gray-700">Title</label>
          <span className="text-xs text-gray-400">{title.length}/100</span>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 100))}
          placeholder="Summarize your experience"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/40 focus:border-neuro-orange"
          required
          maxLength={100}
        />
      </div>

      {/* Body */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-semibold text-gray-700">Review</label>
          <span className="text-xs text-gray-400">{body.length}/1000</span>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 1000))}
          placeholder="What did you like? How did it help your practice or studies?"
          rows={4}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/40 focus:border-neuro-orange resize-none"
          required
          maxLength={1000}
        />
      </div>

      {/* Error */}
      {status === 'error' && (
        <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-neuro-orange hover:bg-neuro-orange-light text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Review'
        )}
      </button>
    </form>
  )
}

// ============================================================================
// StarBreakdownBar — Amazon-style bar for a single star level
// ============================================================================

function StarBreakdownBar({
  star,
  count,
  total,
}: {
  star: number
  count: number
  total: number
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-12 text-right text-gray-600 font-medium">{star} star</span>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-neuro-orange rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-gray-500 text-xs">{count}</span>
    </div>
  )
}

// ============================================================================
// ReviewSection — main export, used on product detail page
// ============================================================================

export default function ReviewSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'helpful'>('recent')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [canWrite, setCanWrite] = useState(false)
  const [canWriteReason, setCanWriteReason] = useState<string | undefined>()

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    const data = await getProductReviews(productId, sortBy)
    setReviews(data)
    setLoading(false)
  }, [productId, sortBy])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  useEffect(() => {
    canReview(productId).then((result) => {
      setCanWrite(result.canReview)
      setCanWriteReason(result.reason)
    })
  }, [productId])

  // Compute breakdown
  const totalReviews = reviews.length
  const averageRating =
    totalReviews > 0
      ? Math.round(
          (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10,
        ) / 10
      : 0

  const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach((r) => {
    if (starCounts[r.rating] !== undefined) starCounts[r.rating]++
  })

  return (
    <section id="reviews" className="scroll-mt-24">
      <h2 className="text-2xl font-black text-neuro-navy mb-6">
        Customer Reviews
      </h2>

      {/* Summary + breakdown */}
      <div className="grid md:grid-cols-[280px_1fr] gap-8 mb-8">
        {/* Left: average */}
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-5xl font-black text-neuro-navy">
            {averageRating > 0 ? averageRating.toFixed(1) : '--'}
          </span>
          <StarRating rating={averageRating} size="lg" />
          <span className="text-sm text-gray-500 mt-1">
            {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Right: breakdown bars */}
        <div className="space-y-2 flex flex-col justify-center">
          {[5, 4, 3, 2, 1].map((star) => (
            <StarBreakdownBar
              key={star}
              star={star}
              count={starCounts[star]}
              total={totalReviews}
            />
          ))}
        </div>
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Write a Review button */}
        {canWrite ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-neuro-navy hover:bg-neuro-navy-light text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
          >
            Write a Review
          </button>
        ) : (
          <div className="text-sm text-gray-500">
            {canWriteReason === 'login' && 'Log in to write a review.'}
            {canWriteReason === 'not_purchased' &&
              'Purchase this product to leave a review.'}
            {canWriteReason === 'already_reviewed' &&
              'You have already reviewed this product.'}
          </div>
        )}

        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'recent' | 'highest' | 'helpful')
            }
            className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-neuro-orange/40"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rated</option>
            <option value="helpful">Most Helpful</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Review form */}
      {showForm && (
        <div className="mb-8">
          <ReviewForm
            productId={productId}
            onSubmitted={() => {
              setShowForm(false)
              fetchReviews()
            }}
          />
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-neuro-orange" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-semibold mb-1">No reviews yet</p>
          <p className="text-sm">Be the first to share your experience.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  )
}
