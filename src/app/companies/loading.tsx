export default function CompaniesLoading() {
  return (
    <div className="mx-auto max-w-(--max-width) px-4 py-6 lg:px-6">
      <div className="mb-5">
        <div className="h-3 w-24 animate-pulse rounded" style={{ backgroundColor: "var(--gray-200)" }} />
        <div className="mt-2 h-7 w-32 animate-pulse rounded" style={{ backgroundColor: "var(--gray-200)" }} />
      </div>
      <div className="mb-5 h-10 w-full max-w-sm animate-pulse rounded-md" style={{ backgroundColor: "var(--gray-200)" }} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-lg" style={{ backgroundColor: "var(--gray-200)" }} />
        ))}
      </div>
    </div>
  );
}