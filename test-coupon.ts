import { db } from "./src/lib/db";
import { applyCouponAction } from "./src/app/actions";

async function main() {
  console.log("Fetching coupon 'SHACK10'...");
  const coupon = await db.getCouponByCode("SHACK10");
  console.log("DB Result:", coupon);

  console.log("Applying coupon 'SHACK10'...");
  const res = await applyCouponAction("SHACK10", 100);
  console.log("Action Result:", res);
}
main().catch(console.error);
