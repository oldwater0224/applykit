export default function InvestmentsLoading() {
  return (
    <div className="mx-auto max-w-(--max-width) px-4 py-6 lg:px-6">
      <div className="mb-4">
        <div className="h-3 w-32 animate-pulse rounded" style={{ backgroundColor: "var(--gray-200)" }} />
        <div className="mt-2 h-7 w-40 animate-pulse rounded" style={{ backgroundColor: "var(--gray-200)" }} />
      </div>
      <div className="mb-4 flex gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-8 w-20 animate-pulse rounded-md" style={{ backgroundColor: "var(--gray-200)" }} />
        ))}
      </div>
      <div className="space-y-0.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded" style={{ backgroundColor: i % 2 === 0 ? "var(--gray-100)" : "var(--gray-50)" }} />
        ))}
      </div>
    </div>
  );
}