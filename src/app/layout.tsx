// 루트 레이아웃 — 모든 페이지에 공통으로 적용됨
import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "../providers/query-provider";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import GNB from "@/src/components/layout/gnb";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ApplyKit — 한국 스타트업 투자 데이터베이스",
  description:
    "국내 스타트업 투자 동향, 기업 분석, 재무제표, 지원사업 관리를 한 곳에서.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={cn("h-full", "font-sans", inter.variable)}>
      <body className="h-full bg-gray-50 text-gray-900 antialiased">
        <QueryProvider>
          <GNB />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}