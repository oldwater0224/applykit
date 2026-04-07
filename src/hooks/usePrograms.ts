'use client';

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authstore";
import { createProgram, deleteProgram, getProgram, getPrograms, updateProgram } from "../lib/api/programs";
import { CreateProgramData, UpdateProgramData } from "../types/program";


// 쿼리 키 상수
export const programKeys = {
  all : ['programs'] as const,
  list : (orgId : string) => [...programKeys.all, 'list', orgId] as const,
  detail : (id : string) => [...programKeys.all, 'detail', id] as const,
}

// 프로그램 목록 조회
export function usePrograms() {
  const {orgId} = useAuthStore();

  return useQuery({
    queryKey : programKeys.list(orgId || ""),
    queryFn : () => getPrograms(orgId!),
    enabled : !!orgId, // orgId가 있을 때만 쿼리 실행
  })
}

// 프로그램 상세 조회
export function useProgram(id : string){
  return useQuery({
    queryKey : programKeys.detail(id),
    queryFn : () => getProgram(id),
    enabled : !!id, // id가 있을 때만 쿼리 실행
  })
}

// 프로그램 생성
export function useCreateProgram(){
  const queryClient = useQueryClient();
  const {orgId} = useAuthStore();

  return useMutation({
    mutationFn : (programData : CreateProgramData) => createProgram(orgId!, programData),
    onSuccess : () => {
      
      queryClient.invalidateQueries({ queryKey: programKeys.list(orgId!) }); // 목록 쿼리 무효화
    }
  })  
}
  // 프로그램 수정
export function useUpdateProgram() {
  const queryClient = useQueryClient();
  const { orgId } = useAuthStore();

  return useMutation({
    mutationFn: (data: UpdateProgramData) => updateProgram(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: programKeys.list(orgId!) });
      queryClient.invalidateQueries({ queryKey: programKeys.detail(variables.id) });
    },
  });
}

// 프로그램 삭제
export function useDeleteProgram() {
  const queryClient = useQueryClient();
  const { orgId } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) => deleteProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.list(orgId!) });
    },
  });
}