import "server-only";
import {
  imageAlt,
  sanitizeHtml,
  sortOptionValues,
  variantNumericId,
  type MerchSort,
} from "./shopify-catalog";
import type {
  ShopifyCart,
  ShopifyCartLine,
  ShopifyFailure,
  ShopifyImage,
  ShopifyMoney,
  ShopifyOption,
  ShopifyProduct,
  ShopifyProductCard,
  ShopifyVariant,
} from "./shopify-types";

const API_VERSION = "2025-01";
const TIMEOUT_MS = 8000;

type RawMoney = ShopifyMoney;
type RawImage = {
  id?: string | null;
  url: string;
  width?: number | null;
  height?: number | null;
};
type RawImageEdge = { node: RawImage };
type RawOption = { name: string; optionValues?: { name: string }[] | null };
type RawCard = {
  id: string;
  handle: string;
  title: string;
  availableForSale: boolean;
  createdAt: string;
  productType?: string | null;
  priceRange: { minVariantPrice: RawMoney; maxVariantPrice: RawMoney };
  options?: RawOption[] | null;
  images?: { edges: RawImageEdge[] } | null;
  variants?: { edges: { node: { id: string; availableForSale: boolean } }[] } | null;
};
type RawVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  sku?: string | null;
  price: RawMoney;
  selectedOptions?: { name: string; value: string }[] | null;
  image?: RawImage | null;
};
type RawProduct = Omit<RawCard, "variants"> & {
  description?: string | null;
  descriptionHtml?: string | null;
  seo?: { title?: string | null; description?: string | null } | null;
  thumbs?: { edges: RawImageEdge[] } | null;
  variants?: { edges: { node: RawVariant }[] } | null;
};
type RawCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: RawMoney; totalAmount: RawMoney };
  lines?: {
    edges: {
      node: {
        id: string;
        quantity: number;
        cost?: { totalAmount?: RawMoney | null } | null;
        merchandise?: {
          id: string;
          title: string;
          price: RawMoney;
          selectedOptions?: { name: string; value: string }[] | null;
          image?: { url: string } | null;
          product?: { handle: string; title: string } | null;
        } | null;
      };
    }[];
  } | null;
};

export type CartLineRequest = { merchandiseId: string; quantity: number };

export type CartOpResult =
  | { ok: true; cart: ShopifyCart | null; userErrors: string[] }
  | ShopifyFailure;

const PRODUCT_CORE = `
  id
  handle
  title
  availableForSale
  createdAt
  productType
  description
  descriptionHtml
  seo { title description }
  priceRange {
    minVariantPrice { amount currencyCode }
    maxVariantPrice { amount currencyCode }
  }
  options {
    name
    optionValues { name }
  }
`;

const CARD_FIELDS = `
  id
  handle
  title
  availableForSale
  createdAt
  productType
  priceRange {
    minVariantPrice { amount currencyCode }
    maxVariantPrice { amount currencyCode }
  }
  options {
    name
    optionValues { name }
  }
  images(first: 2) {
    edges {
      node {
        id
        url(transform: { maxWidth: 600 })
        width
        height
      }
    }
  }
  variants(first: 2) {
    edges { node { id availableForSale } }
  }
`;

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  cost {
    subtotalAmount { amount currencyCode }
    totalAmount { amount currencyCode }
  }
  lines(first: 100) {
    edges {
      node {
        id
        quantity
        cost { totalAmount { amount currencyCode } }
        merchandise {
          ... on ProductVariant {
            id
            title
            price { amount currencyCode }
            selectedOptions { name value }
            image { url(transform: { maxWidth: 160 }) }
            product { handle title }
          }
        }
      }
    }
  }
`;

function shopifyDomain(): string {
  const raw = process.env["SHOPIFY_STORE_DOMAIN"] || "wpy2jn-q0.myshopify.com";
  return raw.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function storefrontToken(): string | undefined {
  const value = process.env["SHOPIFY_STOREFRONT_TOKEN"];
  if (!value?.trim()) return undefined;
  return value.trim();
}

export function isShopifyConfigured(): boolean {
  return Boolean(storefrontToken());
}

function logFailure(reason: string, status?: number) {
  if (status != null) console.error(`[shopify] reason=${reason} ${status}`);
  else console.error(`[shopify] reason=${reason}`);
}

export async function shopifyFetch<T>({
  query,
  variables,
  cache,
  revalidate = 60,
  tags,
}: {
  query: string;
  variables?: Record<string, unknown>;
  cache?: "no-store";
  revalidate?: number;
  tags?: string[];
}): Promise<{ ok: true; data: T } | ShopifyFailure> {
  const token = storefrontToken();
  if (!token) {
    logFailure("missing_env");
    return { ok: false, reason: "missing_env" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    };
    if (cache === "no-store") init.cache = "no-store";
    else init.next = { revalidate, tags: tags ?? ["shopify"] };

    const response = await fetch(`https://${shopifyDomain()}/api/${API_VERSION}/graphql.json`, init);
    if (!response.ok) {
      logFailure("http", response.status);
      return { ok: false, reason: "http", status: response.status };
    }

    let json: { data?: T; errors?: unknown[] };
    try {
      json = (await response.json()) as { data?: T; errors?: unknown[] };
    } catch {
      logFailure("http", response.status);
      return { ok: false, reason: "http", status: response.status };
    }

    if (json.errors?.length || json.data == null) {
      logFailure("graphql");
      return { ok: false, reason: "graphql" };
    }
    return { ok: true, data: json.data };
  } catch (error) {
    const aborted = error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
    if (aborted) {
      logFailure("timeout");
      return { ok: false, reason: "timeout" };
    }
    logFailure("http");
    return { ok: false, reason: "http" };
  } finally {
    clearTimeout(timer);
  }
}

function mapOptions(options: RawOption[] | null | undefined): ShopifyOption[] {
  return (options ?? []).map((option) => ({
    name: option.name,
    values: sortOptionValues(
      option.name,
      (option.optionValues ?? []).map((value) => value.name).filter(Boolean),
    ),
  }));
}

function mapImages(title: string, edges: RawImageEdge[] | undefined): ShopifyImage[] {
  return (edges ?? []).map((edge, index) => ({
    id: edge.node.id ?? null,
    url: edge.node.url,
    alt: imageAlt(title, index + 1),
    width: edge.node.width ?? null,
    height: edge.node.height ?? null,
  }));
}

function mapCard(node: RawCard): ShopifyProductCard {
  const variants = node.variants?.edges ?? [];
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    availableForSale: Boolean(node.availableForSale),
    createdAt: node.createdAt,
    productType: node.productType ?? "",
    minPrice: node.priceRange.minVariantPrice,
    maxPrice: node.priceRange.maxVariantPrice,
    images: mapImages(node.title, node.images?.edges),
    options: mapOptions(node.options),
    defaultVariantId: variants[0]?.node.id ?? null,
    fetchedVariantCount: variants.length,
  };
}

function mapVariant(node: RawVariant): ShopifyVariant {
  return {
    id: node.id,
    numericId: variantNumericId(node.id),
    title: node.title,
    availableForSale: Boolean(node.availableForSale),
    sku: node.sku ?? null,
    price: node.price,
    selectedOptions: node.selectedOptions ?? [],
    imageId: node.image?.id ?? null,
    imageUrl: node.image?.url ?? null,
  };
}

function mapProduct(node: RawProduct): ShopifyProduct {
  const variants = (node.variants?.edges ?? []).map((edge) => mapVariant(edge.node));
  const images = mapImages(node.title, node.images?.edges).map((image, index) => {
    const variant = variants.find((item) => item.imageId && item.imageId === image.id);
    const color = variant?.selectedOptions.find((option) => /colou?r/i.test(option.name))?.value;
    return { ...image, alt: imageAlt(node.title, index + 1, color) };
  });
  const thumbs = (node.thumbs?.edges ?? []).map((edge, index) => ({
    id: edge.node.id ?? null,
    url: edge.node.url,
    alt: images[index]?.alt ?? imageAlt(node.title, index + 1),
    width: null,
    height: null,
  }));
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    description: node.description ?? "",
    descriptionHtml: sanitizeHtml(node.descriptionHtml ?? ""),
    availableForSale: Boolean(node.availableForSale),
    createdAt: node.createdAt,
    productType: node.productType ?? "",
    seoTitle: node.seo?.title ?? null,
    seoDescription: node.seo?.description ?? null,
    minPrice: node.priceRange.minVariantPrice,
    maxPrice: node.priceRange.maxVariantPrice,
    options: mapOptions(node.options),
    images,
    thumbs,
    variants,
  };
}

function mapCart(cart: RawCart): ShopifyCart {
  const lines: ShopifyCartLine[] = [];
  for (const edge of cart.lines?.edges ?? []) {
    const merchandise = edge.node.merchandise;
    if (!merchandise?.product?.handle || !merchandise.product.title) continue;
    const options = (merchandise.selectedOptions ?? []).filter(
      (option) => !(option.name.toLowerCase() === "title" && option.value.toLowerCase() === "default title"),
    );
    const color = options.find((option) => /colou?r/i.test(option.name))?.value;
    lines.push({
      id: edge.node.id,
      quantity: edge.node.quantity,
      title: merchandise.product.title,
      handle: merchandise.product.handle,
      options,
      unitPrice: merchandise.price,
      lineTotal: edge.node.cost?.totalAmount ?? merchandise.price,
      imageUrl: merchandise.image?.url ?? null,
      imageAlt: imageAlt(merchandise.product.title, 1, color),
    });
  }
  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    totalQuantity: cart.totalQuantity,
    subtotal: cart.cost.subtotalAmount,
    total: cart.cost.totalAmount,
    lines,
  };
}

type ProductsQuery = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: { node: RawCard }[];
  };
};

function productSortVars(sort: MerchSort): { sortKey: string; reverse: boolean } {
  switch (sort) {
    case "price-asc":
      return { sortKey: "PRICE", reverse: false };
    case "price-desc":
      return { sortKey: "PRICE", reverse: true };
    case "newest":
      return { sortKey: "CREATED_AT", reverse: true };
    default:
      return { sortKey: "BEST_SELLING", reverse: false };
  }
}

function collectionSortVars(sort: MerchSort): { sortKey: string; reverse: boolean } {
  switch (sort) {
    case "price-asc":
      return { sortKey: "PRICE", reverse: false };
    case "price-desc":
      return { sortKey: "PRICE", reverse: true };
    case "newest":
      return { sortKey: "CREATED", reverse: true };
    default:
      return { sortKey: "BEST_SELLING", reverse: false };
  }
}

const PRODUCTS_QUERY = `
  query Products($first: Int!, $cursor: String, $sortKey: ProductSortKeys, $reverse: Boolean, $query: String) @inContext(country: US) {
    products(first: $first, after: $cursor, sortKey: $sortKey, reverse: $reverse, query: $query) {
      pageInfo { hasNextPage endCursor }
      edges { node { ${CARD_FIELDS} } }
    }
  }
`;

function fetchProductPage(input: {
  first: number;
  cursor: string | null;
  sortKey: string;
  reverse: boolean;
  query: string | null;
}): Promise<{ ok: true; data: ProductsQuery } | ShopifyFailure> {
  return shopifyFetch<ProductsQuery>({
    query: PRODUCTS_QUERY,
    variables: {
      first: input.first,
      cursor: input.cursor,
      sortKey: input.sortKey,
      reverse: input.reverse,
      query: input.query,
    },
  });
}

export async function getProducts(options?: { first?: number; sort?: MerchSort; query?: string }): Promise<
  | { ok: true; products: ShopifyProductCard[] }
  | ShopifyFailure
> {
  const pageSize = options?.first ?? 50;
  const sort = productSortVars(options?.sort ?? "featured");
  const products: ShopifyProductCard[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < 4; page += 1) {
    const result = await fetchProductPage({
      first: pageSize,
      cursor,
      sortKey: sort.sortKey,
      reverse: sort.reverse,
      query: options?.query ?? null,
    });

    if (!result.ok) {
      if (products.length > 0) return { ok: true, products };
      return result;
    }

    for (const edge of result.data.products.edges ?? []) products.push(mapCard(edge.node));
    if (!result.data.products.pageInfo.hasNextPage) break;
    cursor = result.data.products.pageInfo.endCursor;
    if (!cursor) break;
  }

  return { ok: true, products };
}

export async function getProductByHandle(handle: string): Promise<
  | { ok: true; product: ShopifyProduct | null }
  | ShopifyFailure
> {
  const result = await shopifyFetch<{ product: RawProduct | null }>({
    query: `
      query ProductByHandle($handle: String!) @inContext(country: US) {
        product(handle: $handle) {
          ${PRODUCT_CORE}
          images(first: 20) {
            edges {
              node {
                id
                url(transform: { maxWidth: 1200 })
                width
                height
              }
            }
          }
          thumbs: images(first: 20) {
            edges { node { id url(transform: { maxWidth: 160 }) } }
          }
          variants(first: 100) {
            edges {
              node {
                id
                title
                availableForSale
                sku
                price { amount currencyCode }
                selectedOptions { name value }
                image { id url(transform: { maxWidth: 1200 }) }
              }
            }
          }
        }
      }
    `,
    variables: { handle },
  });
  if (!result.ok) return result;
  return { ok: true, product: result.data.product ? mapProduct(result.data.product) : null };
}

export async function getCollections(): Promise<
  | { ok: true; collections: { handle: string; title: string; hasProducts: boolean }[] }
  | ShopifyFailure
> {
  const result = await shopifyFetch<{
    collections: { edges: { node: { handle: string; title: string; products: { edges: { node: { id: string } }[] } } }[] };
  }>({
    query: `
      query Collections @inContext(country: US) {
        collections(first: 50) {
          edges {
            node {
              handle
              title
              products(first: 1) { edges { node { id } } }
            }
          }
        }
      }
    `,
  });
  if (!result.ok) return result;
  return {
    ok: true,
    collections: (result.data.collections.edges ?? []).map((edge) => ({
      handle: edge.node.handle,
      title: edge.node.title,
      hasProducts: (edge.node.products?.edges ?? []).length > 0,
    })),
  };
}

export async function getCollectionProducts(
  handle: string,
  sort: MerchSort = "featured",
): Promise<{ ok: true; products: ShopifyProductCard[]; missing: boolean } | ShopifyFailure> {
  const vars = collectionSortVars(sort);
  const result = await shopifyFetch<{
    collection: { products: { edges: { node: RawCard }[] } } | null;
  }>({
    query: `
      query CollectionProducts($handle: String!, $first: Int!, $sortKey: ProductCollectionSortKeys, $reverse: Boolean) @inContext(country: US) {
        collection(handle: $handle) {
          products(first: $first, sortKey: $sortKey, reverse: $reverse) {
            edges { node { ${CARD_FIELDS} } }
          }
        }
      }
    `,
    variables: { handle, first: 100, sortKey: vars.sortKey, reverse: vars.reverse },
  });
  if (!result.ok) return result;
  if (!result.data.collection) return { ok: true, products: [], missing: true };
  return {
    ok: true,
    missing: false,
    products: (result.data.collection.products.edges ?? []).map((edge) => mapCard(edge.node)),
  };
}

export async function getProductRecommendations(productId: string): Promise<
  | { ok: true; products: ShopifyProductCard[] }
  | ShopifyFailure
> {
  const result = await shopifyFetch<{ productRecommendations: RawCard[] | null }>({
    query: `
      query Recommendations($productId: ID!) @inContext(country: US) {
        productRecommendations(productId: $productId) {
          ${CARD_FIELDS}
        }
      }
    `,
    variables: { productId },
  });
  if (!result.ok) return result;
  return {
    ok: true,
    products: (result.data.productRecommendations ?? []).slice(0, 8).map(mapCard),
  };
}

function cartMutationResult(data: { cart: RawCart | null; userErrors?: { message: string }[] } | null | undefined): CartOpResult {
  if (!data) return { ok: false, reason: "graphql" };
  return {
    ok: true,
    cart: data.cart ? mapCart(data.cart) : null,
    userErrors: (data.userErrors ?? []).map((error) => error.message).filter(Boolean),
  };
}

export async function createCart(lines: CartLineRequest[]): Promise<CartOpResult> {
  const result = await shopifyFetch<{ cartCreate: { cart: RawCart | null; userErrors?: { message: string }[] } }>({
    query: `
      mutation CartCreate($lines: [CartLineInput!]!) @inContext(country: US) {
        cartCreate(input: { lines: $lines, buyerIdentity: { countryCode: US } }) {
          cart { ${CART_FIELDS} }
          userErrors { field message }
        }
      }
    `,
    variables: { lines },
    cache: "no-store",
  });
  if (!result.ok) return result;
  return cartMutationResult(result.data.cartCreate);
}

export async function addToCart(cartId: string, lines: CartLineRequest[]): Promise<CartOpResult> {
  const result = await shopifyFetch<{ cartLinesAdd: { cart: RawCart | null; userErrors?: { message: string }[] } }>({
    query: `
      mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) @inContext(country: US) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { ${CART_FIELDS} }
          userErrors { field message }
        }
      }
    `,
    variables: { cartId, lines },
    cache: "no-store",
  });
  if (!result.ok) return result;
  return cartMutationResult(result.data.cartLinesAdd);
}

export async function updateCartLines(
  cartId: string,
  lines: { id: string; quantity: number }[],
): Promise<CartOpResult> {
  const result = await shopifyFetch<{ cartLinesUpdate: { cart: RawCart | null; userErrors?: { message: string }[] } }>({
    query: `
      mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) @inContext(country: US) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart { ${CART_FIELDS} }
          userErrors { field message }
        }
      }
    `,
    variables: { cartId, lines },
    cache: "no-store",
  });
  if (!result.ok) return result;
  return cartMutationResult(result.data.cartLinesUpdate);
}

export async function removeFromCart(cartId: string, lineIds: string[]): Promise<CartOpResult> {
  const result = await shopifyFetch<{ cartLinesRemove: { cart: RawCart | null; userErrors?: { message: string }[] } }>({
    query: `
      mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) @inContext(country: US) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ${CART_FIELDS} }
          userErrors { field message }
        }
      }
    `,
    variables: { cartId, lineIds },
    cache: "no-store",
  });
  if (!result.ok) return result;
  return cartMutationResult(result.data.cartLinesRemove);
}

export async function getCart(cartId: string): Promise<{ ok: true; cart: ShopifyCart | null } | ShopifyFailure> {
  const result = await shopifyFetch<{ cart: RawCart | null }>({
    query: `
      query Cart($id: ID!) @inContext(country: US) {
        cart(id: $id) { ${CART_FIELDS} }
      }
    `,
    variables: { id: cartId },
    cache: "no-store",
  });
  if (!result.ok) return result;
  return { ok: true, cart: result.data.cart ? mapCart(result.data.cart) : null };
}
