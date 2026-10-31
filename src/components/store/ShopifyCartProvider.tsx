"use client";

import { createContext, useCallback, useContext, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { addLine, getCartAction, removeLine, updateLine } from "@/app/(public)/store/cart-actions";
import type { ShopifyCart, ShopifyCartLine, ShopifyMoney } from "@/lib/shopify-types";

type OptimisticAction =
  | { type: "qty"; lineId: string; quantity: number }
  | { type: "remove"; lineId: string };

type CartContextValue = {
  configured: boolean;
  cart: ShopifyCart | null;
  isPending: boolean;
  notice: string | null;
  error: string | null;
  isOpen: boolean;
  openCart: (trigger?: HTMLElement | null) => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity: number) => void;
  updateItem: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function money(amount: number, currencyCode: string): ShopifyMoney {
  return { amount: amount.toFixed(2), currencyCode };
}

function reduceCart(current: ShopifyCart, action: OptimisticAction): ShopifyCart {
  const lines = current.lines
    .map((line) => {
      if (line.id !== action.lineId) return line;
      if (action.type === "remove") return null;
      const unit = Number(line.unitPrice.amount);
      const next: ShopifyCartLine = {
        ...line,
        quantity: action.quantity,
        lineTotal: money(unit * action.quantity, line.unitPrice.currencyCode),
      };
      return next;
    })
    .filter((line): line is ShopifyCartLine => Boolean(line));
  const subtotal = lines.reduce((sum, line) => sum + Number(line.lineTotal.amount), 0);
  return {
    ...current,
    lines,
    totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: money(subtotal, current.subtotal.currencyCode),
    total: money(subtotal, current.total.currencyCode),
  };
}

export function ShopifyCartProvider({
  configured,
  children,
}: {
  configured: boolean;
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [optimisticCart, applyOptimistic] = useOptimistic(cart, (current, action: OptimisticAction) => {
    if (!current) return current;
    return reduceCart(current, action);
  });
  const [isPending, startTransition] = useTransition();
  const [isOpen, setOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      localStorage.removeItem("neurochiro-cart");
    } catch {
      // Storage can be blocked. The old cart is client-only and unused.
    }
    if (!configured) return;
    if (!document.cookie.split(";").some((part) => part.trim().startsWith("nc_cart_hint="))) return;
    let cancelled = false;
    getCartAction().then((result) => {
      if (!cancelled && result.cart) setCart(result.cart);
    });
    return () => {
      cancelled = true;
    };
  }, [configured]);

  const closeCart = useCallback(() => {
    setOpen(false);
    const trigger = triggerRef.current;
    requestAnimationFrame(() => trigger?.focus());
  }, []);

  const openCart = useCallback((trigger?: HTMLElement | null) => {
    if (trigger) triggerRef.current = trigger;
    else if (document.activeElement instanceof HTMLElement) triggerRef.current = document.activeElement;
    setOpen(true);
    if (!configured) return;
    startTransition(async () => {
      const result = await getCartAction();
      if (result.ok) setCart(result.cart);
      else setError(result.error ?? "The cart is taking a moment. Try again.");
    });
  }, [configured]);

  const addItem = useCallback((variantId: string, quantity: number) => {
    if (!configured) return;
    setError(null);
    if (document.activeElement instanceof HTMLElement) triggerRef.current = document.activeElement;
    startTransition(async () => {
      const result = await addLine(variantId, quantity);
      if (result.cart) setCart(result.cart);
      if (!result.ok) {
        setError(result.error ?? "Could not add that item. Try again.");
        setOpen(true);
        return;
      }
      setNotice(`Added to cart. ${result.cart?.totalQuantity ?? 0} items.`);
      setOpen(true);
    });
  }, [configured]);

  const updateItem = useCallback((lineId: string, quantity: number) => {
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "qty", lineId, quantity });
      const result = await updateLine(lineId, quantity);
      if (result.cart) setCart(result.cart);
      else if (result.ok) setCart(null);
      if (!result.ok) setError(result.error ?? "Could not update the cart. Try again.");
    });
  }, [applyOptimistic]);

  const removeItem = useCallback((lineId: string) => {
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "remove", lineId });
      const result = await removeLine(lineId);
      if (result.cart) setCart(result.cart);
      else if (result.ok) setCart(null);
      if (!result.ok) setError(result.error ?? "Could not update the cart. Try again.");
    });
  }, [applyOptimistic]);

  const value: CartContextValue = {
    configured,
    cart: optimisticCart,
    isPending,
    notice,
    error,
    isOpen,
    openCart,
    closeCart,
    addItem,
    updateItem,
    removeItem,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      <span className="sr-only" aria-live="polite">{notice}</span>
    </CartContext.Provider>
  );
}

export function useShopifyCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useShopifyCart must be used inside ShopifyCartProvider");
  return value;
}
