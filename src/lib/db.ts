import { supabase, supabaseAdmin } from "./supabase";
import { Product, Category, User, Cart, Wishlist, Order, Banner, Coupon, Settings, ProductVariant } from "./mock-db";

const generateId = () => crypto.randomUUID();

// ──────────────────────────────────────────────
// Helper: map snake_case DB rows → camelCase TS
// ──────────────────────────────────────────────

function mapUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role as "USER" | "ADMIN",
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    image: row.image || "",
    isActive: row.is_active,
  };
}

function mapProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    compareAtPrice: row.compare_at_price,
    images: row.images || [],
    categoryId: row.category_id,
    isFeatured: row.is_featured,
    isBestSeller: row.is_best_seller,
    isNewArrival: row.is_new_arrival,
    isActive: row.is_active,
    stock: row.stock,
    weight: row.weight || 1,
    weightUnit: row.weight_unit || 'kg',
    createdAt: row.created_at,
  };
}

function mapProductVariant(row: any): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    weightLabel: row.weight_label || "",
    flavourLabel: row.flavour_label || "",
    price: row.price,
    mrp: row.mrp ?? null,
    stock: row.stock,
    sku: row.sku ?? null,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function mapOrder(row: any): Order {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    paymentStatus: row.payment_status,
    razorpayOrderId: row.razorpay_order_id,
    razorpayPaymentId: row.razorpay_payment_id,
    razorpaySignature: row.razorpay_signature,
    trackingNumber: row.tracking_number,
    tax: row.tax,
    shippingFee: row.shipping_fee,
    invoiceNumber: row.invoice_number,
    total: row.total,
    couponCode: row.coupon_code,
    discount: row.discount,
    email: row.email,
    name: row.name,
    address: row.address,
    createdAt: new Date(row.created_at),
    items: (row.order_items || []).map((i: any) => ({
      id: i.id,
      productId: i.product_id,
      quantity: i.quantity,
      price: i.price,
      weight: i.weight || 1,
      weightUnit: i.weight_unit || 'kg',
      productName: i.product_name || undefined,
      productImage: i.product_image || undefined,
      variantId: i.variant_id || null,
      variantWeight: i.variant_weight || null,
      variantFlavour: i.variant_flavour || null,
    })),
  };
}

function mapBanner(row: any): Banner {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    image: row.image,
    mobileImage: row.mobile_image,
    link: row.link,
    order: row.sort_order,
    isActive: row.is_active,
  };
}

function mapCoupon(row: any): Coupon {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type as "FIXED" | "PERCENTAGE",
    discountValue: row.discount_value,
    minPurchase: row.min_purchase,
    expiryDate: row.expiry_date ? new Date(row.expiry_date) : null,
    usageLimit: row.usage_limit,
    usageCount: row.usage_count,
    isActive: row.is_active,
  };
}

function mapSettings(row: any): Settings {
  return {
    id: row.id,
    websiteName: row.website_name,
    storeEmail: row.store_email,
    storePhone: row.store_phone,
    storeAddress: row.store_address,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    shippingFreeLimit: row.shipping_free_limit,
    shippingFee: row.shipping_fee,
    taxRate: row.tax_rate,
    razorpayKeyId: row.razorpay_key_id,
    razorpayKeySecret: row.razorpay_key_secret,
    resendApiKey: row.resend_api_key,
    resendSenderEmail: row.resend_sender_email,
    cloudinaryCloudName: row.cloudinary_cloud_name,
    cloudinaryApiKey: row.cloudinary_api_key,
    cloudinaryApiSecret: row.cloudinary_api_secret,
  };
}

// ──────────────────────────────────────────────
// Database abstraction layer — Supabase backend
// ──────────────────────────────────────────────

export const db = {
  // ── CATEGORIES ──────────────────────────────
  async getCategories(onlyActive: boolean = false): Promise<Category[]> {
    let query = supabase.from("categories").select("*").order("name", { ascending: true });
    if (onlyActive) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error) { console.error("Supabase getCategories error:", error); return []; }
    return (data || []).map(mapCategory);
  },

  async addCategory(name: string, slug: string, image?: string): Promise<Category> {
    const { data, error } = await supabase
      .from("categories")
      .insert({ id: generateId(), name, slug, image: image || "", is_active: true })
      .select()
      .single();
    if (error) throw new Error(`addCategory failed: ${error.message}`);
    return mapCategory(data);
  },

  async updateCategory(id: string, data: { name?: string; slug?: string; image?: string; isActive?: boolean }): Promise<Category | null> {
    const update: any = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.slug !== undefined) update.slug = data.slug;
    if (data.image !== undefined) update.image = data.image;
    if (data.isActive !== undefined) update.is_active = data.isActive;
    const { data: row, error } = await supabase
      .from("categories")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error) { console.error("Supabase updateCategory error:", error); return null; }
    return mapCategory(row);
  },

  async deleteCategory(id: string): Promise<boolean> {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { console.error("Supabase deleteCategory error:", error); return false; }
    return true;
  },

  // ── PRODUCTS ────────────────────────────────
  async getProducts(options?: {
    categorySlug?: string;
    query?: string;
    isFeatured?: boolean;
    isBestSeller?: boolean;
    isNewArrival?: boolean;
    onlyActive?: boolean;
  }): Promise<Product[]> {
    let q = supabase.from("products").select("*").order("created_at", { ascending: false });

    if (options?.isFeatured !== undefined) q = q.eq("is_featured", options.isFeatured);
    if (options?.isBestSeller !== undefined) q = q.eq("is_best_seller", options.isBestSeller);
    if (options?.isNewArrival !== undefined) q = q.eq("is_new_arrival", options.isNewArrival);
    if (options?.onlyActive !== undefined) q = q.eq("is_active", options.onlyActive);

    if (options?.categorySlug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", options.categorySlug)
        .single();
      if (!cat) return [];
      q = q.eq("category_id", cat.id);
    }

    if (options?.query) {
      q = q.or(`name.ilike.%${options.query}%,description.ilike.%${options.query}%`);
    }

    const { data, error } = await q;
    if (error) { console.error("Supabase getProducts error:", error); return []; }
    return (data || []).map(mapProduct);
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error || !data) return null;
    return mapProduct(data);
  },

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return mapProduct(data);
  },

  async addProduct(data: Omit<Product, "id">): Promise<Product> {
    const productId = generateId();
    const { data: row, error } = await supabase
      .from("products")
      .insert({
        id: productId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        compare_at_price: data.compareAtPrice,
        images: data.images,
        category_id: data.categoryId,
        is_featured: data.isFeatured,
        is_best_seller: data.isBestSeller,
        is_new_arrival: data.isNewArrival,
        is_active: data.isActive,
        stock: data.stock,
        weight: data.weight,
        weight_unit: data.weightUnit,
      })
      .select()
      .single();
    if (error) throw new Error(`addProduct failed: ${error.message}`);

    return this.getProductById(productId) as Promise<Product>;
  },

  async updateProduct(id: string, data: Partial<Omit<Product, "id">>): Promise<Product | null> {
    const update: any = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.slug !== undefined) update.slug = data.slug;
    if (data.description !== undefined) update.description = data.description;
    if (data.price !== undefined) update.price = data.price;
    if (data.compareAtPrice !== undefined) update.compare_at_price = data.compareAtPrice;
    if (data.images !== undefined) update.images = data.images;
    if (data.categoryId !== undefined) update.category_id = data.categoryId;
    if (data.isFeatured !== undefined) update.is_featured = data.isFeatured;
    if (data.isBestSeller !== undefined) update.is_best_seller = data.isBestSeller;
    if (data.isNewArrival !== undefined) update.is_new_arrival = data.isNewArrival;
    if (data.isActive !== undefined) update.is_active = data.isActive;
    if (data.stock !== undefined) update.stock = data.stock;
    if (data.weight !== undefined) update.weight = data.weight;
    if (data.weightUnit !== undefined) update.weight_unit = data.weightUnit;

    const { data: row, error } = await supabase
      .from("products")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error) { console.error("Supabase updateProduct error:", error); return null; }

    return this.getProductById(id);
  },

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { console.error("Supabase deleteProduct error:", error); return false; }
    return true;
  },

  // ── PRODUCT VARIANTS ─────────────────────────
  async getVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: true });
    if (error) { console.error("Supabase getVariants error:", error); return []; }
    return (data || []).map(mapProductVariant);
  },

  async getVariantById(id: string): Promise<ProductVariant | null> {
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return mapProductVariant(data);
  },

  async addVariant(productId: string, data: Omit<ProductVariant, "id" | "productId" | "createdAt">): Promise<ProductVariant> {
    const { data: row, error } = await supabaseAdmin
      .from("product_variants")
      .insert({
        id: generateId(),
        product_id: productId,
        weight_label: data.weightLabel,
        flavour_label: data.flavourLabel,
        price: data.price,
        mrp: data.mrp ?? null,
        stock: data.stock,
        sku: data.sku ?? null,
        is_active: data.isActive,
      })
      .select()
      .single();
    if (error) {
      console.error("Supabase addVariant error:", JSON.stringify(error, null, 2));
      throw new Error(`addVariant failed: ${error.message}`);
    }
    return mapProductVariant(row);
  },

  async updateVariant(id: string, data: Partial<Omit<ProductVariant, "id" | "productId" | "createdAt">>): Promise<ProductVariant | null> {
    const update: any = {};
    if (data.weightLabel !== undefined) update.weight_label = data.weightLabel;
    if (data.flavourLabel !== undefined) update.flavour_label = data.flavourLabel;
    if (data.price !== undefined) update.price = data.price;
    if (data.mrp !== undefined) update.mrp = data.mrp;
    if (data.stock !== undefined) update.stock = data.stock;
    if (data.sku !== undefined) update.sku = data.sku;
    if (data.isActive !== undefined) update.is_active = data.isActive;

    const { data: row, error } = await supabaseAdmin
      .from("product_variants")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("Supabase updateVariant error:", JSON.stringify(error, null, 2), "Query:", update, "id:", id);
      return null;
    }
    return mapProductVariant(row);
  },

  async deleteVariant(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin.from("product_variants").delete().eq("id", id);
    if (error) {
      console.error("Supabase deleteVariant error:", JSON.stringify(error, null, 2), "id:", id);
      return false;
    }
    return true;
  },

  /**
   * Bulk replace all variants for a product:
   * deletes removed ones, inserts new ones, updates existing ones.
   */
  async bulkUpsertVariants(
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
  ): Promise<ProductVariant[]> {
    // Delete all existing variants for this product then re-insert
    const { error: deleteError } = await supabaseAdmin.from("product_variants").delete().eq("product_id", productId);
    if (deleteError) {
      console.error("Supabase bulkUpsertVariants (DELETE phase) error:", JSON.stringify(deleteError, null, 2), "productId:", productId);
      throw new Error(`bulkUpsertVariants (delete) failed: ${deleteError.message}`);
    }

    if (variants.length === 0) return [];

    const rows = variants.map((v) => ({
      id: v.id || generateId(),
      product_id: productId,
      weight_label: v.weightLabel,
      flavour_label: v.flavourLabel,
      price: v.price,
      mrp: v.mrp ?? null,
      stock: v.stock,
      sku: v.sku ?? null,
      is_active: v.isActive,
    }));

    const { data, error } = await supabaseAdmin
      .from("product_variants")
      .insert(rows)
      .select();

    if (error) {
      console.error("Supabase bulkUpsertVariants (INSERT phase) error:", JSON.stringify(error, null, 2), "Payload:", JSON.stringify(rows, null, 2));
      throw new Error(`bulkUpsertVariants (insert) failed: ${error.message}`);
    }
    return (data || []).map(mapProductVariant);
  },

  // ── USERS ───────────────────────────────────
  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .ilike("email", email)
      .single();
    if (error || !data) return null;
    return mapUser(data);
  },

  async createUser(data: { email: string; passwordHash: string; name: string }): Promise<User> {
    const now = new Date().toISOString();
    const { data: row, error } = await supabase
      .from("users")
      .insert({
        id: generateId(),
        email: data.email,
        password_hash: data.passwordHash,
        name: data.name,
        role: "USER",
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();
    if (error) throw new Error(`createUser failed: ${error.message}`);
    return mapUser(row);
  },

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<boolean> {
    const { error } = await supabase
      .from("users")
      .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) { console.error("Supabase updateUserPassword error:", error); return false; }
    return true;
  },

  async updateUserProfile(userId: string, data: { name: string }): Promise<User | null> {
    const { data: row, error } = await supabase
      .from("users")
      .update({ name: data.name, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();
    if (error) { console.error("Supabase updateUserProfile error:", error); return null; }
    return mapUser(row);
  },

  // ── CARTS ───────────────────────────────────
  async getCart(userIdOrGuestId: string): Promise<Cart> {
    let { data: cart } = await supabase
      .from("carts")
      .select("*, cart_items(*)")
      .eq("user_id", userIdOrGuestId)
      .single();

    if (!cart) {
      const { data: newCart, error } = await supabase
        .from("carts")
        .insert({ id: generateId(), user_id: userIdOrGuestId })
        .select("*, cart_items(*)")
        .single();
      if (error) {
        return { id: generateId(), userId: userIdOrGuestId, items: [] };
      }
      cart = newCart;
    }

    return {
      id: cart.id,
      userId: cart.user_id,
      items: (cart.cart_items || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        variantId: item.variant_id || null,
      })),
    };
  },

  async addToCart(userIdOrGuestId: string, productId: string, quantity: number = 1, variantId?: string | null): Promise<Cart> {
    const cart = await this.getCart(userIdOrGuestId);

    // Match by productId AND variantId so different variants are separate line items
    const existing = cart.items.find(
      (item) => item.productId === productId && (item.variantId || null) === (variantId || null)
    );

    if (existing) {
      await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({
        id: generateId(),
        cart_id: cart.id,
        product_id: productId,
        quantity,
        variant_id: variantId || null,
      });
    }

    return this.getCart(userIdOrGuestId);
  },

  async updateCartItem(userIdOrGuestId: string, cartItemId: string, quantity: number): Promise<Cart> {
    const cart = await this.getCart(userIdOrGuestId);
    const item = cart.items.find((i) => i.id === cartItemId);

    if (item) {
      if (quantity <= 0) {
        await supabase.from("cart_items").delete().eq("id", item.id);
      } else {
        await supabase.from("cart_items").update({ quantity }).eq("id", item.id);
      }
    }

    return this.getCart(userIdOrGuestId);
  },

  async removeFromCart(userIdOrGuestId: string, cartItemId: string): Promise<Cart> {
    return this.updateCartItem(userIdOrGuestId, cartItemId, 0);
  },

  async clearCart(userIdOrGuestId: string): Promise<void> {
    const cart = await this.getCart(userIdOrGuestId);
    await supabase.from("cart_items").delete().eq("cart_id", cart.id);
  },

  // ── WISHLIST ────────────────────────────────
  async getWishlist(userId: string): Promise<Wishlist> {
    let { data: wishlist } = await supabase
      .from("wishlists")
      .select("*, wishlist_items(*)")
      .eq("user_id", userId)
      .single();

    if (!wishlist) {
      const { data: newWishlist, error } = await supabase
        .from("wishlists")
        .insert({ id: generateId(), user_id: userId })
        .select("*, wishlist_items(*)")
        .single();
      if (error) {
        return { id: generateId(), userId, items: [] };
      }
      wishlist = newWishlist;
    }

    return {
      id: wishlist.id,
      userId: wishlist.user_id,
      items: (wishlist.wishlist_items || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
      })),
    };
  },

  async toggleWishlist(userId: string, productId: string): Promise<Wishlist> {
    const wishlist = await this.getWishlist(userId);
    const existing = wishlist.items.find((item) => item.productId === productId);

    if (existing) {
      await supabase.from("wishlist_items").delete().eq("id", existing.id);
    } else {
      await supabase.from("wishlist_items").insert({
        id: generateId(),
        wishlist_id: wishlist.id,
        product_id: productId,
      });
    }

    return this.getWishlist(userId);
  },

  async moveAllWishlistToCart(userId: string): Promise<void> {
    const wishlist = await this.getWishlist(userId);
    for (const item of wishlist.items) {
      await this.addToCart(userId, item.productId, 1);
    }
    await supabase.from("wishlist_items").delete().eq("wishlist_id", wishlist.id);
  },

  // ── ORDERS ──────────────────────────────────
  async getOrders(userId?: string): Promise<Order[]> {
    let q = supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (userId) q = q.eq("user_id", userId);
    const { data, error } = await q;
    if (error) { console.error("Supabase getOrders error:", error); return []; }
    return (data || []).map(mapOrder);
  },

  async createOrder(
    userId: string | null,
    data: {
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
    }
  ): Promise<Order> {
    const orderId = generateId();
    const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: orderRow, error: orderError } = await supabase
      .from("orders")
      .insert({
        id: orderId,
        user_id: userId,
        email: data.email,
        name: data.name,
        address: data.address,
        coupon_code: data.couponCode || null,
        discount: data.discount,
        tax: data.tax,
        shipping_fee: data.shippingFee,
        total: data.total,
        invoice_number: invoiceNum,
        payment_status: data.paymentStatus || "PENDING",
        razorpay_order_id: data.razorpayOrderId || null,
        status: "PENDING",
      })
      .select()
      .single();

    if (orderError) throw new Error(`createOrder failed: ${orderError.message}`);

    // Insert order items with variant snapshot
    const itemInserts = data.items.map((item) => ({
      id: generateId(),
      order_id: orderId,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price,
      product_name: item.productName || null,
      product_image: item.productImage || null,
      variant_id: item.variantId || null,
      variant_weight: item.variantWeight || null,
      variant_flavour: item.variantFlavour || null,
    }));
    await supabase.from("order_items").insert(itemInserts);

    // If paid, decrement stock on variants (or product base stock)
    if (data.paymentStatus === "PAID") {
      for (const item of data.items) {
        if (item.variantId) {
          const { data: variant } = await supabase
            .from("product_variants")
            .select("stock")
            .eq("id", item.variantId)
            .single();
          if (variant) {
            await supabase
              .from("product_variants")
              .update({ stock: Math.max(0, variant.stock - item.quantity) })
              .eq("id", item.variantId);
          }
        } else {
          const { data: prod } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.productId)
            .single();
          if (prod) {
            await supabase
              .from("products")
              .update({ stock: Math.max(0, prod.stock - item.quantity) })
              .eq("id", item.productId);
          }
        }
      }
    }

    const { data: fullOrder } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    return mapOrder(fullOrder || orderRow);
  },

  async updateOrderStatus(orderId: string, status: string): Promise<Order | null> {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);
    if (error) { console.error("Supabase updateOrderStatus error:", error); return null; }

    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();
    return data ? mapOrder(data) : null;
  },

  async updateOrderTracking(orderId: string, trackingNumber: string): Promise<Order | null> {
    const { error } = await supabase
      .from("orders")
      .update({ tracking_number: trackingNumber, status: "SHIPPED" })
      .eq("id", orderId);
    if (error) { console.error("Supabase updateOrderTracking error:", error); return null; }

    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();
    return data ? mapOrder(data) : null;
  },

  async updateOrderPaymentStatus(
    orderId: string,
    paymentStatus: string,
    razorpayPaymentId?: string,
    razorpaySignature?: string
  ): Promise<Order | null> {
    const update: any = { payment_status: paymentStatus };
    if (razorpayPaymentId) update.razorpay_payment_id = razorpayPaymentId;
    if (razorpaySignature) update.razorpay_signature = razorpaySignature;

    const { error } = await supabase.from("orders").update(update).eq("id", orderId);
    if (error) { console.error("Supabase updateOrderPaymentStatus error:", error); return null; }

    // If PAID, deplete stock (variant or base product)
    if (paymentStatus === "PAID") {
      const { data: items } = await supabase
        .from("order_items")
        .select("product_id, quantity, variant_id")
        .eq("order_id", orderId);
      if (items) {
        for (const item of items) {
          if (item.variant_id) {
            const { data: variant } = await supabase
              .from("product_variants")
              .select("stock")
              .eq("id", item.variant_id)
              .single();
            if (variant) {
              await supabase
                .from("product_variants")
                .update({ stock: Math.max(0, variant.stock - item.quantity) })
                .eq("id", item.variant_id);
            }
          } else {
            const { data: prod } = await supabase
              .from("products")
              .select("stock")
              .eq("id", item.product_id)
              .single();
            if (prod) {
              await supabase
                .from("products")
                .update({ stock: Math.max(0, prod.stock - item.quantity) })
                .eq("id", item.product_id);
            }
          }
        }
      }
    }

    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();
    return data ? mapOrder(data) : null;
  },

  // ── BANNERS ─────────────────────────────────
  async getBanners(onlyActive: boolean = false): Promise<Banner[]> {
    let q = supabase.from("banners").select("*").order("sort_order", { ascending: true });
    if (onlyActive) q = q.eq("is_active", true);
    const { data, error } = await q;
    if (error) { console.error("Supabase getBanners error:", error); return []; }
    return (data || []).map(mapBanner);
  },

  async addBanner(data: Omit<Banner, "id">): Promise<Banner> {
    const { data: row, error } = await supabase
      .from("banners")
      .insert({
        id: generateId(),
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        image: data.image,
        mobile_image: data.mobileImage,
        link: data.link,
        sort_order: data.order,
        is_active: data.isActive,
      })
      .select()
      .single();
    if (error) throw new Error(`addBanner failed: ${error.message}`);
    return mapBanner(row);
  },

  async updateBanner(id: string, data: Partial<Omit<Banner, "id">>): Promise<Banner | null> {
    const update: any = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.subtitle !== undefined) update.subtitle = data.subtitle;
    if (data.description !== undefined) update.description = data.description;
    if (data.image !== undefined) update.image = data.image;
    if (data.mobileImage !== undefined) update.mobile_image = data.mobileImage;
    if (data.link !== undefined) update.link = data.link;
    if (data.order !== undefined) update.sort_order = data.order;
    if (data.isActive !== undefined) update.is_active = data.isActive;

    const { data: row, error } = await supabase
      .from("banners")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error) { console.error("Supabase updateBanner error:", error); return null; }
    return mapBanner(row);
  },

  async deleteBanner(id: string): Promise<boolean> {
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) { console.error("Supabase deleteBanner error:", error); return false; }
    return true;
  },

  async reorderBanners(orderedIds: string[]): Promise<boolean> {
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabase
        .from("banners")
        .update({ sort_order: i })
        .eq("id", orderedIds[i]);
      if (error) { console.error("Supabase reorderBanners error:", error); return false; }
    }
    return true;
  },

  // ── COUPONS ─────────────────────────────────
  async getCoupons(): Promise<Coupon[]> {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error("Supabase getCoupons error:", error); return []; }
    return (data || []).map(mapCoupon);
  },

  async getCouponByCode(code: string): Promise<Coupon | null> {
    const cCode = code.trim();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .ilike("code", cCode)
      .single();
    if (error || !data) return null;
    return mapCoupon(data);
  },

  async addCoupon(data: Omit<Coupon, "id" | "usageCount">): Promise<Coupon> {
    const { data: row, error } = await supabase
      .from("coupons")
      .insert({
        id: generateId(),
        code: data.code,
        discount_type: data.discountType,
        discount_value: data.discountValue,
        min_purchase: data.minPurchase,
        expiry_date: data.expiryDate ? data.expiryDate.toISOString() : null,
        usage_limit: data.usageLimit,
        usage_count: 0,
        is_active: data.isActive,
      })
      .select()
      .single();
    if (error) throw new Error(`addCoupon failed: ${error.message}`);
    return mapCoupon(row);
  },

  async updateCoupon(id: string, data: Partial<Omit<Coupon, "id">>): Promise<Coupon | null> {
    const update: any = {};
    if (data.code !== undefined) update.code = data.code;
    if (data.discountType !== undefined) update.discount_type = data.discountType;
    if (data.discountValue !== undefined) update.discount_value = data.discountValue;
    if (data.minPurchase !== undefined) update.min_purchase = data.minPurchase;
    if (data.expiryDate !== undefined) update.expiry_date = data.expiryDate ? data.expiryDate.toISOString() : null;
    if (data.usageLimit !== undefined) update.usage_limit = data.usageLimit;
    if (data.isActive !== undefined) update.is_active = data.isActive;
    if (data.usageCount !== undefined) update.usage_count = data.usageCount;

    const { data: row, error } = await supabase
      .from("coupons")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error) { console.error("Supabase updateCoupon error:", error); return null; }
    return mapCoupon(row);
  },

  async deleteCoupon(id: string): Promise<boolean> {
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) { console.error("Supabase deleteCoupon error:", error); return false; }
    return true;
  },

  // ── SETTINGS ────────────────────────────────
  async getSettings(): Promise<Settings> {
    const { data } = await supabase
      .from("settings")
      .select("*")
      .eq("id", "global-settings")
      .single();

    if (data) return mapSettings(data);

    // Create default settings if not found
    const { data: created, error } = await supabase
      .from("settings")
      .insert({ id: "global-settings" })
      .select()
      .single();

    if (error || !created) {
      return {
        id: "global-settings",
        websiteName: "Stack Shack Nutrition",
        storeEmail: "support@stackshack.com",
        storePhone: "+1 (800) 555-GAIN",
        storeAddress: "123 Performance Way, Fitness Suite A",
        seoTitle: "Stack Shack Nutrition | Premium Supplements & Protein",
        seoDescription: "Experience premium nutrition, protein, creatine, and pre-workout formulas.",
        shippingFreeLimit: 50,
        shippingFee: 5.99,
        taxRate: 5,
      };
    }

    return mapSettings(created);
  },

  async updateSettings(data: Partial<Omit<Settings, "id">>): Promise<Settings> {
    const update: any = {};
    if (data.websiteName !== undefined) update.website_name = data.websiteName;
    if (data.storeEmail !== undefined) update.store_email = data.storeEmail;
    if (data.storePhone !== undefined) update.store_phone = data.storePhone;
    if (data.storeAddress !== undefined) update.store_address = data.storeAddress;
    if (data.seoTitle !== undefined) update.seo_title = data.seoTitle;
    if (data.seoDescription !== undefined) update.seo_description = data.seoDescription;
    if (data.shippingFreeLimit !== undefined) update.shipping_free_limit = data.shippingFreeLimit;
    if (data.shippingFee !== undefined) update.shipping_fee = data.shippingFee;
    if (data.taxRate !== undefined) update.tax_rate = data.taxRate;
    if (data.razorpayKeyId !== undefined) update.razorpay_key_id = data.razorpayKeyId;
    if (data.razorpayKeySecret !== undefined) update.razorpay_key_secret = data.razorpayKeySecret;
    if (data.resendApiKey !== undefined) update.resend_api_key = data.resendApiKey;
    if (data.resendSenderEmail !== undefined) update.resend_sender_email = data.resendSenderEmail;
    if (data.cloudinaryCloudName !== undefined) update.cloudinary_cloud_name = data.cloudinaryCloudName;
    if (data.cloudinaryApiKey !== undefined) update.cloudinary_api_key = data.cloudinaryApiKey;
    if (data.cloudinaryApiSecret !== undefined) update.cloudinary_api_secret = data.cloudinaryApiSecret;

    const { data: row, error } = await supabase
      .from("settings")
      .update(update)
      .eq("id", "global-settings")
      .select();

    console.log("UPDATE RESULT:", row);
    console.log("UPDATE ERROR:", error);

    if (error) { console.error("Supabase updateSettings error:", error); return this.getSettings(); }
    return mapSettings(row);
  },

  // ── ANALYTICS & CUSTOMERS ───────────────────
  async getCustomersList(): Promise<any[]> {
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "USER");
    if (error || !users) return [];

    const results = [];
    for (const u of users) {
      const { data: orders } = await supabase
        .from("orders")
        .select("total, payment_status")
        .eq("user_id", u.id);

      const paidOrders = (orders || []).filter((o: any) => o.payment_status === "PAID");
      results.push({
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: new Date(u.created_at),
        orderCount: paidOrders.length,
        totalSpent: paidOrders.reduce((sum: number, o: any) => sum + o.total, 0),
      });
    }
    return results;
  },
};
