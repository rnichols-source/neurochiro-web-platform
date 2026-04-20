'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  CheckCircle,
  ShoppingCart,
  Zap,
  GraduationCap,
  Users,
  FileText,
  Wrench,
  Tag,
} from 'lucide-react'
import {
  STORE_PRODUCTS,
  CATEGORY_INFO,
  formatPrice,
  getSavingsPercent,
  type StoreProduct,
  type StoreCategory,
} from '../store-data'
import Footer from '@/components/landing/Footer'
import ReviewSection, { StarRating } from '../review-section'
import { getReviewSummary, type ReviewSummary } from '../review-actions'
import { createStoreCheckout } from '../actions'
import { useCart } from '../cart-context'

// ============================================================================
// Helpers
// ============================================================================

const CATEGORY_ICONS: Record<StoreCategory, React.ReactNode> = {
  courses: <GraduationCap className="w-5 h-5" />,
  workshops: <Users className="w-5 h-5" />,
  contracts: <FileText className="w-5 h-5" />,
  tools: <Wrench className="w-5 h-5" />,
}

function getRelatedProducts(product: StoreProduct): StoreProduct[] {
  return STORE_PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id,
  ).slice(0, 4)
}

// ============================================================================
// ProductDetailClient
// ============================================================================

export default function ProductDetailClient({
  product,
}: {
  product: StoreProduct
}) {
  const categoryInfo = CATEGORY_INFO[product.category]
  const savings = getSavingsPercent(product)
  const relatedProducts = getRelatedProducts(product)
  const isMonthly = product.billing === 'monthly'
  const { addItem, openCart } = useCart()
  const [buying, setBuying] = useState(false)

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      retailPrice: product.retailPrice,
      billing: product.billing,
    })
    openCart()
  }

  const handleBuyNow = async () => {
    setBuying(true)
    const result = await createStoreCheckout(
      product.id,
      product.name,
      product.retailPrice,
      product.billing,
    )
    if (result.url) {
      window.location.href = result.url
    } else {
      alert(result.error || 'Something went wrong')
      setBuying(false)
    }
  }

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* ── Breadcrumbs ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/store" className="hover:text-neuro-orange transition-colors">
              Store
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href={`/store?category=${product.category}`}
              className="hover:text-neuro-orange transition-colors"
            >
              {categoryInfo.label}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-neuro-navy font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-neuro-navy to-neuro-navy-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          {/* Category badge */}
          <span className="inline-flex items-center gap-1.5 text-neuro-orange text-sm font-semibold mb-4">
            {CATEGORY_ICONS[product.category]}
            {categoryInfo.label}
          </span>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">
            {product.name}
          </h1>

          <p className="text-lg text-gray-300 max-w-2xl mb-6">
            {product.description}
          </p>

          {/* Rating summary in hero */}
          <HeroRatingSummary productId={product.id} />

          {/* Badge */}
          {product.badge && (
            <span className="inline-flex items-center gap-1.5 bg-neuro-orange/20 text-neuro-orange font-bold text-sm px-4 py-1.5 rounded-full mt-4">
              <Tag className="w-4 h-4" />
              {product.badge}
            </span>
          )}
        </div>
      </div>

      {/* ── Two-column content ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid lg:grid-cols-[1fr_380px] gap-10">
          {/* Left column */}
          <div className="space-y-10">
            {/* Description */}
            <section>
              <h2 className="text-2xl font-black text-neuro-navy mb-4">
                About This Product
              </h2>
              <p className="text-gray-600 leading-relaxed text-base">
                {product.longDescription}
              </p>
            </section>

            {/* What You'll Get */}
            <section>
              <h2 className="text-2xl font-black text-neuro-navy mb-4">
                What You&apos;ll Get
              </h2>
              <div className="space-y-3">
                {product.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Bundle contents */}
            {product.bundleIds && product.bundleIds.length > 0 && (
              <section>
                <h2 className="text-2xl font-black text-neuro-navy mb-4">
                  Included in This Bundle
                </h2>
                <div className="space-y-3">
                  {product.bundleIds.map((bId) => {
                    const bundled = STORE_PRODUCTS.find((p) => p.id === bId)
                    if (!bundled) return null
                    return (
                      <Link
                        key={bId}
                        href={`/store/${bId}`}
                        className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:border-neuro-orange/30 hover:shadow-md transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-neuro-orange/10 flex items-center justify-center text-neuro-orange flex-shrink-0">
                          {CATEGORY_ICONS[bundled.category]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-neuro-navy text-sm truncate">
                            {bundled.name}
                          </p>
                          <p className="text-gray-500 text-xs truncate">
                            ${formatPrice(bundled.retailPrice)} value
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Right column: sticky pricing card */}
          <div className="lg:self-start lg:sticky lg:top-24">
            <div className="rounded-2xl bg-white border border-gray-100 shadow-lg p-6 space-y-5">
              {/* Pricing */}
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-black text-neuro-navy">
                    ${formatPrice(product.memberPrice)}
                  </span>
                  {isMonthly && (
                    <span className="text-gray-500 text-sm font-medium">/mo</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">Member price</p>
              </div>

              {product.retailPrice !== product.memberPrice && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 line-through text-lg">
                    ${formatPrice(product.retailPrice)}
                    {isMonthly ? '/mo' : ''}
                  </span>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    Save {savings}%
                  </span>
                </div>
              )}

              <hr className="border-gray-100" />

              {/* CTA buttons */}
              <button
                onClick={handleAddToCart}
                className="w-full bg-neuro-orange hover:bg-neuro-orange/90 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>

              <button
                onClick={handleBuyNow}
                disabled={buying}
                className={`w-full font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                  buying
                    ? 'bg-gray-200 text-gray-400 cursor-wait'
                    : 'bg-neuro-navy hover:bg-neuro-navy/90 text-white active:scale-[0.98]'
                }`}
              >
                {buying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Buy Now
                  </>
                )}
              </button>

              {/* Audience tags */}
              <div className="flex flex-wrap gap-2">
                {product.audience.map((aud) => (
                  <span
                    key={aud}
                    className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-50 text-gray-600 capitalize"
                  >
                    For {aud}s
                  </span>
                ))}
              </div>

              {/* Billing note */}
              <p className="text-xs text-gray-400 text-center">
                {isMonthly
                  ? 'Billed monthly. Cancel anytime.'
                  : 'One-time purchase. Lifetime access.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reviews ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <ReviewSection productId={product.id} />
      </div>

      {/* ── Related Products ────────────────────────────────────────── */}
      {relatedProducts.length > 0 && (
        <div className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <h2 className="text-2xl font-black text-neuro-navy mb-6">
              Related Products
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rp) => (
                <RelatedProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <Footer />
    </div>
  )
}

// ============================================================================
// HeroRatingSummary — async-loaded rating in the hero
// ============================================================================

function HeroRatingSummary({ productId }: { productId: string }) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null)

  useEffect(() => {
    getReviewSummary(productId).then(setSummary)
  }, [productId])

  if (!summary || summary.totalReviews === 0) return null

  return (
    <div className="flex items-center gap-2">
      <StarRating rating={summary.averageRating} size="md" />
      <span className="text-white font-semibold">{summary.averageRating.toFixed(1)}</span>
      <span className="text-gray-400 text-sm">
        ({summary.totalReviews} review{summary.totalReviews !== 1 ? 's' : ''})
      </span>
    </div>
  )
}

// ============================================================================
// RelatedProductCard
// ============================================================================

function RelatedProductCard({ product }: { product: StoreProduct }) {
  const savings = getSavingsPercent(product)
  const isMonthly = product.billing === 'monthly'

  return (
    <Link
      href={`/store/${product.id}`}
      className="group rounded-2xl bg-white border border-gray-100 p-5 hover:border-neuro-orange/30 hover:shadow-lg transition-all flex flex-col"
    >
      {/* Badge */}
      {product.badge && (
        <span className="self-start bg-neuro-orange/10 text-neuro-orange text-xs font-bold px-2.5 py-1 rounded-full mb-3">
          {product.badge}
        </span>
      )}

      <h3 className="font-bold text-neuro-navy text-sm group-hover:text-neuro-orange transition-colors mb-2 line-clamp-2">
        {product.name}
      </h3>

      <p className="text-gray-500 text-xs line-clamp-2 mb-4 flex-1">
        {product.description}
      </p>

      <div className="flex items-baseline gap-2">
        <span className="font-black text-neuro-navy">
          ${formatPrice(product.memberPrice)}
          {isMonthly ? '/mo' : ''}
        </span>
        {product.retailPrice !== product.memberPrice && (
          <span className="text-gray-400 line-through text-xs">
            ${formatPrice(product.retailPrice)}
          </span>
        )}
        {savings > 0 && (
          <span className="text-green-600 text-xs font-bold">-{savings}%</span>
        )}
      </div>
    </Link>
  )
}
