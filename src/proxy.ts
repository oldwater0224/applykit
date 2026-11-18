import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname, search } = request.nextUrl

  // 로그인 필요 경로
  const protectedPaths = ['/dashboard', '/applications'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isConsentPage = pathname === '/consent';

  if (!user && isProtected) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 재동의 화면은 로그인 필수 (동의는 로그인 사용자 기준으로 기록)
  // 원래 가려던 경로(/consent?redirect=...)를 잃지 않게 쿼리까지 넘긴다
  if (!user && isConsentPage) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', `/consent${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // 로그인 상태에서 /login 접근 시 대시보드로
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 현재 약관·처리방침 버전에 동의하지 않은 사용자는 보호 경로 진입 전 재동의 (#69)
  // /consent, /privacy, /terms, /login, /signup, /auth/callback 은 보호 경로가 아니므로 루프가 생기지 않는다.
  if (user && isProtected) {
    const { data: hasConsents, error } = await supabase.rpc('has_current_consents')

    if (error) {
      // 마이그레이션 적용 전(함수 없음)이나 일시 오류로 서비스가 막히지 않게 통과시킨다
      console.error('[proxy] has_current_consents 확인 실패', error.message)
    } else if (hasConsents === false) {
      const consentUrl = new URL('/consent', request.url)
      consentUrl.searchParams.set('redirect', `${pathname}${search}`)
      return NextResponse.redirect(consentUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}