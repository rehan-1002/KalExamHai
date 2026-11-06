import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kalexamhai-one.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/contact",
          "/login",
          "/signup",
          "/privacy",
          "/terms",
          "/refund-policy",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/student/",
          "/tutor/",
          "/auth/",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}

