// 루트 레이아웃 — 모든 페이지에 공통으로 적용됨
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ApplyKit',
  description: '스타트업 지원사업 통합 관리 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}
