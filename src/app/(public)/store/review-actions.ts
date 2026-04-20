'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { SEED_REVIEWS } from './seed-reviews'

export interface ProductReview {
  id: string
  product_id: string
  user_id: string | null
  reviewer_name: string
  reviewer_role: 'doctor' | 'student' | 'patient'
  rating: number
  title: string
  body: string
  verified_purchase: boolean
  helpful_count: number
  created_at: string
}

export interface ReviewSummary {
  averageRating: number
  totalReviews: number
}

type SortBy = 'recent' | 'highest' | 'helpful'

function seedReviewsForProduct(productId: string): ProductReview[] {
  return SEED_REVIEWS
    .filter((r) => r.product_id === productId)
    .map((r, i) => ({
      id: `seed-${productId}-${i}`,
      product_id: r.product_id,
      user_id: null,
      reviewer_name: r.reviewer_name,
      reviewer_role: r.reviewer_role as ProductReview['reviewer_role'],
      rating: r.rating,
      title: r.title,
      body: r.body,
      verified_purchase: r.verified_purchase,
      helpful_count: r.helpful_count,
      created_at: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }))
}

function sortReviews(reviews: ProductReview[], sortBy: SortBy): ProductReview[] {
  const sorted = [...reviews]
  switch (sortBy) {
    case 'recent':
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    case 'highest':
      return sorted.sort((a, b) => b.rating - a.rating)
    case 'helpful':
      return sorted.sort((a, b) => b.helpful_count - a.helpful_count)
    default:
      return sorted
  }
}

export async function getProductReviews(
  productId: string,
  sortBy: SortBy = 'recent',
): Promise<ProductReview[]> {
  const seeds = seedReviewsForProduct(productId)

  try {
    const supabase = createServerSupabase()
    const { data, error } = await (supabase as any)
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)

    if (error) return sortReviews(seeds, sortBy)

    const dbReviews: ProductReview[] = (data ?? []).map((row: any) => ({
      id: row.id,
      product_id: row.product_id,
      user_id: row.user_id ?? null,
      reviewer_name: row.reviewer_name,
      reviewer_role: row.reviewer_role ?? 'doctor',
      rating: row.rating,
      title: row.title ?? '',
      body: row.body ?? '',
      verified_purchase: row.verified_purchase ?? false,
      helpful_count: row.helpful_count ?? 0,
      created_at: row.created_at,
    }))

    return sortReviews([...dbReviews, ...seeds], sortBy)
  } catch {
    return sortReviews(seeds, sortBy)
  }
}

export async function getReviewSummary(productId: string): Promise<ReviewSummary> {
  const reviews = await getProductReviews(productId)
  if (reviews.length === 0) return { averageRating: 0, totalReviews: 0 }
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  return { averageRating: Math.round(avg * 10) / 10, totalReviews: reviews.length }
}

export async function submitReview(
  productId: string,
  rating: number,
  title: string,
  body: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'You must be logged in to leave a review.' }

    const { data: existing } = await (supabase as any)
      .from('product_reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) return { success: false, error: 'You have already reviewed this product.' }

    const { data: purchase } = await (supabase as any)
      .from('course_purchases')
      .select('id')
      .eq('course_id', productId)
      .eq('user_id', user.id)
      .maybeSingle()

    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous'
    const role = user.user_metadata?.role || 'doctor'

    const { error } = await (supabase as any).from('product_reviews').insert({
      product_id: productId,
      user_id: user.id,
      reviewer_name: displayName,
      reviewer_role: role,
      rating: Math.min(5, Math.max(1, Math.round(rating))),
      title: title.slice(0, 100),
      body: body.slice(0, 1000),
      verified_purchase: !!purchase,
      helpful_count: 0,
    })

    if (error) return { success: false, error: 'Failed to submit review.' }
    return { success: true }
  } catch {
    return { success: false, error: 'Something went wrong.' }
  }
}

export async function canReview(
  productId: string,
): Promise<{ canReview: boolean; reason?: string }> {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { canReview: false, reason: 'login' }

    const { data: existing } = await (supabase as any)
      .from('product_reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) return { canReview: false, reason: 'already_reviewed' }

    const { data: purchase } = await (supabase as any)
      .from('course_purchases')
      .select('id')
      .eq('course_id', productId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!purchase) return { canReview: false, reason: 'not_purchased' }
    return { canReview: true }
  } catch {
    return { canReview: false, reason: 'error' }
  }
}

export async function markHelpful(reviewId: string): Promise<{ success: boolean }> {
  if (reviewId.startsWith('seed-')) return { success: true }
  try {
    const supabase = createServerSupabase()
    await (supabase as any).rpc('increment_helpful', { review_id: reviewId })
    return { success: true }
  } catch {
    return { success: false }
  }
}
