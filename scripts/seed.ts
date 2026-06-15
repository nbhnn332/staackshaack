import { createClient } from "@supabase/supabase-js";
import * as bcrypt from "bcryptjs";
import { config } from "dotenv";

config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Seeding database via Supabase API...");

  // Note: Due to foreign key constraints and safety, we'll try to delete in order,
  // but if RLS or permissions block this, the script might fail.
  // To bypass RLS and permission errors entirely, ensure you use the SERVICE_ROLE_KEY,
  // or that your tables have appropriate permissions.

  // 1. Clean existing database
  console.log("Clearing existing data...");
  await supabase.from("order_items").delete().neq("id", "dummy");
  await supabase.from("orders").delete().neq("id", "dummy");
  await supabase.from("products").delete().neq("id", "dummy");
  await supabase.from("categories").delete().neq("id", "dummy");
  await supabase.from("users").delete().neq("id", "dummy");

  console.log("Database cleared (if permissions allowed).");

  // 2. Create Admin and Regular User
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 10);
  const userPasswordHash = await bcrypt.hash("userpassword123", 10);

  const { data: admin } = await supabase.from("users").upsert({
    id: "admin-id",
    email: "admin@stackshack.com",
    name: "Stack Shack Admin",
    password_hash: adminPasswordHash,
    role: "ADMIN",
  }).select().single();

  const { data: regularUser } = await supabase.from("users").upsert({
    id: "customer-id",
    email: "customer@stackshack.com",
    name: "John Doe",
    password_hash: userPasswordHash,
    role: "USER",
  }).select().single();

  console.log(`Users created/updated: Admin, Customer`);

  // 3. Create Categories
  const categoriesData = [
    { id: "cat-proteins", name: "Proteins", slug: "proteins", image: "/categories/proteins.png", is_active: true },
    { id: "cat-pre-workouts", name: "Pre-Workouts", slug: "pre-workouts", image: "/categories/pre-workouts.png", is_active: true },
    { id: "cat-vitamins", name: "Vitamins", slug: "vitamins", image: "/categories/vitamins.png", is_active: true },
    { id: "cat-snacks", name: "Snacks", slug: "snacks", image: "/categories/snacks.png", is_active: true },
    { id: "cat-creatine", name: "Creatine", slug: "creatine", image: "/categories/creatine.png", is_active: true },
  ];

  await supabase.from("categories").upsert(categoriesData);
  console.log(`Created ${categoriesData.length} categories.`);

  // 4. Create Products
  const productsData = [
    {
      id: "prod-whey",
      name: "Whey Gold Standard Protein",
      slug: "whey-gold-standard-protein",
      description: "Double Rich Chocolate 100% Whey Protein powder to support muscle growth and recovery. 24g of protein, 5.5g of BCAAs, and low sugar. Essential for post-workout repair.",
      price: 59.99,
      compare_at_price: 69.99,
      images: ["/products/whey-chocolate.png"],
      category_id: "cat-proteins",
      is_featured: true,
      is_best_seller: true,
      is_new_arrival: false,
      stock: 45,
    },
    {
      id: "prod-vegan",
      name: "Vegan Plant Protein Blend",
      slug: "vegan-plant-protein-blend",
      description: "Organic Vanilla bean protein powder with pea, brown rice, and chia seed protein. Sugar-free and delicious. Perfect clean plant fuel.",
      price: 44.99,
      compare_at_price: 49.99,
      images: ["/products/vegan-protein.png"],
      category_id: "cat-proteins",
      is_featured: false,
      is_best_seller: false,
      is_new_arrival: true,
      stock: 30,
    },
    {
      id: "prod-pre",
      name: "Hyper Charge Pre-Workout",
      slug: "hyper-charge-pre-workout",
      description: "High intensity energy, focus, and pump formula. Exploding Blue Raspberry flavor with 300mg of caffeine, Beta-Alanine, and L-Citrulline.",
      price: 39.99,
      compare_at_price: 45.99,
      images: ["/products/pre-workout-blue.png"],
      category_id: "cat-pre-workouts",
      is_featured: true,
      is_best_seller: true,
      is_new_arrival: false,
      stock: 60,
    },
    {
      id: "prod-vit",
      name: "Daily Multi-Vitamin Elite",
      slug: "daily-multi-vitamin-elite",
      description: "Comprehensive daily vitamin formula with essential minerals, antioxidants, and immune support nutrients. Tailored for active individuals.",
      price: 24.99,
      compare_at_price: 29.99,
      images: ["/products/vitamins.png"],
      category_id: "cat-vitamins",
      is_featured: false,
      is_best_seller: false,
      is_new_arrival: true,
      stock: 100,
    },
    {
      id: "prod-bars",
      name: "Choco Crunch Protein Bars",
      slug: "choco-crunch-protein-bars",
      description: "Box of 12 crispy protein bars with 20g of protein and only 1g of sugar. A premium high-protein snack for busy days.",
      price: 29.99,
      compare_at_price: 34.99,
      images: ["/products/protein-bars.png"],
      category_id: "cat-snacks",
      is_featured: true,
      is_best_seller: false,
      is_new_arrival: false,
      stock: 25,
    },
    {
      id: "prod-creatine",
      name: "Pure Creatine Monohydrate",
      slug: "pure-creatine-monohydrate",
      description: "Unflavored micro-pure creatine powder to increase muscle strength, power, and explosive lifting speed. 5g per serving, pure quality.",
      price: 19.99,
      compare_at_price: 24.99,
      images: ["/products/creatine.png"],
      category_id: "cat-creatine",
      is_featured: false,
      is_best_seller: true,
      is_new_arrival: true,
      stock: 50,
    },
  ];

  const { error: prodErr } = await supabase.from("products").upsert(productsData);
  if (prodErr) console.error("Products error:", prodErr);
  else console.log(`Created ${productsData.length} products.`);

  // 5. Create Banners
  const bannersData = [
    { id: "slide-1", title: "Fuel Your Performance", subtitle: "PREMIUM SPORTS SUPPLEMENTS", description: "Get the energy, endurance, and power you need to smash your personal records.", image: "/products/pre-workout-blue.png", link: "/shop?category=pre-workouts", sort_order: 0, is_active: true },
    { id: "slide-2", title: "Premium Whey & Vegan Proteins", subtitle: "BUILD & RECOVER FAST", description: "24g of pure high-quality protein per scoop to support lean muscle development.", image: "/products/whey-chocolate.png", link: "/shop?category=proteins", sort_order: 1, is_active: true },
    { id: "slide-3", title: "Explosive Strength & Power", subtitle: "100% PURE CREATINE", description: "Increase athletic output, size, and strength with micro-pure creatine monohydrate.", image: "/products/creatine.png", link: "/shop?category=creatine", sort_order: 2, is_active: true }
  ];

  const { error: banErr } = await supabase.from("banners").upsert(bannersData);
  if (banErr) console.error("Banners error:", banErr);
  else console.log(`Created ${bannersData.length} banners.`);

  // 6. Global Settings
  await supabase.from("settings").upsert({
    id: "global-settings",
    website_name: "Stack Shack Nutrition",
    store_email: "support@stackshack.com",
    store_phone: "+1 (800) 555-GAIN",
  });
  console.log("Global settings initialized.");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  });
