'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp } from '@/src/lib/actions/auth'

const initialState = { error: '' }

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState)

  return (
    <main className="min-h-screen flex items-center justify-center  px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg  p-8">
          <h1 className="text-2xl font-bold text-center mb-8">ApplyKit 회원가입</h1>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-1">
                기관명
              </label>
              <input
                id="orgName"
                name="orgName"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="우리 기관"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="8자 이상"
              />
            </div>

            {state?.error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}