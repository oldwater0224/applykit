'use client';

import { FormField, FormSchema } from '@/src/types/form';
import { ApplicationFormData } from '@/src/types/applications';
import {
  ApplicationFile,
  formatFileSize,
} from '@/src/types/applicationFile';
import { useFileSignedUrl } from '@/src/hooks/useApplicationFiles';

interface ApplicationReadOnlyViewProps {
  schema: FormSchema;
  value: ApplicationFormData;
  files: ApplicationFile[];
}

/**
 * 제출된 지원서를 읽기 전용으로 표시
 * - 편집 불가, 다운로드만 가능
 * - ApplicationFormRenderer와 로직이 겹치지만 관심사가 달라 분리
 * - placeholder가 아닌 "답변 없음" 명시 표시
 */
export function ApplicationReadOnlyView({
  schema,
  value,
  files,
}: ApplicationReadOnlyViewProps) {
  if (schema.fields.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        양식 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {schema.fields.map((field) => (
        <ReadOnlyField
          key={field.id}
          field={field}
          value={value[field.id]}
          fieldFiles={files.filter((f) => f.field_key === field.id)}
        />
      ))}
    </div>
  );
}

interface ReadOnlyFieldProps {
  field: FormField;
  value: ApplicationFormData[string] | undefined;
  fieldFiles: ApplicationFile[];
}

function ReadOnlyField({ field, value, fieldFiles }: ReadOnlyFieldProps) {
  return (
    <div className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
      <p className="text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </p>

      {field.type === 'file' ? (
        <FileFieldReadOnly files={fieldFiles} />
      ) : (
        <ReadOnlyValue field={field} value={value} />
      )}
    </div>
  );
}

/**
 * 텍스트 계열 필드의 값 표시
 * - 빈 값은 "답변 없음"으로 명시
 * - checkbox/radio는 선택된 값(들) 나열
 */
function ReadOnlyValue({
  field,
  value,
}: {
  field: FormField;
  value: ApplicationFormData[string] | undefined;
}) {
  // 빈 값 판정 - 작성 페이지의 validate 로직과 동일 기준
  const isEmpty =
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);

  if (isEmpty) {
    return <p className="text-sm text-gray-400">답변 없음</p>;
  }

  // 체크박스 - 배열을 쉼표로 나열
  if (field.type === 'checkbox' && Array.isArray(value)) {
    return (
      <p className="text-sm whitespace-pre-wrap">{value.join(', ')}</p>
    );
  }

  // 날짜 - 로캘 포맷으로 표시
  // DB에는 ISO 문자열로 저장됨 (예: "2026-04-15")
  if (field.type === 'date' && typeof value === 'string') {
    return (
      <p className="text-sm">
        {new Date(value).toLocaleDateString('ko-KR')}
      </p>
    );
  }

  // 텍스트/텍스트에어리어 - 줄바꿈 보존
  // whitespace-pre-wrap으로 사용자가 입력한 개행 그대로 표시
  return (
    <p className="text-sm whitespace-pre-wrap wrap-break-word">{String(value)}</p>
  );
}

/**
 * 파일 필드 읽기 전용 - 다운로드 버튼만 제공
 * - 클릭 시 signed URL 받아서 새 탭으로 열기
 * - 썸네일이나 미리보기는 추후 개선 사항
 */
function FileFieldReadOnly({ files }: { files: ApplicationFile[] }) {
  const signedUrlMutation = useFileSignedUrl();

  if (files.length === 0) {
    return <p className="text-sm text-gray-400">첨부 파일 없음</p>;
  }

  async function handleDownload(fileId: string) {
    try {
      const result = await signedUrlMutation.mutateAsync(fileId);
      // 새 탭에서 열기 - 다운로드 또는 브라우저 뷰어로 표시
      // window.open 대신 a 태그 클릭으로 처리하면 팝업 차단 회피 가능하지만
      // 이미 사용자 클릭 이벤트 안에 있어서 window.open으로 충분
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('[FileFieldReadOnly] signed url failed', err);
    }
  }

  return (
    <ul className="space-y-2">
      {files.map((file) => (
        <li
          key={file.id}
          className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-md"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.file_name}</p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size_bytes)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDownload(file.id)}
            disabled={signedUrlMutation.isPending}
            className="ml-3 px-3 py-1 text-sm border border-blue-300 text-blue-600 rounded disabled:opacity-50"
          >
            {signedUrlMutation.isPending ? '준비 중...' : '다운로드'}
          </button>
        </li>
      ))}
    </ul>
  );
}