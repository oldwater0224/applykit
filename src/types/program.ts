import { FormSchema } from './form';

export interface Program {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  status: string;
  slug: string | null;
  deadline: string | null;
  form_schema: FormSchema | null;
  screening_criteria: Record<string, unknown> | null;
  created_at: string;
  // 조인 결과로 받는 기관 정보 - 모든 쿼리에서 가져오진 않으므로 optional
  // useProgram에서만 채워짐
  organizations?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateProgramData {
  title: string;
  description?: string;
  status?: string;
  slug?: string;
  deadline?: string;
  form_schema?: FormSchema;
}

export interface UpdateProgramData extends Partial<CreateProgramData> {
  id: string;
}