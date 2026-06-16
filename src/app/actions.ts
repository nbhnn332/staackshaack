"use server";

import { db } from "@/lib/db";
import { getSession, setSessionCookie, clearSessionCookie, getOrCreateGuestId, SessionUser } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
import { sendEmail } from "@/lib/resend";
import { generateInvoiceHTML } from "@/lib/invoice";
import * as bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createPaymentOrder, verifyPaymentSignature } from "@/lib/razorpay";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "stackshack_nutrition_secret_2026_secure"
);

// Helper to get active identifier (User ID if logged in, else Guest ID)
async function getActiveIdentifier(): Promise<string> {
  const session = await getSession();
  if (session) return session.id;
  return await getOrCreateGuestId();
}

// --- USER AUTH ACTIONS ---

export async function getUserSession() {
  return await getSession();
}

export async function loginAction(email: string, password: string) {
  try {
    const user = await db.getUserByEmail(email);
    if (!user) {
      return { success: false, error: "Invalid email or password." };
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return { success: false, error: "Invalid email or password." };
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    await setSessionCookie(sessionUser);

    // Merge guest cart items into user cart on login
    const guestId = await getOrCreateGuestId();
    const guestCart = await db.getCart(guestId);
    if (guestCart.items.length > 0) {
      for (const item of guestCart.items) {
        await db.addToCart(user.id, item.productId, item.quantity);
      }
      await db.clearCart(guestId);
    }

    return { success: true, user: sessionUser };
  } catch (e) {
    console.error("Login action error:", e);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function signupAction(name: string, email: string, password: string) {
  try {
    const existing = await db.getUserByEmail(email);
    if (existing) {
      return { success: false, error: "An account with this email already exists." };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.createUser({
      email,
      passwordHash,
      name,
    });

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    await setSessionCookie(sessionUser);

    try {
      const settings = await db.getSettings();
      const websiteName = settings.websiteName || "Stack Shack Nutrition";
      await sendEmail(
        email,
        `Welcome to ${websiteName}!`,
        `<h1>Welcome to ${websiteName}, ${name}!</h1><p>We are thrilled to have you here. Discover our range of premium proteins, creatine, and pre-workout formulas to power up your fitness goals.</p>`
      );
    } catch (err) {
      console.error("Welcome email error:", err);
    }

    return { success: true, user: sessionUser };
  } catch (e) {
    console.error("Signup action error:", e);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  return { success: true };
}

export async function updatePasswordAction(currentPassword: string, newPassword: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized." };
    }

    const user = await db.getUserByEmail(session.email);
    if (!user) {
      return { success: false, error: "User not found." };
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatch) {
      return { success: false, error: "Current password is incorrect." };
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.updateUserPassword(user.id, newHash);
    return { success: true };
  } catch (e) {
    console.error("Update password action error:", e);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateProfileAction(name: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized." };
    }

    const updated = await db.updateUserProfile(session.id, { name });
    if (updated) {
      const sessionUser: SessionUser = {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
      };
      await setSessionCookie(sessionUser);
      return { success: true, user: sessionUser };
    }
    return { success: false, error: "Failed to update profile." };
  } catch (e) {
    console.error("Update profile action error:", e);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// --- CATALOG ACTIONS ---

export async function getCategoriesAction(onlyActive = true) {
  return await db.getCategories(onlyActive);
}

export async function getProductsAction(options?: {
  categorySlug?: string;
  query?: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  onlyActive?: boolean;
}) {
  return await db.getProducts({ onlyActive: true, ...options });
}

export async function getProductBySlugAction(slug: string) {
  return await db.getProductBySlug(slug);
}

// --- VARIANT ACTIONS ---

export async function getVariantsByProductAction(productId: string) {
  return await db.getVariantsByProductId(productId);
}

export async function adminSaveVariantsAction(
  productId: string,
  variants: Array<{
    id?: string;
    weightLabel: string;
    flavourLabel: string;
    price: number;
    mrp?: number | null;
    stock: number;
    sku?: string | null;
    isActive: boolean;
  }>
) {
  await ensureAdmin();
  const saved = await db.bulkUpsertVariants(productId, variants);
  revalidatePath(`/shop`);
  revalidatePath("/admin/products");
  return { success: true, variants: saved };
}

export async function adminDeleteVariantAction(variantId: string) {
  await ensureAdmin();
  await db.deleteVariant(variantId);
  return { success: true };
}

// --- CART ACTIONS ---

export async function getCartAction() {
  const identifier = await getActiveIdentifier();
  const cart = await db.getCart(identifier);

  const resolvedItems = [];
  for (const item of cart.items) {
    const product = await db.getProductById(item.productId);
    if (product) {
      // Resolve variant info if present
      let variantPrice: number | undefined;
      let variantMrp: number | null | undefined;
      let variantStock: number | undefined;
      let variantWeight: string | null = null;
      let variantFlavour: string | null = null;
      if (item.variantId) {
        const variant = await db.getVariantById(item.variantId);
        if (variant) {
          variantPrice = variant.price;
          variantMrp = variant.mrp;
          variantStock = variant.stock;
          variantWeight = variant.weightLabel || null;
          variantFlavour = variant.flavourLabel || null;
        }
      }
      resolvedItems.push({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        variantId: item.variantId || null,
        variantPrice,
        variantMrp,
        variantStock,
        variantWeight,
        variantFlavour,
        product,
      });
    }
  }
  return { id: cart.id, userId: cart.userId, items: resolvedItems };
}

export async function addToCartAction(productId: string, quantity: number = 1, variantId?: string | null) {
  const identifier = await getActiveIdentifier();
  await db.addToCart(identifier, productId, quantity, variantId);
  return await getCartAction();
}

export async function updateCartItemAction(cartItemId: string, quantity: number) {
  const identifier = await getActiveIdentifier();
  await db.updateCartItem(identifier, cartItemId, quantity);
  return await getCartAction();
}

export async function removeFromCartAction(cartItemId: string) {
  const identifier = await getActiveIdentifier();
  await db.removeFromCart(identifier, cartItemId);
  return await getCartAction();
}

export async function clearCartAction() {
  const identifier = await getActiveIdentifier();
  await db.clearCart(identifier);
  return await getCartAction();
}

// --- WISHLIST ACTIONS ---

export async function getWishlistAction() {
  const session = await getSession();
  if (!session) return { id: "", userId: "", items: [] };

  const wishlist = await db.getWishlist(session.id);
  const resolvedItems = [];
  for (const item of wishlist.items) {
    const product = await db.getProductById(item.productId);
    if (product) {
      resolvedItems.push({
        id: item.id,
        productId: item.productId,
        product,
      });
    }
  }
  return { id: wishlist.id, userId: wishlist.userId, items: resolvedItems };
}

export async function toggleWishlistAction(productId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Please log in to manage your wishlist." };
  }
  const wishlist = await db.toggleWishlist(session.id, productId);

  const resolvedItems = [];
  for (const item of wishlist.items) {
    const product = await db.getProductById(item.productId);
    if (product) {
      resolvedItems.push({
        id: item.id,
        productId: item.productId,
        product,
      });
    }
  }
  return { success: true, wishlist: { id: wishlist.id, userId: wishlist.userId, items: resolvedItems } };
}

export async function moveAllWishlistToCartAction() {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized." };

  await db.moveAllWishlistToCart(session.id);
  return { success: true };
}

// --- ORDER / CHECKOUT ACTIONS ---

export async function getOrdersAction() {
  const session = await getSession();
  if (!session) return [];
  return await db.getOrders(session.id);
}

export async function createOrderAction(data: {
  email: string;
  name: string;
  address: string;
  couponCode?: string;
  discount: number;
  tax: number;
  shippingFee: number;
  total: number;
  paymentStatus?: string;
  razorpayOrderId?: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
    productName?: string;
    productImage?: string;
    variantId?: string | null;
    variantWeight?: string | null;
    variantFlavour?: string | null;
  }[];
}) {
  const session = await getSession();
  const userId = session ? session.id : null;

  const order = await db.createOrder(userId, data);
  const identifier = await getActiveIdentifier();
  await db.clearCart(identifier);

  // Send Invoice Email via Resend wrapper
  try {
    const productsList = await db.getProducts();
    const productMap = Object.fromEntries(productsList.map((p) => [p.id, p]));
    const invoiceHtml = generateInvoiceHTML(order, productMap);
    await sendEmail(order.email, `Stack Shack Order Confirmation #${order.invoiceNumber || order.id.substring(0, 8)}`, invoiceHtml);
  } catch (err) {
    console.error("Failed to send order email:", err);
  }

  return { success: true, order };
}

// --- COUPON VALIDATION ---

export async function applyCouponAction(code: string, cartTotal: number) {
  try {
    const trimmedCode = code.trim();
    console.log(`[Coupon Validation] Entered Code: "${trimmedCode}", Cart Total: $${cartTotal}`);

    const coupon = await db.getCouponByCode(trimmedCode);
    console.log(`[Coupon Validation] Database Result:`, coupon ? `Found (ID: ${coupon.id})` : `Not Found`);

    if (!coupon) {
      console.log(`[Coupon Validation] Result: Failed - Coupon not found.`);
      return { success: false, error: "Coupon not found." };
    }

    if (!coupon.isActive) {
      console.log(`[Coupon Validation] Result: Failed - Coupon disabled.`);
      return { success: false, error: "Coupon disabled." };
    }

    // Expiry check
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      console.log(`[Coupon Validation] Result: Failed - Coupon expired.`);
      return { success: false, error: "Coupon expired." };
    }

    // Usage limits check
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      console.log(`[Coupon Validation] Result: Failed - Usage limit reached.`);
      return { success: false, error: "Usage limit reached." };
    }

    // Minimum purchase check
    if (cartTotal < coupon.minPurchase) {
      console.log(`[Coupon Validation] Result: Failed - Minimum order not met.`);
      return { success: false, error: `Minimum order not met. Requires $${coupon.minPurchase}.` };
    }

    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = Number(((cartTotal * coupon.discountValue) / 100).toFixed(2));
    } else {
      discount = coupon.discountValue;
    }

    console.log(`[Coupon Validation] Result: Success - Discount Applied: $${discount}`);
    return { success: true, coupon, discount };
  } catch (e) {
    return { success: false, error: "Failed to apply coupon." };
  }
}

// ==========================================
// --- ADMINISTRATIVE CONTROLS (ADMIN ONLY) ---
// ==========================================

async function ensureAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Access denied: Administrator login required.");
  }
}

// --- DYNAMIC HOME BANNERS ---

export async function getBannersAction(onlyActive = false) {
  return await db.getBanners(onlyActive);
}

export async function adminAddBannerAction(data: {
  title: string;
  subtitle?: string;
  description?: string;
  image: string; // URL
  mobileImage?: string | null; // URL
  link?: string;
  isActive: boolean;
}) {
  await ensureAdmin();
  const nextOrder = (await db.getBanners()).length;
  const banner = await db.addBanner({
    ...data,
    image: data.image,
    mobileImage: data.mobileImage || null,
    order: nextOrder,
    subtitle: data.subtitle || null,
    description: data.description || null,
    link: data.link || null,
  });
  revalidatePath("/");
  return { success: true, banner };
}

export async function adminUpdateBannerAction(id: string, data: {
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  mobileImage?: string | null;
  link?: string;
  isActive?: boolean;
}) {
  await ensureAdmin();
  const updateData: any = { ...data };
  const banner = await db.updateBanner(id, updateData);
  revalidatePath("/");
  return { success: true, banner };
}

export async function adminDeleteBannerAction(id: string) {
  await ensureAdmin();
  await db.deleteBanner(id);
  revalidatePath("/");
  return { success: true };
}

export async function adminReorderBannersAction(orderedIds: string[]) {
  await ensureAdmin();
  await db.reorderBanners(orderedIds);
  revalidatePath("/");
  return { success: true };
}

// --- PRODUCT MANAGEMENT ---

export async function adminAddProductAction(data: {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[]; // Base64 strings
  categoryId: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  stock: number;
  weight: number;
  weightUnit: string;
}) {
  await ensureAdmin();
  const uploadedImages = [];
  for (const img of data.images) {
    if (img.startsWith("data:")) {
      const url = await uploadImage(img);
      uploadedImages.push(url);
    } else {
      uploadedImages.push(img);
    }
  }

  const product = await db.addProduct({
    ...data,
    compareAtPrice: data.compareAtPrice || null,
    images: uploadedImages,
  });
  revalidatePath("/shop");
  revalidatePath("/");
  return { success: true, product };
}

export async function adminUpdateProductAction(id: string, data: any) {
  await ensureAdmin();
  const updateData = { ...data };
  if (data.images) {
    const uploadedImages = [];
    for (const img of data.images) {
      if (img.startsWith("data:")) {
        const url = await uploadImage(img);
        uploadedImages.push(url);
      } else {
        uploadedImages.push(img);
      }
    }
    updateData.images = uploadedImages;
  }
  const product = await db.updateProduct(id, updateData);
  revalidatePath("/shop");
  revalidatePath(`/shop/${product?.slug}`);
  revalidatePath("/");
  return { success: true, product };
}

export async function adminDeleteProductAction(id: string) {
  await ensureAdmin();
  await db.deleteProduct(id);
  revalidatePath("/shop");
  revalidatePath("/");
  return { success: true };
}

// --- CATEGORY MANAGEMENT ---

export async function adminAddCategoryAction(data: { name: string; slug: string; image: string }) {
  await ensureAdmin();
  let imageUrl = data.image;
  if (data.image.startsWith("data:")) {
    imageUrl = await uploadImage(data.image);
  }
  const category = await db.addCategory(data.name, data.slug, imageUrl);
  revalidatePath("/categories");
  revalidatePath("/");
  return { success: true, category };
}

export async function adminUpdateCategoryAction(id: string, data: { name?: string; slug?: string; image?: string; isActive?: boolean }) {
  await ensureAdmin();
  const updateData = { ...data };
  if (data.image && data.image.startsWith("data:")) {
    updateData.image = await uploadImage(data.image);
  }
  const category = await db.updateCategory(id, updateData);
  revalidatePath("/categories");
  revalidatePath("/");
  return { success: true, category };
}

export async function adminDeleteCategoryAction(id: string) {
  await ensureAdmin();
  await db.deleteCategory(id);
  revalidatePath("/categories");
  revalidatePath("/");
  return { success: true };
}

// --- COUPON MANAGEMENT ---

export async function adminGetCouponsAction() {
  await ensureAdmin();
  return await db.getCoupons();
}

export async function adminAddCouponAction(data: {
  code: string;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: number;
  minPurchase: number;
  expiryDate?: string;
  usageLimit?: number;
  isActive: boolean;
}) {
  await ensureAdmin();
  const coupon = await db.addCoupon({
    ...data,
    expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
    usageLimit: data.usageLimit || null,
  });
  return { success: true, coupon };
}

export async function adminUpdateCouponAction(id: string, data: any) {
  await ensureAdmin();
  const updateData = { ...data };
  if (data.expiryDate) updateData.expiryDate = new Date(data.expiryDate);
  const coupon = await db.updateCoupon(id, updateData);
  return { success: true, coupon };
}

export async function adminDeleteCouponAction(id: string) {
  await ensureAdmin();
  await db.deleteCoupon(id);
  return { success: true };
}

// --- SETTINGS MANAGEMENT ---

export async function adminGetSettingsAction() {
  return await db.getSettings();
}

export async function adminUpdateSettingsAction(data: any) {
  await ensureAdmin();
  const settings = await db.updateSettings(data);
  revalidatePath("/", "layout");
  return { success: true, settings };
}

export async function adminSendTestEmailAction(email: string) {
  await ensureAdmin();
  try {
    const res = await sendEmail(
      email,
      "Test Email Configuration - Stack Shack",
      `<h3>Configuration Successful!</h3><p>If you are seeing this email, your Resend API configuration is fully operational.</p>`
    );
    return res;
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send test email" };
  }
}

// --- CUSTOMERS & ORDERS MANAGEMENT ---

export async function adminGetOrdersAction() {
  await ensureAdmin();
  return await db.getOrders();
}

export async function adminUpdateOrderStatusAction(orderId: string, status: string) {
  await ensureAdmin();
  const order = await db.updateOrderStatus(orderId, status);

  // Send email update via Resend helper
  if (order) {
    try {
      const productsList = await db.getProducts();
      const productMap = Object.fromEntries(productsList.map((p) => [p.id, p]));
      const invoiceHtml = generateInvoiceHTML(order, productMap);
      await sendEmail(
        order.email,
        `Stack Shack Nutrition: Order Status Update #${order.invoiceNumber || order.id.substring(0, 8)}`,
        `<h3>Hello ${order.name},</h3><p>Your order status has been updated to: <strong>${status}</strong>.</p><hr />` + invoiceHtml
      );
    } catch (e) {
      console.error(e);
    }
  }

  return { success: true, order };
}

export async function adminUpdateOrderTrackingAction(orderId: string, trackingNumber: string) {
  await ensureAdmin();
  const order = await db.updateOrderTracking(orderId, trackingNumber);

  if (order) {
    try {
      const productsList = await db.getProducts();
      const productMap = Object.fromEntries(productsList.map((p) => [p.id, p]));
      const invoiceHtml = generateInvoiceHTML(order, productMap);
      await sendEmail(
        order.email,
        `Stack Shack Nutrition: Order Shipped #${order.invoiceNumber || order.id.substring(0, 8)}`,
        `<h3>Order Dispatched!</h3><p>Your package has been shipped via standard mail.</p><p><strong>Tracking Number:</strong> ${trackingNumber}</p><hr />` + invoiceHtml
      );
    } catch (e) {
      console.error(e);
    }
  }

  return { success: true, order };
}

export async function adminGetCustomersAction() {
  await ensureAdmin();
  return await db.getCustomersList();
}

export async function adminGetCustomerOrdersAction(customerId: string) {
  await ensureAdmin();
  return await db.getOrders(customerId);
}

// --- ADMIN ANALYTICS KPIs ENGINE ---

export async function adminGetKPIsAction() {
  await ensureAdmin();

  const allOrders = await db.getOrders();
  const allProducts = await db.getProducts();

  // Helper date metrics
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(todayStart.getTime() - 1000 * 60 * 60 * 24 * now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Orders counts
  const totalOrders = allOrders.length;
  const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= todayStart).length;
  const weeklyOrders = allOrders.filter(o => new Date(o.createdAt) >= startOfWeek).length;
  const monthlyOrders = allOrders.filter(o => new Date(o.createdAt) >= startOfMonth).length;
  const yearlyOrders = allOrders.filter(o => new Date(o.createdAt) >= startOfYear).length;

  // Sales calculations (Paid only)
  const paidOrders = allOrders.filter(o => o.paymentStatus === "PAID");
  const totalSales = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const todaySales = paidOrders.filter(o => new Date(o.createdAt) >= todayStart).reduce((sum, o) => sum + o.total, 0);
  const monthlySales = paidOrders.filter(o => new Date(o.createdAt) >= startOfMonth).reduce((sum, o) => sum + o.total, 0);
  const yearlySales = paidOrders.filter(o => new Date(o.createdAt) >= startOfYear).reduce((sum, o) => sum + o.total, 0);

  // Bestsellers analytics mapping
  const productSalesMap: { [id: string]: number } = {};
  paidOrders.forEach((o) => {
    o.items.forEach((item) => {
      productSalesMap[item.productId] = (productSalesMap[item.productId] || 0) + item.quantity;
    });
  });

  const bestSelling = allProducts
    .map((p) => ({
      ...p,
      salesCount: productSalesMap[p.id] || 0,
      revenue: (productSalesMap[p.id] || 0) * p.price,
    }))
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 5);

  // Stock alerts
  const lowStock = allProducts.filter(p => p.stock > 0 && p.stock < 5);
  const outOfStock = allProducts.filter(p => p.stock === 0);

  // Recent Orders (last 5)
  const recentOrders = allOrders.slice(0, 5);

  // Chart data (Monthly sales simulation or raw mappings)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const salesByMonth = months.map((monthName, monthIndex) => {
    const total = paidOrders
      .filter((o) => new Date(o.createdAt).getMonth() === monthIndex && new Date(o.createdAt).getFullYear() === now.getFullYear())
      .reduce((sum, o) => sum + o.total, 0);
    return { month: monthName, sales: Number(total.toFixed(2)) };
  });

  return {
    totalOrders,
    todayOrders,
    weeklyOrders,
    monthlyOrders,
    yearlyOrders,
    totalSales: Number(totalSales.toFixed(2)),
    todaySales: Number(todaySales.toFixed(2)),
    monthlySales: Number(monthlySales.toFixed(2)),
    yearlySales: Number(yearlySales.toFixed(2)),
    lowStockCount: lowStock.length,
    lowStockList: lowStock,
    outOfStockCount: outOfStock.length,
    outOfStockList: outOfStock,
    recentOrders,
    bestSelling,
    salesChartData: salesByMonth,
  };
}

// --- RAZORPAY & RESEND PAYMENTS / EMAIL ACTIONS ---

export async function initiateRazorpayOrderAction(amount: number) {
  try {
    const settings = await db.getSettings();
    const keyId = settings.razorpayKeyId || null;
    const keySecret = settings.razorpayKeySecret || null;

    console.log("[Razorpay Init] Retrieved Key ID:", keyId ? "Exists" : "Missing");
    console.log("[Razorpay Init] Key Secret Exists:", keySecret ? "Yes" : "No");
    console.log("[Razorpay Init] Mode:", keyId && keySecret ? "Real Razorpay API" : "Simulation Mode");

    const order = await createPaymentOrder(amount, `receipt_order_${Date.now()}`, keyId, keySecret);
    return { success: true, order, keyId };
  } catch (error: any) {
    console.error("initiateRazorpayOrderAction error:", error);
    return { success: false, error: error.message || "Failed to initiate payment order", order: null, keyId: null };
  }
}

export async function verifyPaymentAction(data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  orderId: string;
}) {
  try {
    const settings = await db.getSettings();
    const keySecret = settings.razorpayKeySecret || null;

    const isValid = verifyPaymentSignature(
      data.razorpayOrderId,
      data.razorpayPaymentId,
      data.razorpaySignature,
      keySecret
    );
    if (!isValid) {
      return { success: false, error: "Payment signature verification failed." };
    }

    const updated = await db.updateOrderPaymentStatus(
      data.orderId,
      "PAID",
      data.razorpayPaymentId,
      data.razorpaySignature
    );

    if (updated) {
      // Send receipt/invoice email
      try {
        const productsList = await db.getProducts();
        const productMap = Object.fromEntries(productsList.map((p) => [p.id, p]));
        const invoiceHtml = generateInvoiceHTML(updated, productMap);
        await sendEmail(
          updated.email,
          `Stack Shack Order Confirmation #${updated.invoiceNumber || updated.id.substring(0, 8)}`,
          invoiceHtml
        );
      } catch (err) {
        console.error("Failed to send order email:", err);
      }
      return { success: true, order: updated };
    }
    return { success: false, error: "Failed to update order status." };
  } catch (error: any) {
    console.error("verifyPaymentAction error:", error);
    return { success: false, error: error.message || "An unexpected error occurred during verification" };
  }
}

export async function markOrderAsFailedAction(orderId: string) {
  try {
    await db.updateOrderPaymentStatus(orderId, "FAILED");
    return { success: true };
  } catch (error: any) {
    console.error("markOrderAsFailedAction error:", error);
    return { success: false, error: error.message || "Failed to mark order as failed" };
  }
}

export async function sendVerificationEmailAction(email: string) {
  try {
    const token = await new SignJWT({ email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    const settings = await db.getSettings();
    const websiteName = settings.websiteName || "Stack Shack Nutrition";

    const { headers } = await import("next/headers");
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3002";
    const protocol = host.includes("localhost") ? "http" : "https";
    const verifyUrl = `${protocol}://${host}/auth/verify-email?token=${token}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4285F4; text-align: center;">Verify Your Email Address</h2>
        <p>Hello,</p>
        <p>Thank you for signing up with ${websiteName}! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="font-size: 12px; color: #666;">This link will expire in 24 hours. If you did not sign up for an account, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 11px; color: #999; text-align: center;">${websiteName} - Premium Nutrition</p>
      </div>
    `;

    await sendEmail(email, `${websiteName}: Verify Your Email Address`, html);
    return { success: true };
  } catch (error: any) {
    console.error("Verification email failed:", error);
    return { success: false, error: error.message || "Failed to send verification email" };
  }
}

export async function verifyEmailAction(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });
    const email = payload.email as string;
    if (!email) {
      return { success: false, error: "Invalid token structure." };
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      return { success: false, error: "User not found." };
    }

    return { success: true, email };
  } catch (error) {
    console.error("verifyEmailAction error:", error);
    return { success: false, error: "Token has expired or is invalid." };
  }
}

export async function sendForgotPasswordEmailAction(email: string) {
  try {
    const user = await db.getUserByEmail(email);
    if (!user) {
      return { success: true, message: "If that email exists, a reset link has been sent." };
    }

    const token = await new SignJWT({ email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(JWT_SECRET);

    const settings = await db.getSettings();
    const websiteName = settings.websiteName || "Stack Shack Nutrition";

    const { headers } = await import("next/headers");
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3002";
    const protocol = host.includes("localhost") ? "http" : "https";
    const resetUrl = `${protocol}://${host}/auth/reset-password?token=${token}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4285F4; text-align: center;">Reset Your Password</h2>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password for your ${websiteName} account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #666;">This link will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 11px; color: #999; text-align: center;">${websiteName} - Premium Nutrition</p>
      </div>
    `;

    await sendEmail(email, `${websiteName}: Reset Password Request`, html);
    return { success: true };
  } catch (error: any) {
    console.error("Forgot password email failed:", error);
    return { success: false, error: error.message || "Failed to send reset link" };
  }
}

export async function resetPasswordWithTokenAction(token: string, newPassword: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });
    const email = payload.email as string;
    if (!email) {
      return { success: false, error: "Invalid token." };
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      return { success: false, error: "User not found." };
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.updateUserPassword(user.id, newHash);

    return { success: true };
  } catch (error) {
    console.error("resetPasswordWithTokenAction error:", error);
    return { success: false, error: "Reset link has expired or is invalid." };
  }
}
