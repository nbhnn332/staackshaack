import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Clean existing database
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Database cleared.");

  // 2. Create Admin and Regular User
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 10);
  const userPasswordHash = await bcrypt.hash("userpassword123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@stackshack.com",
      name: "Stack Shack Admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      email: "customer@stackshack.com",
      name: "John Doe",
      passwordHash: userPasswordHash,
      role: "USER",
    },
  });

  console.log(`Users created: Admin (${admin.email}), Customer (${regularUser.email})`);

  // 3. Create Categories
  const categoriesData = [
    { name: "Proteins", slug: "proteins", image: "/categories/proteins.png" },
    { name: "Pre-Workouts", slug: "pre-workouts", image: "/categories/pre-workouts.png" },
    { name: "Vitamins", slug: "vitamins", image: "/categories/vitamins.png" },
    { name: "Snacks", slug: "snacks", image: "/categories/snacks.png" },
    { name: "Creatine", slug: "creatine", image: "/categories/creatine.png" },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const created = await prisma.category.create({
      data: cat,
    });
    categories.push(created);
  }
  console.log(`Created ${categories.length} categories.`);

  const catMap = new Map(categories.map(c => [c.name, c.id]));

  // 4. Create Products
  const productsData = [
    {
      name: "Whey Gold Standard Protein",
      slug: "whey-gold-standard-protein",
      description: "Double Rich Chocolate 100% Whey Protein powder to support muscle growth and recovery. 24g of protein, 5.5g of BCAAs, and low sugar. Essential for post-workout repair.",
      price: 59.99,
      compareAtPrice: 69.99,
      images: ["/products/whey-chocolate.png"],
      categoryId: catMap.get("Proteins")!,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      stock: 45,
    },
    {
      name: "Vegan Plant Protein Blend",
      slug: "vegan-plant-protein-blend",
      description: "Organic Vanilla bean protein powder with pea, brown rice, and chia seed protein. Sugar-free and delicious. Perfect clean plant fuel.",
      price: 44.99,
      compareAtPrice: 49.99,
      images: ["/products/vegan-protein.png"],
      categoryId: catMap.get("Proteins")!,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      stock: 30,
    },
    {
      name: "Hyper Charge Pre-Workout",
      slug: "hyper-charge-pre-workout",
      description: "High intensity energy, focus, and pump formula. Exploding Blue Raspberry flavor with 300mg of caffeine, Beta-Alanine, and L-Citrulline.",
      price: 39.99,
      compareAtPrice: 45.99,
      images: ["/products/pre-workout-blue.png"],
      categoryId: catMap.get("Pre-Workouts")!,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      stock: 60,
    },
    {
      name: "Daily Multi-Vitamin Elite",
      slug: "daily-multi-vitamin-elite",
      description: "Comprehensive daily vitamin formula with essential minerals, antioxidants, and immune support nutrients. Tailored for active individuals.",
      price: 24.99,
      compareAtPrice: 29.99,
      images: ["/products/vitamins.png"],
      categoryId: catMap.get("Vitamins")!,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      stock: 100,
    },
    {
      name: "Choco Crunch Protein Bars",
      slug: "choco-crunch-protein-bars",
      description: "Box of 12 crispy protein bars with 20g of protein and only 1g of sugar. A premium high-protein snack for busy days.",
      price: 29.99,
      compareAtPrice: 34.99,
      images: ["/products/protein-bars.png"],
      categoryId: catMap.get("Snacks")!,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: false,
      stock: 25,
    },
    {
      name: "Pure Creatine Monohydrate",
      slug: "pure-creatine-monohydrate",
      description: "Unflavored micro-pure creatine powder to increase muscle strength, power, and explosive lifting speed. 5g per serving, pure quality.",
      price: 19.99,
      compareAtPrice: 24.99,
      images: ["/products/creatine.png"],
      categoryId: catMap.get("Creatine")!,
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: true,
      stock: 50,
    },
  ];

  for (const prod of productsData) {
    await prisma.product.create({
      data: prod,
    });
  }

  console.log(`Created ${productsData.length} products.`);
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
