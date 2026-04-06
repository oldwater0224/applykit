'use server'

import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'

interface AuthState {
  error: string
}

export async function signUp(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const orgName = formData.get('orgName') as string

  if (!email || !password || !name || !orgName) {
    return { error: '모든 필드를 입력해주세요.' }
  }

  if (password.length < 6) {
    return { error: '비밀번호는 6자 이상이어야 합니다.' }
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: '회원가입에 실패했습니다.' }
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: orgName })
    .select()
    .single()

  if (orgError) {
    return { error: '기관 생성에 실패했습니다: ' + orgError.message }
  }

  const { error: memberError } = await supabase
    .from('org_members')
    .insert({
      org_id: org.id,
      user_id: authData.user.id,
      role: 'admin',
      email: email,
    })

  if (memberError) {
    return { error: '멤버 등록에 실패했습니다: ' + memberError.message }
  }

  redirect('/dashboard')
}

export async function signIn(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 입력해주세요.' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }

  redirect('/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}