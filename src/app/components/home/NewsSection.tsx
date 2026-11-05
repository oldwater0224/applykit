import { getRecentNews } from "@/src/app/actions/newsAction";
import NewsRotator from "./NewsRotator";

export default async function NewsSection() {
  const news = await getRecentNews(35);

  if (!news || news.length === 0) return null;

  return (
    <section className="mb-6">
      <NewsRotator news={news} />
    </section>
  );
}
