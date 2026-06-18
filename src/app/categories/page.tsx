"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { adminAddCategoryAction } from "@/app/actions";
import { Grid, Sparkles, FolderPlus, ArrowRight, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CategoriesPage() {
  const { categories, products, user, loading } = useStore();
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);
  const [catImgErrors, setCatImgErrors] = useState<Record<string, boolean>>({});

  // Sync state helpers
  const getProductCount = (categoryId: string) => {
    return products.filter((p) => p.categoryId === categoryId).length;
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setAddingCat(true);
    setAddError("");
    setAddSuccess(false);

    try {
      const slug = newCatName.toLowerCase().trim().replace(/\s+/g, "-");
      const res = await adminAddCategoryAction({ name: newCatName.trim(), slug, image: "/categories/placeholder.png" });
      if (res.success && res.category) {
        setNewCatName("");
        setAddSuccess(true);
        // Refresh page or trigger context re-fetch (we can do a simple page reload to pull fresh seeds)
        window.location.reload();
      } else {
        setAddError("Failed to add category.");
      }
    } catch (e) {
      setAddError("An error occurred.");
    } finally {
      setAddingCat(false);
    }
  };

  return (
    <div className="w-full bg-[#FFFFFF] min-h-screen py-8 mb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
              <Grid className="h-7 w-7 text-[#4285F4]" />
              Shop by Category
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Select a category to view high-performance sports formulas.
            </p>
          </div>
        </div>

        {/* Categories Grid list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#4285F4]" />
            <span className="mt-3 text-sm font-medium">Loading categories...</span>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const count = getProductCount(category.id);
              
              // Custom category visual styling
              let catStyles = "from-blue-500 to-indigo-600 border-blue-100 text-blue-600 bg-blue-50/45";
              if (category.name === "Pre-Workouts") {
                catStyles = "from-red-500 to-orange-500 border-red-100 text-red-600 bg-red-50/45";
              } else if (category.name === "Vitamins") {
                catStyles = "from-teal-400 to-emerald-500 border-teal-100 text-teal-600 bg-teal-50/45";
              } else if (category.name === "Snacks") {
                catStyles = "from-amber-400 to-yellow-500 border-amber-100 text-amber-600 bg-amber-50/45";
              } else if (category.name === "Creatine") {
                catStyles = "from-purple-500 to-pink-500 border-purple-100 text-purple-600 bg-purple-50/45";
              }

              return (
                <Link
                  key={category.id}
                  href={`/shop?category=${category.slug}`}
                  className="group relative flex items-center justify-between p-6 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    {/* Circle icon */}
                    <div className="h-15 w-15 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform overflow-hidden relative border border-gray-200">
                      {category.image && !catImgErrors[category.id] ? (
                        <img 
                          src={category.image} 
                          alt={category.name}
                          className="w-full h-full object-contain p-0.1"
                          onError={() => setCatImgErrors(prev => ({ ...prev, [category.id]: true }))}
                        />
                      ) : (
                        <svg className="w-6 h-6" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {category.name === "Proteins" ? <path d="M6 3h12v18H6zM6 8h12M9 13h6M9 17h4" /> :
                           category.name === "Pre-Workouts" ? <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" /> :
                           category.name === "Vitamins" ? <path d="M12 2v20M2 12h20M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" /> :
                           category.name === "Snacks" ? <path d="M3 6h18v12H3zm4 4h10M7 14h6" /> :
                           category.name === "Creatine" ? <circle cx="12" cy="12" r="10" /> :
                           <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />}
                        </svg>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#4285F4] transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                        {count} {count === 1 ? "Product" : "Products"} available
                      </p>
                    </div>
                  </div>

                  <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#4285F4] group-hover:text-white transition-all">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ADMIN CATEGORY CREATOR PORTAL */}
        {user?.role === "ADMIN" && (
          <div className="mt-16 bg-[#F8F9FA] rounded-2xl border border-gray-100 p-6 sm:p-8 max-w-lg">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-[#4285F4]" />
              Create Custom Category (Admin Only)
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Add new product categories dynamically. They will immediately reflect on the categories list and catalog filters.
            </p>

            <form onSubmit={handleAddCategory} className="mt-4 flex gap-3">
              <input
                type="text"
                required
                placeholder="Category name (e.g. Aminos)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 rounded-xl bg-white px-4 py-2 text-sm text-gray-800 outline-none border border-gray-200 focus:border-[#4285F4] transition-all"
              />
              <Button
                type="submit"
                disabled={addingCat}
                className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-semibold"
              >
                {addingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Category"}
              </Button>
            </form>

            {addError && <p className="text-xs text-red-500 mt-2 font-medium">{addError}</p>}
            {addSuccess && <p className="text-xs text-emerald-500 mt-2 font-medium">Category added successfully! Page reloading...</p>}
          </div>
        )}
      </div>
    </div>
  );
}
