import { CreateProgramData, Program, UpdateProgramData } from "@/src/types/program";
import { createClient } from "../supabase/client";

// 프로그램 목록 조회
export async function getPrograms(orgId: string): Promise<Program[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// 프로그램 단일 조회 (추가)
export async function getProgram(id: string): Promise<Program> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// 프로그램 생성 (함수명 수정)
export async function createProgram(orgId: string, programData: CreateProgramData): Promise<Program> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('programs')
    .insert({
      org_id: orgId,
      ...programData,
      status: programData.status || 'draft',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// 프로그램 수정 (타입 수정)
export async function updateProgram({ id, ...updateData }: UpdateProgramData): Promise<Program> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('programs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// 프로그램 삭제
export async function deleteProgram(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('programs')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}