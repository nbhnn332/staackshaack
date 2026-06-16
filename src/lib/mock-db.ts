// ============================================================
// Stack Shack — TypeScript interfaces for all database entities
// These types are used throughout the app for type safety.
// ============================================================

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "USER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  categoryId: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  stock: number;
  weight: number;
  weightUnit: string;
  createdAt?: string;
}

// ── VARIANT SYSTEM ────────────────────────────────────────────
// Each ProductVariant is one combination of (weightLabel, flavourLabel)
// with its own price, MRP, stock, SKU and active flag.
export interface ProductVariant {
  id: string;
  productId: string;
  weightLabel: string;   // e.g. "250 g", "1 kg", "" (empty = no weight option)
  flavourLabel: string;  // e.g. "Chocolate", "" (empty = no flavour option)
  price: number;
  mrp?: number | null;
  stock: number;
  sku?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  variantId?: string | null;
}

export interface Cart {
  id: string;
  userId?: string | null;
  items: CartItem[];
}

export interface WishlistItem {
  id: string;
  productId: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  weight: number;
  weightUnit: string;
  productName?: string;
  productImage?: string;
  // Variant snapshot — stored at order time so history is always correct
  variantId?: string | null;
  variantWeight?: string | null;
  variantFlavour?: string | null;
}

export interface Order {
  id: string;
  userId?: string | null;
  status: string; // "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
  paymentStatus: string; // "PENDING" | "PAID" | "FAILED"
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  trackingNumber?: string | null;
  tax: number;
  shippingFee: number;
  invoiceNumber?: string | null;
  total: number;
  couponCode?: string | null;
  discount: number;
  email: string;
  name: string;
  address: string;
  createdAt: Date;
  items: OrderItem[];
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image: string;
  mobileImage?: string | null;
  link?: string | null;
  order: number;
  isActive: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: number;
  minPurchase: number;
  expiryDate?: Date | null;
  usageLimit?: number | null;
  usageCount: number;
  isActive: boolean;
}

export interface Settings {
  id: string;
  websiteName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  seoTitle: string;
  seoDescription: string;
  shippingFreeLimit: number;
  shippingFee: number;
  taxRate: number;
  razorpayKeyId?: string | null;
  razorpayKeySecret?: string | null;
  resendApiKey?: string | null;
  resendSenderEmail?: string | null;
  cloudinaryCloudName?: string | null;
  cloudinaryApiKey?: string | null;
  cloudinaryApiSecret?: string | null;
}
