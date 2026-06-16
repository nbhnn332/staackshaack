"use client";

import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#F8F9FA] border-t border-gray-100 text-gray-600 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 pb-12 border-b border-gray-200/55">
          {/* Brand Info */}
          <div className="flex flex-col space-y-4">
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Stack Shack<span className="text-[#4285F4]"> Nutrition</span>
            </span>
            <p className="text-sm text-gray-500 leading-relaxed">
              Premium sports nutrition, protein powders, and energy formulas designed to elevate your performance.
            </p>
            <div className="flex flex-col space-y-2 text-sm">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#4285F4]" />
                Thuvvur, Kerala, 679327
              </span>
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#4285F4]" />
                +91 70347 16006
              </span>
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#4285F4]" />
                stackshacknutrition@gmail.com
              </span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Shop Categories</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop?category=proteins" className="hover:text-[#4285F4] transition-colors">
                  Proteins
                </Link>
              </li>
              <li>
                <Link href="/shop?category=pre-workouts" className="hover:text-[#4285F4] transition-colors">
                  Pre-Workouts
                </Link>
              </li>
              <li>
                <Link href="/shop?category=vitamins" className="hover:text-[#4285F4] transition-colors">
                  Vitamins & Daily Health
                </Link>
              </li>
              <li>
                <Link href="/shop?category=snacks" className="hover:text-[#4285F4] transition-colors">
                  Healthy Snacks
                </Link>
              </li>
              <li>
                <Link href="/shop?category=creatine" className="hover:text-[#4285F4] transition-colors">
                  Creatine & Strength
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Help & Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/account" className="hover:text-[#4285F4] transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-[#4285F4] transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-[#4285F4] transition-colors">
                  Wishlist
                </Link>
              </li>
              <li>
                <span className="cursor-pointer hover:text-[#4285F4] transition-colors">
                  Shipping & Returns
                </span>
              </li>
              <li>
                <span className="cursor-pointer hover:text-[#4285F4] transition-colors">
                  FAQ
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Join our Newsletter</h4>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="w-full rounded-lg bg-white px-4 py-2 text-sm text-gray-800 outline-none border border-gray-200 focus:border-[#4285F4] transition-all"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-[#4285F4] hover:bg-[#3367D6] text-white py-2 text-sm font-semibold transition-all shadow-sm"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-xs text-gray-400">
          <span>&copy; {currentYear} Stack Shack Nutrition. All rights reserved.</span>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <span className="hover:underline cursor-pointer">Privacy Policy</span>
            <span className="hover:underline cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
