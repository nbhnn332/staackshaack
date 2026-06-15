import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://qyxonweozuyosvovibnm.supabase.co", "sb_publishable_f69BTyA4EKnnKD3rcPhxNA_fpL1qyXO");
async function run() {
  const { data, error } = await supabase.from("cart_items").insert({
    cart_id: "test-cart",
    product_id: "prod-whey",
    quantity: 1,
    flavour: "Vanilla",
    variant_label: "5 lbs"
  });
  console.log("Result:", data, error);
}
run();
