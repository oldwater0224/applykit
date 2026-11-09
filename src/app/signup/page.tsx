"use client";

import { useActionState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PAGE_TITLE_CLASS } from "@/src/components/layout/pageTitle";
import { signUp } from "@/src/lib/actions/auth";

const initialState = { error: "" };

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <section aria-labelledby="signup-title" className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-(--card-border) bg-(--card-bg) p-6 sm:p-8">
          <h1 id="signup-title" className={cn(PAGE_TITLE_CLASS, "mb-6 text-center sm:mb-8")}>
            ApplyKit 회원가입
          </h1>

          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block mb-1.5 text-xs sm:text-[13px] font-medium text-(--text-secondary)"
              >
                이름
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="input-autofill-dark h-10 w-full rounded-md border border-(--hairline-strong) bg-(--navy-800) px-3 text-base sm:text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none transition-colors focus-visible:border-(--brand-500) focus-visible:ring-2 focus-visible:ring-(--dash-focus-ring)"
                placeholder="홍길동"
              />
            </div>

            {/* orgName input 제거 - 회원가입은 지원자 등록만 */}

            <div>
              <label
                htmlFor="email"
                className="block mb-1.5 text-xs sm:text-[13px] font-medium text-(--text-secondary)"
              >
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input-autofill-dark h-10 w-full rounded-md border border-(--hairline-strong) bg-(--navy-800) px-3 text-base sm:text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none transition-colors focus-visible:border-(--brand-500) focus-visible:ring-2 focus-visible:ring-(--dash-focus-ring)"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block mb-1.5 text-xs sm:text-[13px] font-medium text-(--text-secondary)"
              >
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="input-autofill-dark h-10 w-full rounded-md border border-(--hairline-strong) bg-(--navy-800) px-3 text-base sm:text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none transition-colors focus-visible:border-(--brand-500) focus-visible:ring-2 focus-visible:ring-(--dash-focus-ring)"
                placeholder="8자 이상"
              />
            </div>

            {state?.error && (
              <div className="rounded-md border border-(--accent-rose)/30 bg-(--accent-rose)/12 p-3 text-xs sm:text-[13px] text-(--dash-negative-text)">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="h-10 w-full rounded-md bg-(--brand-600) px-4 text-sm font-medium text-white transition-colors hover:bg-(--brand-700) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-500) disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-(--brand-600)"
            >
              {pending ? "가입 중..." : "회원가입"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs sm:text-[13px] text-(--text-secondary)">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-(--brand-500) underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-500)">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}