"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PAGE_TITLE_CLASS } from "@/src/components/layout/pageTitle";
import { signIn } from "@/src/lib/actions/auth";

const initialState = { error: "" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "";

  return (
    <section aria-labelledby="login-title" className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-(--card-border) bg-(--card-bg) p-6 sm:p-8">
          <h1 id="login-title" className={cn(PAGE_TITLE_CLASS, "mb-6 text-center sm:mb-8")}>
            ApplyKit 로그인
          </h1>

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="redirect" value={redirectTo} />
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
                className="input-autofill-dark h-10 w-full rounded-md border border-(--hairline-strong) bg-(--navy-800) px-3 text-base sm:text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none transition-colors focus-visible:border-(--brand-500) focus-visible:ring-2 focus-visible:ring-(--dash-focus-ring)"
                placeholder="••••••••"
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
              {pending ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs sm:text-[13px] text-(--text-secondary)">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="font-medium text-(--brand-500) underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-500)">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
