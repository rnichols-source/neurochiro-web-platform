"use client";

import { useEffect, useState } from "react";
import { Package, ExternalLink, Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  image_url: string | null;
  link_url: string | null;
}

export default function VendorProducts({ vendorId }: { vendorId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vendor-products?vendorId=${vendorId}`)
      .then(r => r.json())
      .then(d => { setProducts(d.products || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [vendorId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-black text-neuro-navy mb-4">Featured Products</h2>
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <Package className="w-5 h-5 text-neuro-orange" />
        <h2 className="text-lg font-black text-neuro-navy">Featured Products</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all">
            {product.image_url && (
              <div className="aspect-video bg-white flex items-center justify-center p-4">
                <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain" />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-bold text-neuro-navy text-sm">{product.name}</h3>
              {product.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
              )}
              <div className="flex items-center justify-between mt-3">
                {product.price && (
                  <span className="text-sm font-black text-neuro-orange">{product.price}</span>
                )}
                {product.link_url && (
                  <a href={product.link_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-neuro-navy hover:text-neuro-orange transition-colors flex items-center gap-1">
                    Learn More <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
