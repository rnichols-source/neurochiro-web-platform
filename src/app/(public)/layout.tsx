import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import { CartProvider } from "./store/cart-context";
import { CartDrawer } from "./store/cart-drawer";
import LiveActivityTicker from "@/components/common/LiveActivityTicker";
import ActivityTracker from "@/components/common/ActivityTracker";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <LiveActivityTicker />
      <Navbar />
      <div className="min-h-dvh">
        {children}
      </div>
      <CartDrawer />
      <Suspense fallback={null}>
        <ActivityTracker />
      </Suspense>
    </CartProvider>
  );
}
