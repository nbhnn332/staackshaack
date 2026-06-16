"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { Heart, Trash2, ShoppingBag, ArrowRight, LogIn } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const { wishlist, moveAllWishlistToCart, toggleWishlist, addToCart, user, loading } = useStore();

  const handleRemove = async (productId: string) => {
    await toggleWishlist(productId);
  };

  const handleAddToCart = async (productId: string) => {
    await addToCart(productId, 1);
    await toggleWishlist(productId); // Remove from wishlist after adding to cart
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center flex flex-col items-center">
        <div className="h-16 w-16 rounded-full bg-blue-50 text-[#4285F4] flex items-center justify-center mb-6">
          <Heart className="h-8 w-8 stroke-[1.5]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Your Wishlist</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-xs leading-relaxed">
          Please sign in to save products, build your workout stack, and sync items across your devices.
        </p>
        <Link href="/auth/login" className="mt-6 w-full">
          <Button className="w-full rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white py-5 flex items-center justify-center gap-2">
            <LogIn className="h-4.5 w-4.5" />
            <span>Sign In to Account</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FFFFFF] min-h-screen py-8 mb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
              <Heart className="h-7 w-7 text-[#4285F4] fill-[#4285F4]" />
              My Wishlist
            </h1>
            <p>‎ </p>
            <p className="text-sm text-gray-500 mt-1">
              You have <span className="font-semibold text-gray-800">{wishlist.length}</span> items saved in your collection.
            </p>
          </div>

          {wishlist.length > 0 && (
            <Button
              onClick={async () => {
                for (const item of wishlist) {
                  await toggleWishlist(item.product.id);
                }
              }}
              className="mt-4 sm:mt-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-5 shadow-xs"
            >
              Remove All
            </Button>
          )}
        </div>

        {/* Wishlist Items List */}
        {wishlist.length === 0 ? (
          <div className="text-center py-24 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 mt-8">
            <Heart className="mx-auto h-12 w-12 text-gray-300 stroke-[1]" />
            <p className="mt-4 text-sm font-semibold text-gray-500">Your wishlist is currently empty.</p>
            <p className="text-xs text-gray-400 mt-1">Explore our shop to add premium supplements to your wishlist.</p>
            <Link href="/shop" className="mt-6 inline-block">
              <Button className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs font-bold px-5">
                Go to Shop
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {wishlist.map((item) => {
              const p = item.product;

              // Helper to draw graphics
              const drawIcon = (name: string) => {
                let grad = "from-blue-500 to-indigo-600";
                if (name.includes("Pre-Workout")) grad = "from-red-500 to-orange-500";
                else if (name.includes("Vitamin")) grad = "from-teal-400 to-emerald-500";
                else if (name.includes("Bars")) grad = "from-amber-500 to-yellow-600";
                else if (name.includes("Creatine")) grad = "from-purple-600 to-pink-500";

                return (
                  <div className={`h-full w-full bg-gradient-to-br ${grad} flex items-center justify-center relative`}>
                    <svg className="w-10 h-10 text-white/95" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      {name.includes("Protein") && <rect x="6" y="3" width="12" height="18" rx="2" />}
                      {name.includes("Pre-Workout") && <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />}
                      {name.includes("Vitamin") && <path d="M12 2C6.4 2 2 6.4 2 12s4.4 10 10 10 10-4.4 10-10S17.6 2 12 2zm0 6v8M8 12h8" />}
                      {name.includes("Bars") && <rect x="3" y="6" width="18" height="12" rx="2" />}
                      {name.includes("Creatine") && <circle cx="12" cy="12" r="10" />}
                    </svg>
                  </div>
                );
              };

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 transition-all duration-300 hover:shadow-md hover:border-gray-200"
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="h-20 w-20 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                      <img
                        src={p.images?.[0] || "/placeholder.png"}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Title & Info */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {p.name.includes("Protein") ? "Proteins" : p.name.includes("Pre-Workout") ? "Pre-Workouts" : p.name.includes("Vitamin") ? "Vitamins" : p.name.includes("Bars") ? "Snacks" : "Creatine"}
                      </span>
                      <Link href={`/shop/${p.slug}`} className="block mt-0.5">
                        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-snug hover:text-[#4285F4] transition-colors">
                          {p.name}
                        </h3>
                      </Link>
                      <span className="text-sm font-extrabold text-gray-900 block mt-1.5">
                        {formatINR(p.price)}
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleRemove(p.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>

                    <Link
                      href={`/shop/${p.slug}`}
                      className="flex-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#4285F4] font-bold text-xs py-4 flex items-center justify-center gap-1.5 shadow-none border border-transparent"
                    >
                      <ArrowRight className="h-4.5 w-4.5" />
                      <span>View Product</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
