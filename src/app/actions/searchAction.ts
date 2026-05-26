"use server";

// ============================================================
// src/app/actions/searchAction.ts
// 통합 검색 — companies + investors 동시 조회
// ============================================================

import { createClient } from "@/src/lib/supabase/server";

export interface SearchResult {
  id: string;
  name: string;
  type: "company" | "investor";
  subtitle: string | null;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 1) return [];

  const supabase = await createClient();
  const q = query.trim();

  // 병렬 조회
  const [companiesRes, investorsRes] = await Promise.all([
    supabase
      .from("companies")
      .select("id, corp_name, sector")
      .ilike("corp_name", `%${q}%`)
      .limit(5),
    supabase
      .from("investors")
      .select("id, name, investor_type")
      .ilike("name", `%${q}%`)
      .limit(5),
  ]);

  const results: SearchResult[] = [];

  (companiesRes.data ?? []).forEach((c) => {
    results.push({
      id: c.id,
      name: c.corp_name,
      type: "company",
      subtitle: c.sector,
    });
  });

  (investorsRes.data ?? []).forEach((i) => {
    results.push({
      id: i.id,
      name: i.name,
      type: "investor",
      subtitle: i.investor_type,
    });
  });

  return results;
}