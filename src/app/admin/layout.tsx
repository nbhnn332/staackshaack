"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Grid,
  Image as ImageIcon,
  Ticket,
  ClipboardList,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Loader2,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "ADMIN") {
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
      }
    }
  }, [user, loading]);

  if (loading || isAdmin === null) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-50 text-gray-400">
        <Loader2 className="h-10 w-10 animate-spin text-[#4285F4]" />
        <span className="mt-3 text-sm font-semibold">Verifying credentials...</span>
      </div>
    );
  }

  // Access Denied screen
  if (!isAdmin) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="h-16 w-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">
          This section is restricted to Stack Shack administrators. Please sign in with an administrative email.
        </p>
        <div className="mt-6 flex gap-4">
          <Link href="/auth/login">
            <Button className="rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white">
              Sign In
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="rounded-xl border-gray-200">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: ShoppingBag },
    { name: "Categories", href: "/admin/categories", icon: Grid },
    { name: "Home Banners", href: "/admin/banners", icon: ImageIcon },
    { name: "Coupons", href: "/admin/coupons", icon: Ticket },
    { name: "Orders", href: "/admin/orders", icon: ClipboardList },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Settings", href: "/admin/settings", icon: SettingsIcon },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between bg-white border-r border-gray-100 p-4">
      <div className="space-y-6">
        <Link href="/admin" className="flex items-center space-x-2 px-3 py-1 mt-2">
          <span className="text-lg font-black tracking-tight text-gray-900">
            SHACK<span className="text-[#4285F4]"> ADMIN</span>
          </span>
        </Link>
        
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  isSelected
                    ? "bg-blue-50 text-[#4285F4]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-3">
        <div className="flex items-center gap-3 px-3">
          <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-[#4285F4] font-bold">
            A
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-800 truncate">{user?.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-xl text-red-500 hover:bg-red-50 transition-all cursor-pointer border border-transparent"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-[#1F2937]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)}></div>
          <aside className="relative w-64 max-w-xs h-full animate-slide-in">
            <SidebarContent />
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-4 top-4 p-2 text-gray-500 hover:text-gray-900 bg-gray-50 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </aside>
        </div>
      )}

      {/* Page Content Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Navbar header */}
        <header className="md:hidden flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 shrink-0">
          <span className="text-sm font-black text-gray-900 tracking-wider">
            SHACK<span className="text-[#4285F4]"> ADMIN</span>
          </span>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:text-[#4285F4] rounded-lg bg-gray-50"
          >
            <Menu className="h-5.5 w-5.5" />
          </button>
        </header>

        {/* Content Shell */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
