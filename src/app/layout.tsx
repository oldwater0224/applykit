import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "../styles/designToken.css";
import QueryProvider from "../providers/query-provider";
import GNB from "@/src/components/layout/gnb";

const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

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
    <html lang="ko" className={`h-full ${pretendard.variable}`}>
      <body
        className={`h-full antialiased ${pretendard.className}`}
        style={{
          backgroundColor: "var(--page-bg)",
          color: "var(--gray-900)",
        }}
      >
        <QueryProvider>
          <GNB />
          <main>{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}