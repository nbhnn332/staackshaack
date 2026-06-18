"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { getBannersAction } from "@/app/actions";
import ProductCard from "@/components/ui/ProductCard";
import { Truck, ShieldCheck, Zap, ArrowRight, Sparkles, Flame, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { products, categories, loading, refreshCatalog } = useStore();
  const [banners, setBanners] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const [catImgErrors, setCatImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadBanners() {
      try {
        const activeBanners = await getBannersAction(true);
        setBanners(Array.isArray(activeBanners) ? activeBanners : []);
      } catch (e) {
        console.error("Failed to load banners:", e);
      }
    }
    loadBanners();
    refreshCatalog();
  }, [refreshCatalog]);

  const defaultSlides = [
    {
      title: "Fuel Your Performance",
      subtitle: "PREMIUM SPORTS SUPPLEMENTS",
      description: "Get the energy, endurance, and power you need to smash your personal records.",
      cta: "Shop Pre-Workouts",
      link: "/shop?category=pre-workouts",
      image: "/products/pre-workout-blue.png",
      gradient: "from-blue-600 to-indigo-700",
      graphic: (
        <div className="relative md:absolute right-0 md:right-10 bottom-0 top-0 flex items-center justify-center w-full md:w-1/3 flex-1 overflow-hidden z-0 pb-4 md:pb-0">
          <div className="relative w-40 h-40 md:w-72 md:h-72 rounded-full bg-white/10 blur-3xl animate-pulse"></div>
          <svg className="w-32 h-32 md:w-56 md:h-56 text-white/90 drop-shadow-lg absolute animate-bounce" style={{ animationDuration: "3s" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
          </svg>
        </div>
      )
    },
    {
      title: "Premium Whey & Vegan Proteins",
      subtitle: "BUILD & RECOVER FAST",
      description: "24g of pure high-quality protein per scoop to support lean muscle development.",
      cta: "Explore Proteins",
      link: "/shop?category=proteins",
      image: "/products/whey-chocolate.png",
      gradient: "from-[#4285F4] to-blue-700",
      graphic: (
        <div className="relative md:absolute right-0 md:right-10 bottom-0 top-0 flex items-center justify-center w-full md:w-1/3 flex-1 overflow-hidden z-0 pb-4 md:pb-0">
          <div className="relative w-40 h-40 md:w-72 md:h-72 rounded-full bg-white/10 blur-3xl"></div>
          <svg className="w-32 h-32 md:w-56 md:h-56 text-white/90 drop-shadow-lg absolute" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="6" y="3" width="12" height="18" rx="2" fill="white" fillOpacity="0.1" />
            <path d="M6 8h12M9 13h6M9 17h4" strokeLinecap="round" />
          </svg>
        </div>
      )
    },
    {
      title: "Explosive Strength & Power",
      subtitle: "100% PURE CREATINE",
      description: "Increase athletic output, size, and strength with micro-pure creatine monohydrate.",
      cta: "Shop Creatine",
      link: "/shop?category=creatine",
      image: "/products/creatine.png",
      gradient: "from-indigo-600 to-blue-800",
      graphic: (
        <div className="relative md:absolute right-0 md:right-10 bottom-0 top-0 flex items-center justify-center w-full md:w-1/3 flex-1 overflow-hidden z-0 pb-4 md:pb-0">
          <div className="relative w-40 h-40 md:w-72 md:h-72 rounded-full bg-white/10 blur-3xl animate-pulse"></div>
          <svg className="w-32 h-32 md:w-56 md:h-56 text-white/90 drop-shadow-lg absolute" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="12" cy="12" r="10" fill="white" fillOpacity="0.1" />
            <path d="M8 12h8M12 8v8" strokeLinecap="round" />
          </svg>
        </div>
      )
    }
  ];

  const activeSlides = Array.isArray(banners) && banners.length > 0
    ? banners.map((b, i) => ({
        title: b.title,
        subtitle: b.subtitle || "PROMOTIONAL OFFER",
        description: b.description || "",
        cta: "Explore Offer",
        link: b.link || "/shop",
        image: b.image,
        mobileImage: b.mobileImage,
        gradient: i % 3 === 0 
          ? "from-blue-600 to-indigo-700" 
          : i % 3 === 1 
            ? "from-[#4285F4] to-blue-700" 
            : "from-indigo-600 to-blue-800",
        graphic: null
      }))
    : defaultSlides;

  // Auto slide banner
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const featured = products.filter((p) => p.isFeatured);
  const bestSellers = products.filter((p) => p.isBestSeller);
  const newArrivals = products.filter((p) => p.isNewArrival);

  return (
    <div className="w-full bg-white">
      {/* 1. HERO SLIDING BANNER */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        <div className="relative h-[360px] sm:h-[420px] w-full overflow-hidden rounded-[32px] shadow-sm">
          {activeSlides.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <div
                key={index}
                className={`absolute inset-0 w-full h-full bg-gradient-to-r ${
                  slide.gradient
                } flex flex-col md:flex-row items-center md:items-center justify-start transition-all duration-700 ease-in-out ${
                  isActive ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12 pointer-events-none"
                }`}
              >
                {/* Background Grid Accent */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:20px_20px] rounded-[32px] z-10 pointer-events-none"></div>

                {/* If it's an admin-uploaded image (no graphic, but has image), render as full-bleed background */}
                {!slide.graphic && slide.image && !imgErrors[index] && (
                  <div className="absolute inset-0 w-full h-full z-0">
                    <picture className="w-full h-full">
                      <source media="(min-width: 768px)" srcSet={slide.image} />
                      <img
                        src={slide.mobileImage || slide.image}
                        alt={slide.title || "Banner"}
                        className="w-full h-full object-cover"
                        onError={() =>
                          setImgErrors((prev) => ({ ...prev, [index]: true }))
                        }
                      />
                    </picture>
                    {/* Readability gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/13 to-transparent md:block hidden"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/13 to-black/30 md:hidden block"></div>
                  </div>
                )}

                {/* Banner Content */}
                <div className="relative z-20 w-full md:w-1/2 px-4 pt-8 pb-2 md:py-0 sm:px-12 md:px-16 text-white text-center md:text-left flex flex-col items-center md:items-start shrink-0">
                  <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full mb-2 md:mb-0 md:mt-0">
                    {slide.subtitle}
                  </span>
                  <h1 className="mt-2 md:mt-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                    {slide.title}
                  </h1>
                  <p className="mt-2 md:mt-4 text-xs sm:text-sm md:text-lg text-white/80 leading-relaxed font-light px-2 md:px-0 max-w-sm md:max-w-none mx-auto md:mx-0">
                    {slide.description}
                  </p>
                  <div className="mt-4 md:mt-8">
                    <Link href={slide.link}>
                      <Button className="rounded-full bg-white text-blue-600 font-bold hover:bg-gray-100 px-6 py-4 md:py-5 shadow-md transition-all hover:scale-105 active:scale-95 text-xs md:text-sm">
                        {slide.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Vector illustration overlay or Fallback Graphic */}
                {slide.graphic ? (
                  slide.graphic
                ) : slide.image && !imgErrors[index] ? (
                  null // Already rendered as background overlay
                ) : (
                  /* Fallback: decorative SVG illustration when no image or image fails */
                  <div className="relative md:absolute right-0 md:right-10 bottom-0 top-0 flex items-center justify-center w-full md:w-1/3 flex-1 overflow-hidden z-0 pb-4 md:pb-0">
                    <div className="relative w-40 h-40 md:w-72 md:h-72 rounded-full bg-white/10 blur-3xl animate-pulse"></div>
                    <svg className="w-32 h-32 md:w-56 md:h-56 text-white/90 drop-shadow-lg absolute animate-bounce" style={{ animationDuration: "3s" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}

          {/* Slider dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2.5 z-20">
            {activeSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentSlide ? "w-8 bg-white" : "w-2.5 bg-white/40"
                }`}
              ></button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. FREE SHIPPING & MARKETING BAR */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-2xl bg-[#F8F9FA] p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#4285F4]">
              <Truck className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Free Shipping</h3>
              <p className="text-xs text-gray-500 mt-0.5">Free standard shipping on all orders over ₹500</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#4285F4]">
              <ShieldCheck className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Premium Guarantee</h3>
              <p className="text-xs text-gray-500 mt-0.5">100% lab-tested, pure sports supplements</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#4285F4]">
              <Zap className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Immediate Results</h3>
              <p className="text-xs text-gray-500 mt-0.5">Formulas created to enhance physical capacity fast</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHOP BY CATEGORY */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#4285F4] fill-current" />
            Shop by Category
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((category) => {
            // Pick a matching color scheme for Category Circles
            let catColor = "bg-transparent";
            if (category.name === "Pre-Workouts") catColor = "bg-transparent";
            else if (category.name === "Vitamins") catColor = "bg-transparent";
            else if (category.name === "Snacks") catColor = "bg-transparent";
            else if (category.name === "Creatine") catColor = "bg-transparent";

            return (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="group flex flex-col items-center p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all w-full h-full outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
              >
                <div className={`h-16 w-16 rounded-full ${catColor} flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative shrink-0`}>
                  {category.image && !catImgErrors[category.id] ? (
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-contain"
                      onError={() => setCatImgErrors(prev => ({ ...prev, [category.id]: true }))}
                    />
                  ) : (
                    <svg className="w-8 h-8" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {category.name === "Proteins" ? <path d="M6 3h12v18H6zM6 8h12M9 13h6M9 17h4" /> :
                       category.name === "Pre-Workouts" ? <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" /> :
                       category.name === "Vitamins" ? <path d="M12 2v20M2 12h20M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" /> :
                       category.name === "Snacks" ? <path d="M3 6h18v12H3zm4 4h10M7 14h6" /> :
                       category.name === "Creatine" ? <circle cx="12" cy="12" r="10" /> :
                       <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />}
                    </svg>
                  )}
                </div>
                <span className="mt-3 text-sm font-semibold text-gray-800 group-hover:text-[#4285F4] transition-colors">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. BEST SELLERS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Flame className="h-5 w-5 text-red-500 fill-current" />
            Best Sellers
          </h2>
          <Link href="/shop" className="text-sm font-bold text-[#4285F4] hover:text-[#3367D6] flex items-center gap-1">
            See All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 flex justify-center py-12 text-gray-400">Loading catalog...</div>
        ) : (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {bestSellers.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. NEW ARRIVALS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            New Arrivals
          </h2>
          <Link href="/shop" className="text-sm font-bold text-[#4285F4] hover:text-[#3367D6] flex items-center gap-1">
            See All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 flex justify-center py-12 text-gray-400">Loading catalog...</div>
        ) : (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {newArrivals.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 6. FEATURED PRODUCTS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16 mb-20">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500 fill-current" />
            Featured Products
          </h2>
          <Link href="/shop" className="text-sm font-bold text-[#4285F4] hover:text-[#3367D6] flex items-center gap-1">
            See All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 flex justify-center py-12 text-gray-400">Loading catalog...</div>
        ) : (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
