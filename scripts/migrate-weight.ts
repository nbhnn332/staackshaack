import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env");
  process.exit(1);
}

// Ensure you configure Supabase client carefully
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateWeights() {
  console.log("Starting weight data migration for products...");

  // Fetch all products
  const { data: products, error } = await supabase
    .from("products")
    .select("id, weight, weight_unit");

  if (error) {
    console.error("Error fetching products:", error.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log("No products found.");
    return;
  }

  let updatedCount = 0;

  for (const product of products) {
    // If weight is null, 0, or weight_unit is missing/null, update it
    if (!product.weight || !product.weight_unit) {
      const { error: updateError } = await supabase
        .from("products")
        .update({
          weight: product.weight || 1,
          weight_unit: product.weight_unit || "kg",
        })
        .eq("id", product.id);

      if (updateError) {
        console.error(`Failed to update product ${product.id}:`, updateError.message);
      } else {
        console.log(`Updated product ${product.id} to 1 kg.`);
        updatedCount++;
      }
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} products.`);
}

migrateWeights().catch(console.error);
