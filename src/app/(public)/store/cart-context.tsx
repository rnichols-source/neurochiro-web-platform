"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { STORE_PRODUCTS } from "./store-data";

// ============================================================================
// Types
// ============================================================================

export interface CartItem {
  productId: string;
  name: string;
  retailPrice: number; // cents
  billing: "one_time" | "monthly";
}

export interface BundleSuggestion {
  bundleId: string;
  bundleName: string;
  currentTotal: number; // cents — sum of individual items in cart
  bundlePrice: number; // cents
  savings: number; // cents
  matchingItemIds: string[];
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  subtotal: number;
}

// ============================================================================
// Bundle Definitions
// ============================================================================

const BUNDLE_DEFS: { bundleId: string; memberIds: string[] }[] = [
  {
    bundleId: "course-bundle",
    memberIds: [
      "course-clinical-identity",
      "course-business",
      "course-clinical-confidence",
      "course-associate-playbook",
    ],
  },
  {
    bundleId: "workshop-bundle",
    memberIds: [
      "workshop-stress-sleep",
      "workshop-pediatric",
      "workshop-corporate",
      "workshop-dinner",
      "workshop-reactivation",
    ],
  },
  {
    bundleId: "contract-bundle",
    memberIds: [
      "contract-basic",
      "contract-standard",
      "contract-employment",
    ],
  },
];

// ============================================================================
// Bundle Intelligence
// ============================================================================

export function getBundleSuggestions(items: CartItem[]): BundleSuggestion[] {
  const itemIds = new Set(items.map((i) => i.productId));
  const suggestions: BundleSuggestion[] = [];

  for (const def of BUNDLE_DEFS) {
    // Skip if the bundle itself is already in the cart
    if (itemIds.has(def.bundleId)) continue;

    const matchingIds = def.memberIds.filter((id) => itemIds.has(id));
    if (matchingIds.length < 2) continue;

    const bundle = STORE_PRODUCTS.find((p) => p.id === def.bundleId);
    if (!bundle) continue;

    const currentTotal = items
      .filter((i) => matchingIds.includes(i.productId))
      .reduce((sum, i) => sum + i.retailPrice, 0);

    if (bundle.retailPrice < currentTotal) {
      suggestions.push({
        bundleId: def.bundleId,
        bundleName: bundle.name,
        currentTotal,
        bundlePrice: bundle.retailPrice,
        savings: currentTotal - bundle.retailPrice,
        matchingItemIds: matchingIds,
      });
    }
  }

  return suggestions;
}

// ============================================================================
// Context
// ============================================================================

const STORAGE_KEY = "neurochiro-cart";

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, []);

  // Persist to localStorage on change (after initial load)
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items, loaded]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      // Prevent duplicates
      if (prev.some((i) => i.productId === item.productId)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const toggleCart = useCallback(() => setIsOpen((o) => !o), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const subtotal = items.reduce((sum, i) => sum + i.retailPrice, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        addItem,
        removeItem,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
