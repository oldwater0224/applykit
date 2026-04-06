import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 로그인 상태면 대시보드로
  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">ApplyKit</h1>
        <p className="text-gray-600 mb-8">AI 기반 지원서 관리 시스템</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
          >
            회원가입
          </Link>
        </div>
      </div>
    </main>
  )
}