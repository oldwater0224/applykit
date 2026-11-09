import { cn } from "@/lib/utils";

/**
 * 목록 필터 칩 (companies, investors, investments 라운드 탭 공용)
 * - 모양은 컨트롤과 같다: 반경 8px(rounded-md), 높이 28px(모바일은 터치용 36px), 12px 글자, 굵기 500
 * - 비활성: 채움 없음 + hairline-strong 테두리 + secondary 글자
 * - 활성: 표면 한 단계(navy-700) + brand 테두리 + primary 글자, aria-pressed로 상태를 알린다
 * - 서버/클라이언트 어디서나 쓸 수 있다 (상태 없음, onClick은 호출하는 쪽 클라이언트 컴포넌트가 넘긴다)
 */

export const FILTER_CHIP_CLASS =
  "inline-flex min-h-9 shrink-0 items-center rounded-md border px-3 text-xs font-medium whitespace-nowrap transition-colors sm:min-h-7 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-500)";

const STATE_CLASS = {
  active: "border-(--brand-500) bg-(--navy-700) text-(--text-primary)",
  inactive:
    "border-(--hairline-strong) bg-transparent text-(--text-secondary) hover:bg-white/[0.04] hover:text-(--text-primary)",
} as const;

export interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}

export function FilterChip({
  active,
  onClick,
  className,
  children,
}: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        FILTER_CHIP_CLASS,
        active ? STATE_CLASS.active : STATE_CLASS.inactive,
        className
      )}
    >
      {children}
    </button>
  );
}
