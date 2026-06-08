import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "지원사업 — ApplyKit",
  description: "스타트업 지원 프로그램에 지원하세요. 공고 목록 및 지원서 관리.",
  openGraph: {
    title: "지원사업 — ApplyKit",
    description: "스타트업 지원 프로그램 목록",
  },
};

export default function ProgramsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}