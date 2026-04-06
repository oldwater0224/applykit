'use client'

// 로그아웃 버튼 — 클라이언트 컴포넌트
// 클릭 이벤트(onClick)가 필요하기 때문에 'use client' 필수
// 서버 컴포넌트에서는 onClick 같은 이벤트 핸들러를 쓸 수 없음

import { createClient } from "@/src/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()

    // Supabase 세션 종료
    await supabase.auth.signOut()

    // 로그인 페이지로 이동
    router.push("/login")
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm border rounded px-3 py-1.5"
    >
      로그아웃
    </button>
  )
}