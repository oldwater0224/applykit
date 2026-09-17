import { getRecentNews } from "@/src/app/actions/newsAction";
import NewsRotator from "./NewsRotator";

export default async function NewsSection() {
  const news = await getRecentNews(35);

  if (!news || news.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2
          className="text-[13px] font-semibold"
          style={{ color: "#fff" }}
        >
          스타트업 뉴스
        </h2>
        <span
          className="text-[11px]"
          style={{ color: "var(--gray-500)" }}
        >
          7초마다 자동 갱신
        </span>
      </div>
      <NewsRotator news={news} />
    </section>
  );
}
