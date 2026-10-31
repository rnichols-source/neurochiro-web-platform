import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import { ShopifyCartProvider } from "@/components/store/ShopifyCartProvider";
import { CartDrawer } from "@/components/store/CartDrawer";
import ActivityTracker from "@/components/common/ActivityTracker";
import { isShopifyConfigured } from "@/lib/shopify";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShopifyCartProvider configured={isShopifyConfigured()}>
      <Navbar />
      <div className="min-h-dvh">
        {children}
      </div>
      <CartDrawer />
      <Suspense fallback={null}>
        <ActivityTracker />
      </Suspense>
    </ShopifyCartProvider>
  );
}
