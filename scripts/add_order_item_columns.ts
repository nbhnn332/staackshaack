import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Adding columns to order_items...");
  await prisma.$executeRawUnsafe(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image TEXT;`);
  console.log("Columns added successfully.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
