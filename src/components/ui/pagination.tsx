"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PaginationBaseProps {
  total: number;
  pageSize: number;
}

// URL 모드: basePath 기반 라우팅
interface UrlModeProps extends PaginationBaseProps {
  basePath: string;
  currentPage?: never;
  onPageChange?: never;
}

// 콜백 모드: 상태 기반 페이지 변경
interface CallbackModeProps extends PaginationBaseProps {
  basePath?: never;
  currentPage: number;
  onPageChange: (page: number) => void;
}

type PaginationProps = UrlModeProps | CallbackModeProps;

export default function Pagination(props: PaginationProps) {
  const { total, pageSize } = props;
  const router = useRouter();
  const searchParams = useSearchParams();

  const isCallbackMode = typeof props.onPageChange === "function";

  const activePage = isCallbackMode
    ? props.currentPage
    : Number(searchParams.get("page") ?? 1);

  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  const handlePage = (page: number) => {
    if (page < 1 || page > totalPages) return;

    if (isCallbackMode) {
      props.onPageChange(page);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (page <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(page));
      }
      router.push(`${props.basePath}?${params.toString()}`);
    }
  };

  // 보여줄 페이지 번호 (최대 5개)
  const pages: number[] = [];
  const start = Math.max(1, activePage - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => handlePage(activePage - 1)}
        disabled={activePage <= 1}
        className="rounded-md px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        ← 이전
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => handlePage(p)}
          className={`min-w-9 rounded-md px-2 py-1.5 text-sm font-medium transition ${
            p === activePage
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => handlePage(activePage + 1)}
        disabled={activePage >= totalPages}
        className="rounded-md px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        다음 →
      </button>
    </div>
  );
}