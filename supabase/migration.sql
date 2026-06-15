-- ============================================================
-- Stack Shack — Supabase Migration
-- Run this SQL in the Supabase SQL Editor to create all tables
-- and seed them with initial data.
-- ============================================================

-- ── USERS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'USER',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ── CATEGORIES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name       TEXT UNIQUE NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  image      TEXT DEFAULT '',
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- ── PRODUCTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  price            DOUBLE PRECISION NOT NULL DEFAULT 0,
  compare_at_price DOUBLE PRECISION,
  images           TEXT[] DEFAULT '{}',
  category_id      TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_featured      BOOLEAN NOT NULL DEFAULT false,
  is_best_seller   BOOLEAN NOT NULL DEFAULT false,
  is_new_arrival   BOOLEAN NOT NULL DEFAULT false,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  stock            INTEGER NOT NULL DEFAULT 0,
  weight           DOUBLE PRECISION NOT NULL DEFAULT 1,
  weight_unit      TEXT NOT NULL DEFAULT 'kg',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- ── CARTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS carts (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE carts DISABLE ROW LEVEL SECURITY;

-- ── CART_ITEMS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  cart_id    TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;

-- ── WISHLISTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlists (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE wishlists DISABLE ROW LEVEL SECURITY;

-- ── WISHLIST_ITEMS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist_items (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wishlist_id TEXT NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE wishlist_items DISABLE ROW LEVEL SECURITY;

-- ── ORDERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id             TEXT,
  status              TEXT NOT NULL DEFAULT 'PENDING',
  payment_status      TEXT NOT NULL DEFAULT 'PENDING',
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature  TEXT,
  tracking_number     TEXT,
  tax                 DOUBLE PRECISION NOT NULL DEFAULT 0,
  shipping_fee        DOUBLE PRECISION NOT NULL DEFAULT 0,
  invoice_number      TEXT UNIQUE,
  total               DOUBLE PRECISION NOT NULL DEFAULT 0,
  coupon_code         TEXT,
  discount            DOUBLE PRECISION NOT NULL DEFAULT 0,
  email               TEXT NOT NULL,
  name                TEXT NOT NULL,
  address             TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- ── ORDER_ITEMS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  quantity   INTEGER NOT NULL,
  price      DOUBLE PRECISION NOT NULL,
  weight     DOUBLE PRECISION NOT NULL DEFAULT 1,
  weight_unit TEXT NOT NULL DEFAULT 'kg',
  product_name TEXT,
  product_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- ── BANNERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title       TEXT NOT NULL,
  subtitle    TEXT,
  description TEXT,
  image       TEXT NOT NULL DEFAULT '',
  link        TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE banners DISABLE ROW LEVEL SECURITY;

-- ── COUPONS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code           TEXT UNIQUE NOT NULL,
  discount_type  TEXT NOT NULL DEFAULT 'PERCENTAGE',
  discount_value DOUBLE PRECISION NOT NULL DEFAULT 0,
  min_purchase   DOUBLE PRECISION NOT NULL DEFAULT 0,
  expiry_date    TIMESTAMPTZ,
  usage_limit    INTEGER,
  usage_count    INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;

-- ── SETTINGS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id                    TEXT PRIMARY KEY DEFAULT 'global-settings',
  website_name          TEXT NOT NULL DEFAULT 'Stack Shack Nutrition',
  store_email           TEXT NOT NULL DEFAULT 'support@stackshack.com',
  store_phone           TEXT NOT NULL DEFAULT '+1 (800) 555-GAIN',
  store_address         TEXT NOT NULL DEFAULT '123 Performance Way, Fitness Suite A',
  seo_title             TEXT NOT NULL DEFAULT 'Stack Shack Nutrition | Premium Supplements & Protein',
  seo_description       TEXT NOT NULL DEFAULT 'Experience premium nutrition, protein, creatine, and pre-workout formulas. Buy quality athletic supplements online at Stack Shack Nutrition.',
  shipping_free_limit   DOUBLE PRECISION NOT NULL DEFAULT 50,
  shipping_fee          DOUBLE PRECISION NOT NULL DEFAULT 5.99,
  tax_rate              DOUBLE PRECISION NOT NULL DEFAULT 5,
  razorpay_key_id       TEXT,
  razorpay_key_secret   TEXT,
  resend_api_key        TEXT,
  cloudinary_cloud_name TEXT,
  cloudinary_api_key    TEXT,
  cloudinary_api_secret TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;


-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin user (email: admin@stackshack.com, password: Admin@12345)
INSERT INTO users (id, email, password_hash, name, role) VALUES
  ('admin-id', 'admin@stackshack.com', '$2b$10$u36IhR2HHqLkRnn20J7.kOFLlx3v0Vm8QuTE1nGHVBmRZZPHcgQC2', 'Stack Shack Admin', 'ADMIN')
ON CONFLICT (id) DO NOTHING;

-- Demo customer
INSERT INTO users (id, email, password_hash, name, role) VALUES
  ('customer-id', 'customer@stackshack.com', '$2a$10$U35348q7n3k6HSwxW3vF6e2c3b.D2vK7HqQ.s7C4Hn1.QW0Nl.L4K', 'John Doe', 'USER')
ON CONFLICT (id) DO NOTHING;

-- Categories
INSERT INTO categories (id, name, slug, image, is_active) VALUES
  ('cat-proteins',     'Proteins',      'proteins',      '/categories/proteins.png',      true),
  ('cat-pre-workouts', 'Pre-Workouts',  'pre-workouts',  '/categories/pre-workouts.png',  true),
  ('cat-vitamins',     'Vitamins',      'vitamins',      '/categories/vitamins.png',      true),
  ('cat-snacks',       'Snacks',        'snacks',        '/categories/snacks.png',        true),
  ('cat-creatine',     'Creatine',      'creatine',      '/categories/creatine.png',      true)
ON CONFLICT (id) DO NOTHING;

-- Products
INSERT INTO products (id, name, slug, description, price, compare_at_price, images, category_id, is_featured, is_best_seller, is_new_arrival, is_active, stock) VALUES
  ('prod-whey',     'Whey Gold Standard Protein',  'whey-gold-standard-protein',  'Double Rich Chocolate 100% Whey Protein powder to support muscle growth and recovery. 24g of protein, 5.5g of BCAAs, and low sugar. Essential for post-workout repair.', 59.99, 69.99, ARRAY['/products/whey-chocolate.png'],     'cat-proteins',     true,  true,  false, true, 45),
  ('prod-vegan',    'Vegan Plant Protein Blend',    'vegan-plant-protein-blend',    'Organic Vanilla bean protein powder with pea, brown rice, and chia seed protein. Sugar-free and delicious. Perfect clean plant fuel.',                                    44.99, 49.99, ARRAY['/products/vegan-protein.png'],     'cat-proteins',     false, false, true,  true, 3),
  ('prod-pre',      'Hyper Charge Pre-Workout',     'hyper-charge-pre-workout',     'High intensity energy, focus, and pump formula. Exploding Blue Raspberry flavor with 300mg of caffeine, Beta-Alanine, and L-Citrulline.',                                   39.99, 45.99, ARRAY['/products/pre-workout-blue.png'],  'cat-pre-workouts', true,  true,  false, true, 0),
  ('prod-vit',      'Daily Multi-Vitamin Elite',    'daily-multi-vitamin-elite',    'Comprehensive daily vitamin formula with essential minerals, antioxidants, and immune support nutrients. Tailored for active individuals.',                                  24.99, 29.99, ARRAY['/products/vitamins.png'],          'cat-vitamins',     false, false, true,  true, 100),
  ('prod-bars',     'Choco Crunch Protein Bars',    'choco-crunch-protein-bars',    'Box of 12 crispy protein bars with 20g of protein and only 1g of sugar. A premium high-protein snack for busy days.',                                                       29.99, 34.99, ARRAY['/products/protein-bars.png'],      'cat-snacks',       true,  false, false, true, 25),
  ('prod-creatine', 'Pure Creatine Monohydrate',    'pure-creatine-monohydrate',    'Unflavored micro-pure creatine powder to increase muscle strength, power, and explosive lifting speed. 5g per serving, pure quality.',                                       19.99, 24.99, ARRAY['/products/creatine.png'],          'cat-creatine',     false, true,  true,  true, 50)
ON CONFLICT (id) DO NOTHING;

-- Banners
INSERT INTO banners (id, title, subtitle, description, image, link, sort_order, is_active) VALUES
  ('slide-1', 'Fuel Your Performance',          'PREMIUM SPORTS SUPPLEMENTS', 'Get the energy, endurance, and power you need to smash your personal records.',                  '/products/pre-workout-blue.png', '/shop?category=pre-workouts', 0, true),
  ('slide-2', 'Premium Whey & Vegan Proteins',  'BUILD & RECOVER FAST',       '24g of pure high-quality protein per scoop to support lean muscle development.',                 '/products/whey-chocolate.png',   '/shop?category=proteins',     1, true),
  ('slide-3', 'Explosive Strength & Power',     '100% PURE CREATINE',         'Increase athletic output, size, and strength with micro-pure creatine monohydrate.',              '/products/creatine.png',         '/shop?category=creatine',     2, true)
ON CONFLICT (id) DO NOTHING;

-- Coupons
INSERT INTO coupons (id, code, discount_type, discount_value, min_purchase, expiry_date, usage_limit, usage_count, is_active) VALUES
  ('coupon-1', 'SHACK10', 'PERCENTAGE', 10, 40, now() + interval '30 days', 100, 12, true),
  ('coupon-2', 'STACK20', 'PERCENTAGE', 20, 60, now() + interval '30 days', 50,  4,  true),
  ('coupon-3', 'FREE50',  'FIXED',       5, 50, now() + interval '15 days', 200, 45, true)
ON CONFLICT (id) DO NOTHING;

-- Sample Orders (for dashboard analytics)
INSERT INTO orders (id, user_id, status, payment_status, razorpay_order_id, razorpay_payment_id, razorpay_signature, tracking_number, tax, shipping_fee, invoice_number, total, coupon_code, discount, email, name, address, created_at) VALUES
  ('ord-1', 'customer-id', 'DELIVERED',  'PAID', 'pay_1', 'rpay_1', 'sig_1', 'TRK123456', 0,   0,    'INV-2026-0001', 89.98, 'SHACK10', 10.0, 'customer@stackshack.com', 'John Doe', '123 Main St, New York, NY 10001',  now() - interval '2 days'),
  ('ord-2', 'customer-id', 'PROCESSING', 'PAID', 'pay_2', 'rpay_2', 'sig_2', NULL,        1.5, 5.99, 'INV-2026-0002', 32.48, NULL,      0,    'customer@stackshack.com', 'John Doe', '456 Oak St, Brooklyn, NY 11201', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES
  ('item-1', 'ord-1', 'prod-whey',     1, 59.99),
  ('item-2', 'ord-1', 'prod-bars',     1, 29.99),
  ('item-3', 'ord-2', 'prod-creatine', 1, 19.99)
ON CONFLICT (id) DO NOTHING;

-- Settings (global store config)
INSERT INTO settings (id) VALUES ('global-settings')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- GRANTS FOR API ACCESS (ANON & AUTHENTICATED ROLES)
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================
-- ADD DUAL BANNER SUPPORT & STORAGE
-- ============================================================

-- 1. Add mobile_image column
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_image TEXT;

-- 2. Create banners storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Allow public read access to banners
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'banners');

-- 4. Allow anon and authenticated users to upload banners
CREATE POLICY "Allow Uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'banners');

-- 5. Allow anon and authenticated users to update banners
CREATE POLICY "Allow Updates" 
ON storage.objects FOR UPDATE 
WITH CHECK (bucket_id = 'banners');


