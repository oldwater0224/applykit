import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "투자자 — ApplyKit",
  description: "한국 스타트업 투자자 VC, 액셀러레이터, CVC 데이터베이스.",
  openGraph: {
    title: "투자자 — ApplyKit",
    description: "한국 스타트업 투자자 데이터베이스",
  },
};

export default function InvestorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}