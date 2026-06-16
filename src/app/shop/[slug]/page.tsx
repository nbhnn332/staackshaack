"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { ArrowLeft, ShoppingBag, Heart, Star, Truck, ShieldCheck, RefreshCw, Loader2, ArrowRight, Box } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ui/ProductCard";
import { getVariantsByProductAction } from "@/app/actions";
import { ProductVariant } from "@/lib/mock-db";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { products, addToCart, toggleWishlist, isInWishlist, loading } = useStore();
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<string>("");
  const [selectedFlavour, setSelectedFlavour] = useState<string>("");
  const [variantsLoading, setVariantsLoading] = useState(true);

  const product = products.find((p) => p.slug === resolvedParams.slug);

  // Load variants when product is found
  useEffect(() => {
    if (!product) return;
    setVariantsLoading(true);
    getVariantsByProductAction(product.id)
      .then((v) => {
        const active = v.filter((x) => x.isActive);
        setVariants(active);

        if (active.length > 0) {
          // Pre-select first available (in-stock) variant
          const firstInStock = active.find((x) => x.stock > 0) || active[0];
          setSelectedWeight(firstInStock.weightLabel);
          setSelectedFlavour(firstInStock.flavourLabel);
          setSelectedVariant(firstInStock);
        }
      })
      .catch(console.error)
      .finally(() => setVariantsLoading(false));
  }, [product?.id]);

  // When weight or flavour changes, find the matching variant
  useEffect(() => {
    if (variants.length === 0) return;
    const match = variants.find(
      (v) => v.weightLabel === selectedWeight && v.flavourLabel === selectedFlavour
    );
    setSelectedVariant(match || null);
  }, [selectedWeight, selectedFlavour, variants]);

  if (loading || variantsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#4285F4]" />
        <span className="mt-3 text-sm font-medium">Loading product details...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center flex flex-col items-center">
        <h2 className="text-xl font-bold text-gray-900">Product Not Found</h2>
        <p className="text-sm text-gray-500 mt-2">
          The requested sports supplement does not exist in our catalog.
        </p>
        <Link href="/shop" className="mt-6">
          <Button className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white">
            Return to Shop
          </Button>
        </Link>
      </div>
    );
  }

  const hasVariants = variants.length > 0;

  // Derive display values from selected variant (or fall back to product base)
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentMrp = selectedVariant ? (selectedVariant.mrp ?? product.compareAtPrice) : product.compareAtPrice;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0 || (hasVariants && !selectedVariant);

  const discount = currentMrp
    ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100)
    : 0;

  // Derive unique option lists
  const uniqueWeights = [...new Set(variants.map((v) => v.weightLabel).filter(Boolean))];
  const uniqueFlavours = [...new Set(variants.map((v) => v.flavourLabel).filter(Boolean))];

  // Is a given weight selectable given the current flavour?
  const isWeightAvailable = (w: string) => {
    if (!selectedFlavour) return true;
    return variants.some((v) => v.weightLabel === w && v.flavourLabel === selectedFlavour && v.isActive);
  };

  // Is a given flavour selectable given the current weight?
  const isFlavourAvailable = (f: string) => {
    if (!selectedWeight) return true;
    return variants.some((v) => v.flavourLabel === f && v.weightLabel === selectedWeight && v.isActive);
  };

  const handleWeightSelect = (w: string) => {
    setSelectedWeight(w);
    // If current flavour doesn't exist for this weight, pick the first one that does
    const flavourStillValid = variants.some(
      (v) => v.weightLabel === w && v.flavourLabel === selectedFlavour && v.isActive
    );
    if (!flavourStillValid && uniqueFlavours.length > 0) {
      const firstValid = variants.find((v) => v.weightLabel === w && v.isActive);
      setSelectedFlavour(firstValid?.flavourLabel || "");
    }
  };

  const handleFlavourSelect = (f: string) => {
    setSelectedFlavour(f);
    const weightStillValid = variants.some(
      (v) => v.flavourLabel === f && v.weightLabel === selectedWeight && v.isActive
    );
    if (!weightStillValid && uniqueWeights.length > 0) {
      const firstValid = variants.find((v) => v.flavourLabel === f && v.isActive);
      setSelectedWeight(firstValid?.weightLabel || "");
    }
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setAdding(true);
    await addToCart(product.id, quantity, selectedVariant?.id || null);
    setAdding(false);
  };

  const handleToggleWishlist = async () => {
    await toggleWishlist(product.id);
  };

  const favorite = isInWishlist(product.id);

  const related = products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);

  const drawIcon = (name: string) => {
    let grad = "from-blue-500 to-indigo-600";
    if (name.includes("Pre-Workout")) grad = "from-red-500 to-orange-500";
    else if (name.includes("Vitamin")) grad = "from-teal-400 to-emerald-500";
    else if (name.includes("Bars")) grad = "from-amber-500 to-yellow-600";
    else if (name.includes("Creatine")) grad = "from-purple-600 to-pink-500";

    return (
      <div className={`h-full w-full bg-gradient-to-br ${grad} flex items-center justify-center relative`}>
        <svg className="w-32 h-32 text-white/95" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          {name.includes("Protein") && <rect x="6" y="3" width="12" height="18" rx="2" fill="currentColor" fillOpacity="0.1" />}
          {name.includes("Pre-Workout") && <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />}
          {name.includes("Vitamin") && <path d="M12 2C6.4 2 2 6.4 2 12s4.4 10 10 10 10-4.4 10-10S17.6 2 12 2zm0 6v8M8 12h8" />}
          {name.includes("Bars") && <rect x="3" y="6" width="18" height="12" rx="2" fill="currentColor" fillOpacity="0.1" />}
          {name.includes("Creatine") && <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />}
        </svg>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:18px_28px]"></div>
      </div>
    );
  };

  return (
    <div className="w-full bg-[#FFFFFF] min-h-screen py-8 mb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Back navigation */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#4285F4] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to products</span>
        </button>

        {/* Details Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* Left: Visual Jar Showcase */}
          <div className="relative aspect-square w-full overflow-hidden rounded-[32px] bg-gray-50 border border-gray-100 shadow-xs">
            {product.images && product.images.length > 0 && product.images[0] && !product.images[0].startsWith("data:") ? (
              <img
                src={product.images[0]}
                alt={product.name}
                width="600"
                height="600"
                className="w-full h-full object-cover"
              />
            ) : (
              drawIcon(product.name)
            )}

            {/* Badges */}
            <div className="absolute left-4 top-4 flex flex-col gap-1.5 z-10">
              {product.isBestSeller && (
                <span className="rounded-full bg-[#4285F4] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-xs">
                  Best Seller
                </span>
              )}
              {product.isNewArrival && (
                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-xs">
                  New Arrival
                </span>
              )}
              {discount > 0 && (
                <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-xs">
                  -{discount}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Right: Info & Selectors */}
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full self-start">
              {product.name.includes("Protein") ? "Proteins" : product.name.includes("Pre-Workout") ? "Pre-Workouts" : product.name.includes("Vitamin") ? "Vitamins" : product.name.includes("Bars") ? "Snacks" : "Creatine"}
            </span>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mt-2">
              {product.name}
            </h1>

            {/* Ratings stars */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-currentColor text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-500">(4.9 out of 5 stars)</span>
            </div>

            {/* Prices */}
            <div className="flex items-baseline gap-3.5 mt-6">
              <span className="text-3xl font-black text-gray-950">{formatINR(currentPrice)}</span>
              {currentMrp && currentMrp > currentPrice && (
                <span className="text-lg text-gray-400 line-through font-medium">
                  {formatINR(currentMrp)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Save {discount}%
                </span>
              )}
            </div>

            {/* ── WEIGHT SELECTOR ───────────────────── */}
            {hasVariants && uniqueWeights.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                  Size / Weight
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueWeights.map((w) => {
                    const available = isWeightAvailable(w);
                    const selected = selectedWeight === w;
                    return (
                      <button
                        key={w}
                        onClick={() => available && handleWeightSelect(w)}
                        disabled={!available}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-150 cursor-pointer
                          ${selected
                            ? "border-[#4285F4] bg-[#4285F4] text-white shadow-md shadow-blue-100"
                            : available
                              ? "border-gray-200 text-gray-700 hover:border-[#4285F4] hover:text-[#4285F4] bg-white"
                              : "border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed line-through"
                          }`}
                      >
                        {w}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── FLAVOUR SELECTOR ──────────────────── */}
            {hasVariants && uniqueFlavours.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                  Flavour
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueFlavours.map((f) => {
                    const available = isFlavourAvailable(f);
                    const selected = selectedFlavour === f;
                    return (
                      <button
                        key={f}
                        onClick={() => available && handleFlavourSelect(f)}
                        disabled={!available}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-150 cursor-pointer
                          ${selected
                            ? "border-[#4285F4] bg-[#4285F4] text-white shadow-md shadow-blue-100"
                            : available
                              ? "border-gray-200 text-gray-700 hover:border-[#4285F4] hover:text-[#4285F4] bg-white"
                              : "border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed line-through"
                          }`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <p className="text-sm text-gray-500 mt-6 leading-relaxed border-t border-b border-gray-100 py-6">
              {product.description}
            </p>

            {/* Stock status indicator */}
            <div className="flex items-center gap-2 mt-6">
              <span className={`h-2.5 w-2.5 rounded-full ${!isOutOfStock ? "bg-emerald-500" : "bg-red-500"}`}></span>
              <span className="text-xs font-semibold text-gray-700">
                {hasVariants && !selectedVariant
                  ? "Select a variant to check availability"
                  : !isOutOfStock
                    ? `${currentStock} items left in stock (Ready to ship)`
                    : "Temporarily Out of Stock"
                }
              </span>
            </div>

            {/* Cart checkout operations */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
              {/* Quantity select */}
              {!isOutOfStock && (
                <div className="flex items-center border border-gray-200 rounded-xl px-2.5 py-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <span className="text-lg font-bold">-</span>
                  </button>
                  <span className="text-sm font-bold text-gray-800 px-4">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <span className="text-lg font-bold">+</span>
                  </button>
                </div>
              )}

              {/* Add to Cart button */}
              <Button
                onClick={handleAddToCart}
                disabled={adding || isOutOfStock}
                className={`w-full sm:flex-1 rounded-xl py-6 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all
                  ${isOutOfStock
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-[#4285F4] hover:bg-[#3367D6] text-white"
                  }`}
              >
                {adding ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : isOutOfStock ? (
                  <span>Out of Stock</span>
                ) : (
                  <>
                    <ShoppingBag className="h-4.5 w-4.5" />
                    <span>Add to Stack</span>
                  </>
                )}
              </Button>

              {/* Wishlist toggle */}
              <button
                onClick={handleToggleWishlist}
                className={`flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all shrink-0 cursor-pointer ${
                  favorite ? "text-red-500 border-red-100 bg-red-50/20" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Heart className="h-5.5 w-5.5 stroke-[2]" fill={favorite ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Trust highlights */}
            <div className="mt-8 grid grid-cols-3 gap-2 border-t border-gray-100 pt-6 text-[10px] sm:text-xs text-gray-400 text-center">
              <div className="flex flex-col items-center">
                <Truck className="h-5 w-5 text-[#4285F4] mb-1" />
                <span>Free Ship &gt; ₹500</span>
              </div>
              <div className="flex flex-col items-center">
                <ShieldCheck className="h-5 w-5 text-[#4285F4] mb-1" />
                <span>100% Secure payment</span>
              </div>
              <div className="flex flex-col items-center">
                <Box className="h-5 w-5 text-[#4285F4] mb-1" />
                <span>Secure packaging</span>
              </div>
            </div>

          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {related.length > 0 && (
          <section className="mt-20">
            <div className="flex items-center justify-between border-t border-gray-100 pt-10">
              <h2 className="text-xl font-bold tracking-tight text-gray-900">Related Products</h2>
              <Link href="/shop" className="text-xs font-bold text-[#4285F4] hover:text-[#3367D6] flex items-center gap-1">
                View Shop <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
