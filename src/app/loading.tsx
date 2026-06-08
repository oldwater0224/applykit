export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-(--max-width) px-4 py-6 lg:px-6">
      {/* 헤더 스켈레톤 */}
      <div className="mb-6">
        <div className="h-3 w-40 animate-pulse rounded" style={{ backgroundColor: "var(--gray-200)" }} />
        <div className="mt-2 h-7 w-56 animate-pulse rounded" style={{ backgroundColor: "var(--gray-200)" }} />
      </div>

      {/* 통계 바 스켈레톤 */}
      <div className="mb-6 h-20 animate-pulse rounded-xl" style={{ backgroundColor: "var(--gray-200)" }} />

      {/* 라운드 카드 스켈레톤 */}
      <div className="mb-8 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg" style={{ backgroundColor: "var(--gray-200)" }} />
        ))}
      </div>

      {/* 하단 2열 스켈레톤 */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="h-64 animate-pulse rounded-lg lg:col-span-2" style={{ backgroundColor: "var(--gray-200)" }} />
        <div className="h-64 animate-pulse rounded-lg lg:col-span-3" style={{ backgroundColor: "var(--gray-200)" }} />
      </div>
    </div>
  );
}