import { db } from "./src/lib/db";

async function main() {
  console.log("Fetching Settings...");
  const settings = await db.getSettings();
  console.log("Settings:", settings);
}
main().catch(console.error);
