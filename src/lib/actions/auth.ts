"use server";

// 인증 관련 서버 액션
// 회원가입, 로그인, 로그아웃 처리
//
// 권한 모델:
// - 회원가입한 사용자는 기본적으로 "지원자"
// - 운영기관 권한은 organizations + org_members에 수동 등록되어야 함
//   (현재 MVP는 단일 운영기관, 운영진은 SQL로 직접 등록)

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface AuthState {
  error: string;
}

export async function signUp(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { error: "모든 필드를 입력해주세요." };
  }

  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다." };
  }

  // Supabase Auth 회원가입만 - 운영기관 멤버십은 별도 절차
  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  // 가입 후 지원자 화면으로 이동
  // 운영기관 멤버는 /dashboard에서 자동으로 운영기관 화면을 받음
  redirect("/applications");
}

export async function signIn(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  const { data : authData , error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  // 운영기관 멤버 확인
  const {data : orgMember} = await supabase
  .from("org_members")
  .select("org_id")
  .eq("user_id", authData.user.id)
  //결과 없어도 에러가 아닌 Null 반환 - maybeSingle
  .maybeSingle()
  // 운영기관 멤버는 대시보드로 , 아니면 지원자 화면으로
  if(orgMember){
    revalidatePath("/", "layout");
    redirect("/dashboard")
  }else {
  revalidatePath("/", "layout");
  redirect("/programs")};
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}