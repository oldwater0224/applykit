import type { Metadata } from "next";
import "./globals.css";
import "../styles/designToken.css";
import QueryProvider from "../providers/query-provider";
import GNB from "@/src/components/layout/gnb";

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
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body
        className="h-full antialiased"
        style={{
          fontFamily: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif",
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