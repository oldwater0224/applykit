"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PaginationBaseProps {
  total: number;
  pageSize: number;
}

interface UrlModeProps extends PaginationBaseProps {
  basePath: string;
  currentPage?: never;
  onPageChange?: never;
}

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
      if (page <= 1) params.delete("page");
      else params.set("page", String(page));
      router.push(`${props.basePath}?${params.toString()}`);
    }
  };

  const pages: number[] = [];
  const start = Math.max(1, activePage - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-0.5">
      <button
        onClick={() => handlePage(activePage - 1)}
        disabled={activePage <= 1}
        className="rounded px-2.5 py-1 text-[12px] transition disabled:opacity-25"
        style={{ color: "var(--gray-500)" }}
      >
        ← 이전
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => handlePage(p)}
          className="min-w-7 rounded px-1.5 py-1 text-[12px] font-medium transition"
          style={{
            backgroundColor: p === activePage ? "var(--navy-900)" : "transparent",
            color: p === activePage ? "#ffffff" : "var(--gray-500)",
          }}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => handlePage(activePage + 1)}
        disabled={activePage >= totalPages}
        className="rounded px-2.5 py-1 text-[12px] transition disabled:opacity-25"
        style={{ color: "var(--gray-500)" }}
      >
        다음 →
      </button>
    </div>
  );
}