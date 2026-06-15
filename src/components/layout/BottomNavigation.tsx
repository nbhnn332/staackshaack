"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { Home, Search, Heart, ShoppingBag, User } from "lucide-react";

export default function BottomNavigation() {
  const pathname = usePathname();
  const { cartCount, wishlistCount } = useStore();

  const tabs = [
    { name: "Home", href: "/", icon: Home },
    { name: "Shop", href: "/shop", icon: Search },
    { name: "Wishlist", href: "/wishlist", icon: Heart, badge: wishlistCount },
    { name: "Cart", href: "/cart", icon: ShoppingBag, badge: cartCount },
    { name: "Account", href: "/account", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 pb-safe backdrop-blur-md md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          // Active check: exact match, or if shop, match anything starting with /shop
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-1 text-center"
            >
              <div
                className={`relative flex items-center justify-center p-1.5 rounded-full transition-all duration-300 ${
                  isActive ? "text-[#4285F4]" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon className="h-5.5 w-5.5 stroke-[2]" />
                
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#4285F4] text-[9px] font-bold text-white ring-2 ring-white animate-scale-in">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold tracking-wide transition-colors ${
                  isActive ? "text-[#4285F4]" : "text-gray-400"
                }`}
              >
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
