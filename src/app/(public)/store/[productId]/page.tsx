import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { STORE_PRODUCTS, CATEGORY_INFO, formatPrice } from '../store-data'
import ProductDetailClient from './ProductDetailClient'

// ============================================================================
// SEO Metadata
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>
}): Promise<Metadata> {
  const { productId } = await params
  const product = STORE_PRODUCTS.find((p) => p.id === productId)

  if (!product) {
    return { title: 'Product Not Found | NeuroChiro Store' }
  }

  const categoryLabel = CATEGORY_INFO[product.category].label

  return {
    title: `${product.name} | NeuroChiro Store`,
    description: product.description,
    openGraph: {
      title: `${product.name} — ${categoryLabel}`,
      description: product.description,
      type: 'website',
    },
    other: {
      'product:price:amount': formatPrice(product.memberPrice),
      'product:price:currency': 'USD',
    },
  }
}

// ============================================================================
// Server Page — resolves params and passes product to client component
// ============================================================================

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  const { productId } = await params
  const product = STORE_PRODUCTS.find((p) => p.id === productId)

  if (!product) {
    notFound()
  }

  return <ProductDetailClient product={product} />
}
