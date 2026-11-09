import { cn } from "@/lib/utils";

// 페이지 제목 공통 규칙 — 공개·지원자·관리자 화면이 같은 크기·굵기·색을 쓴다
// 굵기는 600이 최대. 위계는 크기와 색(primary / secondary)으로 만든다
export const PAGE_TITLE_CLASS =
  "text-xl sm:text-[22px] font-semibold leading-tight text-(--text-primary)";
export const PAGE_DESCRIPTION_CLASS =
  "mt-1 text-xs sm:text-[13px] text-(--text-secondary)";

type PageTitleProps = {
  title: React.ReactNode;
  /** 제목 아래 한 줄 설명. secondary 텍스트로 보인다 */
  description?: React.ReactNode;
  /** 제목 오른쪽(모바일은 아래)에 놓을 보조 정보나 버튼 */
  actions?: React.ReactNode;
  /** 긴 제목(공고명 등)을 한 줄로 자른다 */
  truncate?: boolean;
  className?: string;
};

export function PageTitle({
  title,
  description,
  actions,
  truncate,
  className,
}: PageTitleProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className={cn(PAGE_TITLE_CLASS, truncate && "truncate")}>
          {title}
        </h1>
        {description && <p className={PAGE_DESCRIPTION_CLASS}>{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
