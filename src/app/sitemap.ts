import { MetadataRoute } from 'next';
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://stackshacknutrition.com";

  // Static routes
  const routes = [
    "",
    "/shop",
    "/categories",
    "/cart",
    "/wishlist",
    "/auth/login",
    "/auth/signup",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  try {
    // Dynamic products
    const products = await db.getProducts({ onlyActive: true });
    const productEntries = products.map((p) => ({
      url: `${baseUrl}/shop/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Dynamic categories
    const categories = await db.getCategories(true);
    const categoryEntries = categories.map((c) => ({
      url: `${baseUrl}/shop?category=${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...routes, ...productEntries, ...categoryEntries];
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return routes;
  }
}
