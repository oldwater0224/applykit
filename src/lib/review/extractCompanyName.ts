// 회사명 추출 로직만 따로 분리 , 

// 폼 데이터에서 회사명 추출
// review_results.company_name에 저장되어 아카이브 검색의 키가 됨
//
// 우선순위:
// 1. isCompanyName 플래그가 true인 필드 (운영기관이 명시)
// 2. 라벨에 "회사/기관/업체/사업자/스타트업"이 포함된 첫 텍스트 필드 (fallback)
// 3. 둘 다 없으면 null (검색에서 누락 - 의도된 동작)

import { FormSchema } from "@/src/types/form";
import { ApplicationFormData } from "@/src/types/applications";

const COMPANY_KEYWORD_REGEX = /회사|기관|업체|사업자|스타트업/;

export function extractCompanyName(
  schema: FormSchema,
  formData: ApplicationFormData,
): string | null {
  // 1순위: 명시적 플래그
  const explicitField = schema.fields.find((f) => f.isCompanyName);
  if (explicitField) {
    const value = formData[explicitField.id];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  // 2순위: 라벨 키워드 매칭 (text/textarea만)
  const fallbackField = schema.fields.find(
    (f) =>
      (f.type === "text" || f.type === "textarea") &&
      COMPANY_KEYWORD_REGEX.test(f.label),
  );
  if (fallbackField) {
    const value = formData[fallbackField.id];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}