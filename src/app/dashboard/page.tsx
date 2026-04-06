// 대시보드 메인 페이지 — 운영기관 담당자가 로그인 후 처음 보는 화면
// 서버 컴포넌트로 작성 — 페이지 진입 시 서버에서 유저·기관 정보를 미리 조회

import { createClient } from "@/src/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import SignOutButton from "@/src/components/signOutButton"

export default async function DashboardPage() {
  // 서버에서 Supabase 클라이언트 생성
  const supabase = await createClient()

  // 현재 로그인한 유저 조회
  // getUser()는 서버에서 토큰을 직접 검증하기 때문에 getSession()보다 안전
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 로그인 안 된 상태면 /login으로 리다이렉트
  // middleware.ts에서도 막지만 서버 컴포넌트에서 한 번 더 확인
  if (!user) {
    redirect("/login")
  }

  // 유저가 속한 기관 정보 조회
  // org_members 테이블과 organizations 테이블을 join해서 한 번에 가져옴
  const { data: membership } = await supabase
    .from("org_members")
    .select(`role, organizations(id, name)`)
    .eq("user_id", user.id)
    .single()

  // 표시할 정보 정리
  // user_metadata.name이 없으면 이메일, 그것도 없으면 "사용자" 표시
  const userName = user.user_metadata?.name || user.email || "사용자"

  // organizations가 배열로 올 수 있어서 타입 안전하게 처리
  const org = Array.isArray(membership?.organizations)
    ? membership?.organizations[0]
    : membership?.organizations
  const orgName = org?.name || "기관 정보 없음"
  const role = membership?.role || "member"

  return (
    <main className="min-h-screen">
      {/* 상단 헤더 — 로고 + 유저 정보 + 로그아웃 버튼 */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-base font-medium">ApplyKit</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">{userName}</span>
            {/* SignOutButton은 클라이언트 컴포넌트로 분리 — 클릭 이벤트 필요 */}
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 내 정보 카드 */}
        <div className="border rounded-md p-6 mb-8">
          <h2 className="text-sm font-medium mb-4">내 정보</h2>
          <div className="space-y-2 text-sm">
            <div className="flex gap-4">
              <span className="w-16 shrink-0">이메일</span>
              <span>{user.email}</span>
            </div>
            <div className="flex gap-4">
              <span className="w-16 shrink-0">기관</span>
              <span>{orgName}</span>
            </div>
            <div className="flex gap-4">
              <span className="w-16 shrink-0">역할</span>
              <span>{role === "admin" ? "관리자" : "멤버"}</span>
            </div>
          </div>
        </div>

        {/* 메뉴 카드  */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashboardCard
            title="공고 관리"
            description="채용 공고를 생성하고 관리합니다."
            href="/dashboard/programs"
            count={0}
          />
          <DashboardCard
            title="지원서 관리"
            description="접수된 지원서를 확인합니다."
            href="/dashboard/applications"
            count={0}
          />
          <DashboardCard
            title="평가 관리"
            description="지원서 평가를 진행합니다."
            href="/dashboard/reviews"
            count={0}
          />
        </div>
      </div>
    </main>
  )
}

// 대시보드 메뉴 카드 컴포넌트
// href로 이동, count로 현재 건수 표시
function DashboardCard({
  title,
  description,
  href,
  count,
}: {
  title: string
  description: string
  href: string
  count: number
}) {
  return (
    // Next.js Link 컴포넌트 사용 —  클라이언트 사이드 네비게이션
    <Link href={href} className="block border rounded-md p-6">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        {/* 아이콘 자리 — 나중에 lucide-react 아이콘으로 교체 */}
        <span className="w-4 h-4" />
      </div>
      <p className="text-sm">{description}</p>
      <p className="text-sm mt-4">{count}건</p>
    </Link>
  )
}