'use client';

import { useParams } from 'next/navigation';
import { useProgram, useUpdateProgram } from '@/src/hooks/usePrograms';
import { useFormBuilderStore } from '@/src/stores/formbuilderstore';
import { useEffect } from 'react';
import Link from 'next/link';
import { FormBuilder } from './formBuilder';
import { FormPreview } from './formPreview';

export default function ProgramDetailPage() {
  const params = useParams();
  const programId = params.id as string;

  const { data: program, isLoading, error } = useProgram(programId);
  const updateProgram = useUpdateProgram();
  const { schema, isDirty, initSchema, markSaved } = useFormBuilderStore();

  // 프로그램 로드 시 폼 스키마 초기화
  // program.id가 바뀔 때만 실행되도록 해서, 편집 중 refetch로 인한 덮어쓰기 방지
  // (의존성에 form_schema를 넣으면 refetch 시마다 스토어가 초기화되어
  //  사용자가 편집하던 내용이 날아갈 수 있음)
  useEffect(() => {
    if (!program) return;
    // FormSchema는 types/program.ts에서 이미 올바른 타입으로 선언되어 있으므로
    // 별도 캐스팅 없이 그대로 전달
    initSchema(program.form_schema ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program?.id]);

  if (isLoading) {
    return <div className="p-8">로딩 중...</div>;
  }

  if (error || !program) {
    return <div className="p-8 text-red-600">프로그램을 찾을 수 없습니다.</div>;
  }

  async function handleSave() {
    // Server Action 에러 플로우는 use-programs.ts의 mutationFn에서
    // throw로 변환되므로, 여기서는 try-catch로 잡으면 됨
    try {
      await updateProgram.mutateAsync({
        id: programId,
        form_schema: schema,
      });
      // 저장 성공 시 isDirty를 false로 전환
      // -> 버튼이 disabled 상태로 돌아가고 "저장되지 않은 변경사항" 표시가 사라짐
      markSaved();
    } catch (err) {
      // 실제 에러 메시지는 mutation.error에도 담겨서 UI로 표시됨
      // 콘솔 로그는 디버깅용
      console.error('[handleSave]', err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link
                href="/dashboard/programs"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← 공고 목록
              </Link>
              <h1 className="text-xl font-bold mt-1">{program.title}</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* 저장 상태 피드백 - 우선순위: 에러 > 저장 중 > 변경사항 > 저장됨 */}
              {updateProgram.isError && (
                <span className="text-sm text-red-600">
                  {updateProgram.error instanceof Error
                    ? updateProgram.error.message
                    : '저장에 실패했습니다.'}
                </span>
              )}
              {!updateProgram.isError && isDirty && (
                <span className="text-sm text-amber-600">
                  저장되지 않은 변경사항
                </span>
              )}
              {!updateProgram.isError &&
                !isDirty &&
                updateProgram.isSuccess && (
                  <span className="text-sm text-green-600">저장됨</span>
                )}
              <button
                onClick={handleSave}
                disabled={!isDirty || updateProgram.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateProgram.isPending ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">양식 편집</h2>
            <FormBuilder />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">미리보기</h2>
            <FormPreview />
          </div>
        </div>
      </div>
    </div>
  );
}