"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { formatINR } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    categoryId: string;
    isFeatured: boolean;
    isBestSeller: boolean;
    isNewArrival: boolean;
    stock: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useStore();
  const [loading, setLoading] = useState(false);
  
  const favorite = isInWishlist(product.id);
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    await addToCart(product.id, 1);
    setLoading(false);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(product.id);
  };

  // Supplement visual generator (SVG icons that look high fidelity for products instead of blank images)
  const renderProductGraphic = (name: string) => {
    let bgGradient = "from-blue-500 to-indigo-600";
    let svgGraphic = (
      <svg className="w-16 h-16 text-white/95" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );

    if (name.includes("Protein")) {
      bgGradient = "from-blue-600 to-sky-500";
      svgGraphic = (
        <svg className="w-16 h-16 text-white/95" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="6" y="3" width="12" height="18" rx="2" />
          <path d="M6 8h12M9 13h6M9 17h4" strokeLinecap="round" />
        </svg>
      );
    } else if (name.includes("Pre-Workout")) {
      bgGradient = "from-red-500 to-orange-500";
      svgGraphic = (
        <svg className="w-16 h-16 text-white/95" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" />
        </svg>
      );
    } else if (name.includes("Vitamin")) {
      bgGradient = "from-teal-400 to-emerald-500";
      svgGraphic = (
        <svg className="w-16 h-16 text-white/95" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 6v8M8 12h8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    } else if (name.includes("Bars")) {
      bgGradient = "from-amber-500 to-yellow-600";
      svgGraphic = (
        <svg className="w-16 h-16 text-white/95" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M7 10h10M7 14h6" strokeLinecap="round" />
        </svg>
      );
    } else if (name.includes("Creatine")) {
      bgGradient = "from-purple-600 to-pink-500";
      svgGraphic = (
        <svg className="w-16 h-16 text-white/95" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8M12 8v8" strokeLinecap="round" />
        </svg>
      );
    }

    return (
      <div className={`w-full h-full bg-gradient-to-br ${bgGradient} flex items-center justify-center relative`}>
        {svgGraphic}
        {/* Subtle grid lines for high fidelity e-commerce graphic */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0c_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0c_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      </div>
    );
  };

  const hasImage = product.images && product.images.length > 0 && product.images[0] && !product.images[0].startsWith("data:");

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-gray-200">
      {/* Whole card clickable link overlay */}
      <Link href={`/shop/${product.slug}`} className="absolute inset-0 z-0" aria-label={`View details of ${product.name}`} />

      {/* Product Image Area */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-50 z-0">
        {hasImage ? (
          <img
            src={product.images[0]}
            alt={product.name}
            width="400"
            height="400"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          renderProductGraphic(product.name)
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1 z-10 pointer-events-none">
          {product.isBestSeller && (
            <span className="rounded-full bg-[#4285F4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Best
            </span>
          )}
          {product.isNewArrival && (
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              New
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              -{discount}%
            </span>
          )}
        </div>

        {/* Wishlist Heart Action */}
        <button
          onClick={handleToggleWishlist}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 hover:scale-105 active:scale-95 transition-all text-gray-400 hover:text-[#4285F4]"
          style={{ color: favorite ? "#EF4444" : undefined }}
        >
          <Heart className="h-4.5 w-4.5 stroke-[2.5]" fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 mt-3 relative z-10 pointer-events-none">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          {product.name.includes("Protein") ? "Proteins" : product.name.includes("Pre-Workout") ? "Pre-Workouts" : product.name.includes("Vitamin") ? "Vitamins" : product.name.includes("Bars") ? "Snacks" : "Creatine"}
        </span>
        <div className="mt-1 block">
          <h3 className="line-clamp-2 h-10 text-sm font-semibold text-gray-800 group-hover:text-[#4285F4] transition-colors leading-snug">
            {product.name}
          </h3>
        </div>

        {/* Rating Mock */}
        <div className="flex items-center gap-1 mt-1">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-currentColor text-amber-400" />
            ))}
          </div>
          <span className="text-[10px] font-medium text-gray-400">(45)</span>
        </div>

        {/* Price & Add to Cart button */}
        <div className="mt-auto pt-3 flex items-center justify-between pointer-events-auto">
          <div className="flex flex-col">
            {product.compareAtPrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatINR(product.compareAtPrice)}
              </span>
            )}
            <span className="text-base font-bold text-gray-950">
              {formatINR(product.price)}
            </span>
          </div>


<Link href={`/shop/${product.slug}`}>
  <button
    className="h-9 px-1 rounded-full bg-[#4285F4] text-white text-xs font-semibold transition-all hover:bg-[#3367D6] active:scale-95 shadow-sm cursor-pointer"
  >
    View Product
  </button>
</Link>
        </div>
      </div>
    </div>
  );
}
