"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import ProductCard from "@/components/ui/ProductCard";
import { ArrowDownWideNarrow, Filter, Search, SlidersHorizontal, PackageX, Check, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

function ShopContent() {
  const { products, categories, loading, refreshCatalog } = useStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Route query states
  const activeCategory = searchParams.get("category") || "";
  const initialQuery = searchParams.get("q") || "";

  // Local filter states
  const [searchVal, setSearchVal] = useState(initialQuery);
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState<number>(15000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4); // Load more starts at 4, increments by 4
  const [isFiltering, setIsFiltering] = useState(false);

  // Sync initial query
  useEffect(() => {
    setSearchVal(initialQuery);
  }, [initialQuery]);

  // Refresh catalog on mount
  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  // Handle category chip selection
  const handleCategorySelect = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === "") {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    router.push(`/shop?${params.toString()}`);
    setVisibleCount(4); // Reset pagination on filter change
  };

  // Handle search input trigger
  const handleSearch = (val: string) => {
    setSearchVal(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val.trim() === "") {
      params.delete("q");
    } else {
      params.set("q", val);
    }
    router.push(`/shop?${params.toString()}`);
    setVisibleCount(4); // Reset pagination
  };

  // Filter and sort products
  let filtered = [...products];

  // Category filter
  if (activeCategory) {
    const cat = categories.find((c) => c.slug === activeCategory);
    if (cat) {
      filtered = filtered.filter((p) => p.categoryId === cat.id);
    }
  }

  // Text query filter
  if (searchVal.trim()) {
    const q = searchVal.toLowerCase();
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }

  // Price range filter
  filtered = filtered.filter((p) => p.price <= priceRange);

  // In-stock availability filter
  if (inStockOnly) {
    filtered = filtered.filter((p) => p.stock > 0);
  }

  // Sorting
  if (sortBy === "price-asc") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy === "name-asc") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "bestseller") {
    filtered.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
  }

  const hasMore = filtered.length > visibleCount;
  const paginatedProducts = filtered.slice(0, visibleCount);

  const handleLoadMore = () => {
    setIsFiltering(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 4);
      setIsFiltering(false);
    }, 600);
  };

  return (
    <div className="w-full bg-[#FFFFFF] min-h-screen">
      {/* STICKY SEARCH & FILTER HEADER */}
      <div className="sticky top-16 z-30 w-full bg-white border-b border-gray-100 py-3 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search supplement inventory..."
              value={searchVal}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-xl bg-[#F8F9FA] px-4 py-2.5 pl-10 text-sm text-gray-800 outline-none border border-transparent focus:border-[#4285F4] focus:bg-white transition-all"
            />
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-gray-400" />
          </div>

          {/* Filter Trigger Button */}
          <Sheet>
            <SheetTrigger render={
              <Button variant="outline" className="rounded-xl border-gray-200 px-3.5 py-5 hover:bg-[#F8F9FA] flex gap-2">
                <SlidersHorizontal className="h-4.5 w-4.5 text-gray-500" />
                <span className="hidden sm:inline text-xs font-semibold text-gray-700">Filter</span>
              </Button>
            } />
            <SheetContent side="right" className="w-[300px] sm:w-[400px] rounded-l-2xl">
              <SheetHeader>
                <SheetTitle className="text-lg font-bold text-gray-900">Filters</SheetTitle>
                <SheetDescription className="text-xs text-gray-500">
                  Refine product listings by price, stock, and sorting criteria.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-8 space-y-6">
                {/* Sort Criteria */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Sort By</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: "Default", value: "default" },
                      { label: "Price: Low to High", value: "price-asc" },
                      { label: "Price: High to Low", value: "price-desc" },
                      { label: "Alphabetical", value: "name-asc" },
                      { label: "Best Sellers First", value: "bestseller" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setSortBy(item.value)}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm transition-all ${
                          sortBy === item.value
                            ? "border-[#4285F4] bg-blue-50/50 text-[#4285F4] font-semibold"
                            : "border-gray-100 hover:border-gray-200 text-gray-600"
                        }`}
                      >
                        {item.label}
                        {sortBy === item.value && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                    Max Price: <span className="text-gray-900">{formatINR(priceRange)}</span>
                  </h4>
                  <input
                    type="range"
                    min="100"
                    max="15000"
                    step="100"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#4285F4]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
                    <span>{formatINR(100)}</span>
                    <span>{formatINR(15000)}</span>
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">In Stock Only</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Hide currently unavailable items</p>
                  </div>
                  <button
                    onClick={() => setInStockOnly(!inStockOnly)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      inStockOnly ? "bg-[#4285F4]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        inStockOnly ? "translate-x-5" : "translate-x-0"
                      }`}
                    ></span>
                  </button>
                </div>

                {/* Reset button */}
                <Button
                  variant="outline"
                  onClick={() => {
                    setSortBy("default");
                    setPriceRange(15000);
                    setInStockOnly(false);
                    router.push("/shop");
                  }}
                  className="w-full mt-8 rounded-xl border-gray-200"
                >
                  Reset All Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* CATEGORY CHIPS SCROLLER */}
      <div className="w-full bg-[#FFFFFF] py-4 overflow-x-auto no-scrollbar border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex space-x-2.5">
          <button
            onClick={() => handleCategorySelect("")}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              activeCategory === ""
                ? "bg-[#4285F4] text-white border-transparent shadow-sm"
                : "bg-[#F8F9FA] text-gray-600 border-transparent hover:bg-gray-100"
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.slug)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                activeCategory === cat.slug
                  ? "bg-[#4285F4] text-white border-transparent shadow-sm"
                  : "bg-[#F8F9FA] text-gray-600 border-transparent hover:bg-gray-100"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* CATALOG GRID */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 mb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#4285F4]" />
            <span className="mt-3 text-sm font-medium">Loading supplements catalog...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm font-semibold text-gray-500">No products found matching your filters.</p>
            <button
              onClick={() => {
                setSearchVal("");
                handleCategorySelect("");
                setPriceRange(15000);
                setInStockOnly(false);
              }}
              className="mt-4 text-xs font-bold text-[#4285F4] hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-12 flex justify-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={isFiltering}
                  className="rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold px-8 py-6 flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {isFiltering ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#4285F4]" />
                      <span>Loading products...</span>
                    </>
                  ) : (
                    <span>Load More</span>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin text-[#4285F4]" />
          <span className="mt-3 text-sm font-medium">Loading catalog...</span>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
