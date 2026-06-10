// 지원 가능한 필드 타입
export type FieldType = 
  | 'text'        // 한 줄 텍스트
  | 'textarea'    // 여러 줄 텍스트
  | 'email'       // 이메일
  | 'phone'       // 전화번호
  | 'number'      // 숫자
  | 'date'        // 날짜
  | 'select'      // 드롭다운 선택
  | 'radio'       // 라디오 버튼
  | 'checkbox'    // 체크박스
  | 'file'        // 파일 업로드

// 개별 필드 정의
export interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  options?: string[]      // select, radio, checkbox용
  maxLength?: number      // text, textarea용
  accept?: string         // file용 (예: '.pdf,.doc')
  maxFileSize?: number    // file용 (MB 단위)
  // 심사 아카이브 검색용 - review_results.company_name
  // 운영기관 폼 빌더에서 테스트 필드 하나에 체크해서 지정
  // text , textarea 에만 유효 적용
  isCompanyName?: boolean;
}

// 전체 폼 스키마
export interface FormSchema {
  fields: FormField[]
  version: number
}

// 기본 폼 스키마
export const DEFAULT_FORM_SCHEMA: FormSchema = {
  fields: [
    {
      id: 'name',
      type: 'text',
      label: '이름',
      placeholder: '',
      required: true,
    },
    {
      id: 'email',
      type: 'email',
      label: '이메일',
      placeholder: '',
      required: true,
    },
    {
      id: 'phone',
      type: 'phone',
      label: '연락처',
      placeholder: '010-xxxx-xxxx',
      required: true,
    },
  ],
  version: 1,
}

// 필드 타입 라벨
export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: '텍스트',
  textarea: '장문 텍스트',
  email: '이메일',
  phone: '전화번호',
  number: '숫자',
  date: '날짜',
  select: '드롭다운',
  radio: '라디오 버튼',
  checkbox: '체크박스',
  file: '파일 업로드',
}