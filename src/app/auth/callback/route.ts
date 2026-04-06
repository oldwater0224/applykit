import { createClient } from "@/src/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest){
  const {searchParams , origin} = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if(code){
    const supabase = await createClient()
    const {error} = await supabase.auth.exchangeCodeForSession(code)

    if(!error){
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 에러 나면 로그인페이지로
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}