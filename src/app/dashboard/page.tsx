import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";

import Link from "next/link";
import SignOutButton from "@/src/components/signOutButton";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 기관 정보 조회
  const { data: membership } = await supabase
    .from("org_members")
    .select(
      `
      role,
      organizations (
        id,
        name
      )
    `,
    )
    .eq("user_id", user.id)
    .single();

  const userName = user.user_metadata?.name || user.email;

  // organizations가 배열인 경우
  const org = membership?.organizations;
  const orgName = Array.isArray(org)
    ? org[0]?.name || "기관 없음"
    : (org as unknown as { name: string } | null)?.name || "기관 없음";

  const role = membership?.role || "member";

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">ApplyKit</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{userName}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">내 정보</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">이메일:</span> {user.email}
            </p>
            <p>
              <span className="text-gray-500">기관:</span> {orgName}
            </p>
            <p>
              <span className="text-gray-500">역할:</span>{" "}
              {role === "admin" ? "관리자" : "멤버"}
            </p>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 mb-3">운영</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DashboardCard
              title="공고 관리"
              description="채용 공고를 생성하고 관리합니다."
              href="/dashboard/programs"
            />
            <DashboardCard
              title="지원서 관리"
              description="접수된 지원서를 확인합니다."
              href="/dashboard/applications"
            />
            <DashboardCard
              title="평가 관리"
              description="지원서 평가를 진행합니다."
              href="/dashboard/reviews"
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">지원</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardCard
              title="내 지원서"
              description="작성 중이거나 제출한 지원서를 확인합니다."
              href="/applications"
            />
            <DashboardCard
              title="공고 둘러보기"
              description="준비 중입니다."
              href="#"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
    >
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  );
}
