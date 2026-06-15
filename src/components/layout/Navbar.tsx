"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { Search, Heart, ShoppingBag, User, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, cartCount, wishlistCount, logout } = useStore();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "Categories", href: "/categories" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Branding */}
        <div className="flex items-center gap-4 lg:gap-8 shrink-0">
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <span className="text-lg lg:text-xl font-bold tracking-tight text-gray-900 whitespace-nowrap">
              Stack Shack<span className="text-[#4285F4]"> Nutrition</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-4 lg:space-x-6 shrink-0">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-[#4285F4] ${
                    isActive ? "text-[#4285F4]" : "text-gray-600"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Search Bar - Desktop */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex max-w-xs lg:max-w-md flex-1 mx-4 lg:mx-8 relative"
        >
          <input
            type="text"
            placeholder="Search supplements, proteins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full bg-[#F8F9FA] px-4 py-2 pl-10 text-sm text-gray-800 outline-none border border-transparent focus:border-[#4285F4] focus:bg-white transition-all"
          />
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-gray-400" />
        </form>

        {/* Action icons */}
        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
          {/* Wishlist */}
          <Link href="/wishlist" className="relative p-2 text-gray-600 hover:text-[#4285F4] transition-colors">
            <Heart className="h-6 w-6" />
            {wishlistCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#4285F4] text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link href="/cart" className="relative p-2 text-gray-600 hover:text-[#4285F4] transition-colors">
            <ShoppingBag className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#4285F4] text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Account / Login */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/account"
                className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#4285F4] transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-[#4285F4]">
                  <User className="h-4.5 w-4.5" />
                </div>
                <span className="max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
              </Link>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-[#4285F4] transition-colors"
                title="Log out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link href="/auth/login">
              <Button size="sm" className="rounded-full bg-[#4285F4] hover:bg-[#3367D6] text-white">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
