// 루트 레이아웃 — 모든 페이지에 공통으로 적용됨
import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "../providers/query-provider";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "ApplyKit",
  description: "스타트업 지원사업 통합 관리 플랫폼",
  
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={cn("h-full", "font-sans", inter.variable)}>
      
      <body className="h-full">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
