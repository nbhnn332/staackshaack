import { db } from "./src/lib/db";
import { applyCouponAction } from "./src/app/actions";

async function main() {
  console.log("Applying coupon 'shack10'...");
  const res = await applyCouponAction("shack10", 100);
  console.log("Action Result:", res);
}
main().catch(console.error);
