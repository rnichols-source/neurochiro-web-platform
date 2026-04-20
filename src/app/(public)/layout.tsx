import Navbar from "@/components/layout/Navbar";
import { CartProvider } from "./store/cart-context";
import { CartDrawer } from "./store/cart-drawer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <Navbar />
      <div className="min-h-dvh">
        {children}
      </div>
      <CartDrawer />
    </CartProvider>
  );
}
