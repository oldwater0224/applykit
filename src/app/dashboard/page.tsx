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

  // 기관 멤버십 조회
  // org_members에 row가 있으면 운영기관, 없으면 지원자
  // - .single()은 0건일 때 에러를 던지므로 maybeSingle() 사용
  //   (지원자가 들어왔을 때 정상 케이스로 처리)
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
    .maybeSingle();

  // 멤버십 없는 사용자(= 지원자)는 /applications로 리다이렉트
  // 운영기관 대시보드를 보여주지 않음
  if (!membership) {
    redirect("/applications");
  }

  const userName = user.user_metadata?.name || user.email;

  // organizations가 배열로 오는 케이스 대비 (Supabase 관계 쿼리 특성)
  const org = membership.organizations;
  const orgName = Array.isArray(org)
    ? org[0]?.name || "기관 없음"
    : (org as unknown as { name: string } | null)?.name || "기관 없음";

  const role = membership.role;

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardCard
              title="공고 관리"
              description="공고를 생성하고 지원서 접수·심사를 관리합니다."
              href="/dashboard/programs"
            />
            <DashboardCard
              title="심사 아카이브"
              description="과거 심사한 회사를 검색합니다."
              href="/dashboard/archive"
            />
          </div>
        </section>

        {/* 지원 섹션은 제거 - 운영기관은 운영 메뉴만 */}
        {/* 운영자가 직접 지원해볼 일은 없으므로 노이즈 줄임 */}
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