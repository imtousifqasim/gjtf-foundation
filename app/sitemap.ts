import { MetadataRoute } from "next";
import { schools } from "@/data/schools";
import { stories } from "@/data/stories";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gjtfoundation.com";

  // Static routes (excluding /admin/*)
  const staticRoutes = [
    "",
    "/about-gjtf-volunteers",
    "/city-chapter-leads",
    "/university-chapter",
    "/general-volunteer",
    "/aims-and-objectives",
    "/our-school",
    "/news-stories",
    "/contact-us",
    "/donate-now",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Dynamic school routes
  const schoolRoutes = schools.map((school) => ({
    url: `${baseUrl}/school/${school.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Dynamic story routes
  const storyRoutes = stories.map((story) => ({
    url: `${baseUrl}/news-stories/${story.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...schoolRoutes, ...storyRoutes];
}
