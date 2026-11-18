"use server";

// 기존 가입자 재동의 (#69)
// proxy가 현재 버전 미동의 사용자를 /consent?redirect=<원래 경로> 로 보내고,
// 이 액션이 동의를 기록한 뒤 원래 경로로 돌려보낸다.

import { createClient } from "@/src/lib/supabase/server";
import {
  PRIVACY_VERSION,
  TERMS_VERSION,
  parseConsentForm,
} from "@/src/lib/consent/policy";
import { safeRedirectPath } from "@/src/lib/safeRedirect";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface ConsentState {
  error: string;
}

export async function acceptConsents(
  prevState: ConsentState,
  formData: FormData,
): Promise<ConsentState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/consent");
  }

  const consent = parseConsentForm(formData);
  if (!consent.ok) {
    return { error: consent.error };
  }

  // 버전은 클라이언트 값이 아니라 서버 상수로 기록한다.
  // RLS(user_consents_insert_own)는 본인 user_id, source='reconsent' 행만 허용한다.
  const { error } = await supabase.from("user_consents").insert([
    {
      user_id: user.id,
      kind: "terms",
      version: TERMS_VERSION,
      agreed: true,
      source: "reconsent",
    },
    {
      user_id: user.id,
      kind: "privacy",
      version: PRIVACY_VERSION,
      agreed: true,
      source: "reconsent",
    },
    {
      user_id: user.id,
      kind: "age14",
      version: null,
      agreed: true,
      source: "reconsent",
    },
  ]);

  if (error) {
    console.error("[acceptConsents] 동의 기록 실패", error.message);
    return { error: "동의를 저장하지 못했습니다. 잠시 후 다시 시도해주세요." };
  }

  revalidatePath("/", "layout");
  redirect(safeRedirectPath(formData.get("redirect") as string | null));
}
