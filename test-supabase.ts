import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://qyxonweozuyosvovibnm.supabase.co", "sb_publishable_f69BTyA4EKnnKD3rcPhxNA_fpL1qyXO");
async function run() {
  const { data, error } = await supabase.from("product_flavours").select("*");
  console.log("Flavours:", data, error);
}
run();
