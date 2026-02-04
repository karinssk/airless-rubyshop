import type { MetadataRoute } from "next";
import { backendBaseUrl, frontendBaseUrl } from "@/lib/urls";
import { locales } from "@/i18n";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items: MetadataRoute.Sitemap = [];

  // Add homepage for each locale
  locales.forEach((locale) => {
    items.push({
      url: `${frontendBaseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${frontendBaseUrl}/${l}`])
        ),
      },
    });
  });

  // Add main sections for each locale
  const mainSections = ["blog", "services", "products"];
  mainSections.forEach((section) => {
    locales.forEach((locale) => {
      items.push({
        url: `${frontendBaseUrl}/${locale}/${section}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${frontendBaseUrl}/${l}/${section}`])
          ),
        },
      });
    });
  });

  // Fetch dynamic pages from backend and create locale versions
  try {
    const response = await fetch(`${backendBaseUrl}/pages?status=published`, {
      cache: "no-store",
    });
    if (!response.ok) return items;
    const data = await response.json();
    const pages = data.pages || [];
    pages.forEach((page: { slug: string; updatedAt?: string }) => {
      if (page.slug === "home") return;
      locales.forEach((locale) => {
        items.push({
          url: `${frontendBaseUrl}/${locale}/${page.slug}`,
          lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
          alternates: {
            languages: Object.fromEntries(
              locales.map((l) => [l, `${frontendBaseUrl}/${l}/${page.slug}`])
            ),
          },
        });
      });
    });
  } catch {
    return items;
  }

  // Fetch blog posts and create locale versions
  try {
    const response = await fetch(`${backendBaseUrl}/posts?status=published`, {
      cache: "no-store",
    });
    if (!response.ok) return items;
    const data = await response.json();
    const posts = data.posts || [];
    posts.forEach((post: { slug: string; updatedAt?: string }) => {
      locales.forEach((locale) => {
        items.push({
          url: `${frontendBaseUrl}/${locale}/blog/${post.slug}`,
          lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
          changeFrequency: "weekly",
          priority: 0.6,
          alternates: {
            languages: Object.fromEntries(
              locales.map((l) => [l, `${frontendBaseUrl}/${l}/blog/${post.slug}`])
            ),
          },
        });
      });
    });
  } catch {
    return items;
  }

  // Fetch services and create locale versions
  try {
    const response = await fetch(`${backendBaseUrl}/services?status=published`, {
      cache: "no-store",
    });
    if (!response.ok) return items;
    const data = await response.json();
    const services = data.services || [];
    services.forEach((service: { slug: string; updatedAt?: string }) => {
      locales.forEach((locale) => {
        items.push({
          url: `${frontendBaseUrl}/${locale}/services/${service.slug}`,
          lastModified: service.updatedAt ? new Date(service.updatedAt) : new Date(),
          changeFrequency: "weekly",
          priority: 0.6,
          alternates: {
            languages: Object.fromEntries(
              locales.map((l) => [l, `${frontendBaseUrl}/${l}/services/${service.slug}`])
            ),
          },
        });
      });
    });
  } catch {
    return items;
  }

  return items;
}
