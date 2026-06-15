"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  getUserSession,
  loginAction,
  signupAction,
  logoutAction,
  updatePasswordAction,
  updateProfileAction,
  getCartAction,
  addToCartAction,
  updateCartItemAction,
  removeFromCartAction,
  clearCartAction,
  getWishlistAction,
  toggleWishlistAction,
  moveAllWishlistToCartAction,
  createOrderAction,
  getOrdersAction,
  getCategoriesAction,
  getProductsAction,
} from "@/app/actions";
import { Category, Product } from "@/lib/mock-db";
import { SessionUser } from "@/lib/auth";

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
}

interface StoreContextProps {
  user: SessionUser | null;
  cart: CartItem[];
  wishlist: WishlistItem[];
  categories: Category[];
  products: Product[];
  loading: boolean;
  cartCount: number;
  cartTotal: number;
  wishlistCount: number;
  refreshCart: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCartItem: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<{ success: boolean; error?: string }>;
  moveAllWishlistToCart: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: SessionUser }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; user?: SessionUser }>;
  logout: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (name: string) => Promise<{ success: boolean; error?: string }>;
  checkout: (data: { email: string; name: string; address: string; couponCode?: string; discount: number }) => Promise<{ success: boolean; error?: string }>;
  refreshCatalog: () => Promise<void>;
}

const StoreContext = createContext<StoreContextProps | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Computed values
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => {
    return total + item.product.price * item.quantity;
  }, 0);
  const wishlistCount = wishlist.length;

  // Sync initial state
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        // Get user session
        const session = await getUserSession();
        setUser(session);

        // Fetch categories and products
        const [cats, prods] = await Promise.all([
          getCategoriesAction(),
          getProductsAction(),
        ]);
        setCategories(Array.isArray(cats) ? cats : []);
        setProducts(Array.isArray(prods) ? prods : []);

        // Fetch cart
        const cartData = await getCartAction();
        setCart(cartData.items as any);

        // Fetch wishlist if logged in
        if (session) {
          const wishData = await getWishlistAction();
          setWishlist(wishData.items as any);
        }
      } catch (e) {
        console.error("Failed to initialize Store Provider:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const refreshCart = async () => {
    const cartData = await getCartAction();
    setCart(cartData.items as any);
  };

  const refreshWishlist = async () => {
    const session = await getUserSession();
    if (session) {
      const wishData = await getWishlistAction();
      setWishlist(wishData.items as any);
    } else {
      setWishlist([]);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    setLoading(true);
    try {
      const cartData = await addToCartAction(productId, quantity);
      setCart(cartData.items as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (cartItemId: string, quantity: number) => {
    setLoading(true);
    try {
      const cartData = await updateCartItemAction(cartItemId, quantity);
      setCart(cartData.items as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    setLoading(true);
    try {
      const cartData = await removeFromCartAction(cartItemId);
      setCart(cartData.items as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      const cartData = await clearCartAction();
      setCart(cartData.items as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      return { success: false, error: "Please log in to add items to your wishlist." };
    }
    setLoading(true);
    try {
      const res = await toggleWishlistAction(productId);
      if (res.success && res.wishlist) {
        setWishlist(res.wishlist.items as any);
        return { success: true };
      }
      return { success: false, error: res.error || "Failed to update wishlist." };
    } catch (e) {
      return { success: false, error: "An error occurred." };
    } finally {
      setLoading(false);
    }
  };

  const moveAllWishlistToCart = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await moveAllWishlistToCartAction();
      if (res.success) {
        await Promise.all([refreshCart(), refreshWishlist()]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.productId === productId);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await loginAction(email, password);
      if (res.success && res.user) {
        setUser(res.user);
        // Refresh cart & wishlist after login
        await Promise.all([refreshCart(), refreshWishlist()]);
        return { success: true, user: res.user };
      }
      return { success: false, error: res.error };
    } catch (e) {
      return { success: false, error: "An unexpected error occurred." };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await signupAction(name, email, password);
      if (res.success && res.user) {
        setUser(res.user);
        await Promise.all([refreshCart(), refreshWishlist()]);
        return { success: true, user: res.user };
      }
      return { success: false, error: res.error };
    } catch (e) {
      return { success: false, error: "An unexpected error occurred." };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutAction();
      setUser(null);
      setWishlist([]);
      await refreshCart();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    return await updatePasswordAction(currentPassword, newPassword);
  };

  const updateProfile = async (name: string) => {
    setLoading(true);
    try {
      const res = await updateProfileAction(name);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch (e) {
      return { success: false, error: "An error occurred." };
    } finally {
      setLoading(false);
    }
  };

  const checkout = async (data: { email: string; name: string; address: string; couponCode?: string; discount: number }) => {
    setLoading(true);
    try {
      const orderItems = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
      }));
      const res = await createOrderAction({
        email: data.email,
        name: data.name,
        address: data.address,
        couponCode: data.couponCode,
        discount: data.discount,
        tax: 0,
        shippingFee: 50,
        total: Math.max(0, cartTotal - data.discount + 50), // subtotal - discount + ₹50 shipping
        items: orderItems,
      });
      if (res.success) {
        setCart([]);
        return { success: true };
      }
      return { success: false, error: "Failed to place order." };
    } catch (e) {
      return { success: false, error: "An error occurred during checkout." };
    } finally {
      setLoading(false);
    }
  };

  const refreshCatalog = async () => {
    try {
      const [cats, prods] = await Promise.all([
        getCategoriesAction(),
        getProductsAction(),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods : []);
    } catch (e) {
      console.error("Failed to refresh catalog:", e);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        cart,
        wishlist,
        categories,
        products,
        loading,
        cartCount,
        cartTotal,
        wishlistCount,
        refreshCart,
        refreshWishlist,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        toggleWishlist,
        moveAllWishlistToCart,
        isInWishlist,
        login,
        signup,
        logout,
        updatePassword,
        updateProfile,
        checkout,
        refreshCatalog,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
