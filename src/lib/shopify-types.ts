export type ShopifyFailReason = "missing_env" | "http" | "graphql" | "timeout";

export type ShopifyFailure = {
  ok: false;
  reason: ShopifyFailReason;
  status?: number;
};

export type ShopifyMoney = {
  amount: string;
  currencyCode: string;
};

export type ShopifyImage = {
  id: string | null;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
};

export type ShopifyOption = {
  name: string;
  values: string[];
};

export type ShopifyProductCard = {
  id: string;
  handle: string;
  title: string;
  availableForSale: boolean;
  createdAt: string;
  productType: string;
  minPrice: ShopifyMoney;
  maxPrice: ShopifyMoney;
  images: ShopifyImage[];
  options: ShopifyOption[];
  defaultVariantId: string | null;
  fetchedVariantCount: number;
};

export type ShopifyVariant = {
  id: string;
  numericId: string;
  title: string;
  availableForSale: boolean;
  sku: string | null;
  price: ShopifyMoney;
  selectedOptions: { name: string; value: string }[];
  imageId: string | null;
  imageUrl: string | null;
};

export type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  createdAt: string;
  productType: string;
  seoTitle: string | null;
  seoDescription: string | null;
  minPrice: ShopifyMoney;
  maxPrice: ShopifyMoney;
  options: ShopifyOption[];
  images: ShopifyImage[];
  thumbs: ShopifyImage[];
  variants: ShopifyVariant[];
};

export type ShopifyCartLine = {
  id: string;
  quantity: number;
  title: string;
  handle: string;
  options: { name: string; value: string }[];
  unitPrice: ShopifyMoney;
  lineTotal: ShopifyMoney;
  imageUrl: string | null;
  imageAlt: string;
};

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: ShopifyMoney;
  total: ShopifyMoney;
  lines: ShopifyCartLine[];
};

export type CartActionResult = {
  ok: boolean;
  cart: ShopifyCart | null;
  error?: string;
};
