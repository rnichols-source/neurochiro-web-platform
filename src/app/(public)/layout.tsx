import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import { ShopifyCartProvider } from "@/components/store/ShopifyCartProvider";
import { CartDrawer } from "@/components/store/CartDrawer";
import ActivityTracker from "@/components/common/ActivityTracker";
import FrenchSuggestion from "@/components/i18n/FrenchSuggestion";
import { doctorJoinCtaLabel, doctorJoinMenuLabel } from "@/lib/applications/flag";
import { isShopifyConfigured } from "@/lib/shopify";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShopifyCartProvider configured={isShopifyConfigured()}>
      <Navbar joinCtaLabel={doctorJoinCtaLabel()} joinMenuLabel={doctorJoinMenuLabel()} />
      <Suspense fallback={null}>
        <FrenchSuggestion />
      </Suspense>
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
