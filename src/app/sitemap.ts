import type { MetadataRoute } from "next";
import { createClient } from "@/src/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://applykit-smoky.vercel.app";

  const supabase = await createClient();

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/companies`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/investments`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/investors`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/programs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  // 동적 페이지 — 기업
  const { data: companies } = await supabase
    .from("companies")
    .select("id, updated_at")
    .order("updated_at", { ascending: false })
    .limit(500);

  const companyPages: MetadataRoute.Sitemap = (companies ?? []).map((c) => ({
    url: `${baseUrl}/companies/${c.id}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // 동적 페이지 — 투자자
  const { data: investors } = await supabase
    .from("investors")
    .select("id, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  const investorPages: MetadataRoute.Sitemap = (investors ?? []).map((i) => ({
    url: `${baseUrl}/investors/${i.id}`,
    lastModified: i.updated_at ? new Date(i.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...companyPages, ...investorPages];
}