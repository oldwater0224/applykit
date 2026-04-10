import { FormSchema } from './form'

export interface Program {
  id: string
  org_id: string
  title: string
  description: string | null
  status: string
  slug: string | null
  deadline: string | null
  form_schema: FormSchema | null
  screening_criteria: Record<string, unknown> | null
  created_at: string
}

export interface CreateProgramData {
  title: string
  description?: string
  status?: string
  slug?: string
  deadline?: string
  form_schema?: FormSchema
}

export interface UpdateProgramData extends Partial<CreateProgramData> {
  id: string
}