import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "스타트업 — ApplyKit",
  description: "한국 스타트업 기업 데이터베이스. 업종별, 투자 단계별 검색 및 필터링.",
  openGraph: {
    title: "스타트업 — ApplyKit",
    description: "한국 스타트업 기업 데이터베이스",
  },
};

export default function CompaniesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}