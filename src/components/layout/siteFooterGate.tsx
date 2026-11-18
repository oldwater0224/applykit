"use client";

import { usePathname } from "next/navigation";

// /dashboard는 h-screen 셸 안에서 자체 스크롤을 가지므로 루트 푸터를 숨긴다
// (이중 스크롤 방지). 대시보드에서는 사이드바 하단에 같은 링크가 있다.
export function SiteFooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard")) return null;
  return <>{children}</>;
}
