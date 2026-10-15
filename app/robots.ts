import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gjtfoundation.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/admin/*", "/donor/", "/donor/*"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
