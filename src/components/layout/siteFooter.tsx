import Link from "next/link";
import { cn } from "@/lib/utils";

// 사이트 공통 푸터 (#69). 개인정보 처리방침은 정확한 명칭으로, 다른 링크보다
// 눈에 띄게 표시한다(개인정보 보호법 시행령 제31조 제2항).

const LINK_BASE =
  "rounded-sm underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-500)";

export function SiteFooter() {
  return (
    <footer className="border-t border-(--hairline) bg-(--navy-900)">
      <div className="mx-auto flex max-w-(--max-width) flex-col gap-2 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-[13px] lg:px-6">
        <nav aria-label="약관 및 정책">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <li>
              <Link
                href="/privacy"
                className={cn(LINK_BASE, "font-semibold text-(--brand-500)")}
              >
                개인정보 처리방침
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className={cn(
                  LINK_BASE,
                  "text-(--text-secondary) hover:text-(--text-primary)",
                )}
              >
                이용약관
              </Link>
            </li>
          </ul>
        </nav>
        <p className="text-(--text-muted)">© ApplyKit</p>
      </div>
    </footer>
  );
}
