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
 */
export function ApplicationReadOnlyView({
  schema,
  value,
  files,
}: ApplicationReadOnlyViewProps) {
  if (schema.fields.length === 0) {
    return (
      <div
        className="rounded-lg border p-8 text-center"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--gray-500)" }}
      >
        양식 정보가 없습니다.
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border p-6 space-y-6"
      style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
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
    <div
      className="pb-4 border-b last:border-0 last:pb-0"
      style={{ borderColor: "var(--navy-700)" }}
    >
      <p className="text-sm font-medium mb-2" style={{ color: "var(--gray-300)" }}>
        {field.label}
        {field.required && <span className="ml-1" style={{ color: "var(--accent-rose)" }}>*</span>}
      </p>

      {field.type === 'file' ? (
        <FileFieldReadOnly files={fieldFiles} />
      ) : (
        <ReadOnlyValue field={field} value={value} />
      )}
    </div>
  );
}

function ReadOnlyValue({
  field,
  value,
}: {
  field: FormField;
  value: ApplicationFormData[string] | undefined;
}) {
  const isEmpty =
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);

  if (isEmpty) {
    return <p className="text-sm" style={{ color: "var(--gray-500)" }}>답변 없음</p>;
  }

  if (field.type === 'checkbox' && Array.isArray(value)) {
    return (
      <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--gray-200)" }}>
        {value.join(', ')}
      </p>
    );
  }

  if (field.type === 'date' && typeof value === 'string') {
    return (
      <p className="text-sm" style={{ color: "var(--gray-200)" }}>
        {new Date(value).toLocaleDateString('ko-KR')}
      </p>
    );
  }

  return (
    <p className="text-sm whitespace-pre-wrap wrap-break-word" style={{ color: "var(--gray-200)" }}>
      {String(value)}
    </p>
  );
}

function FileFieldReadOnly({ files }: { files: ApplicationFile[] }) {
  const signedUrlMutation = useFileSignedUrl();

  if (files.length === 0) {
    return <p className="text-sm" style={{ color: "var(--gray-500)" }}>첨부 파일 없음</p>;
  }

  async function handleDownload(fileId: string) {
    try {
      const result = await signedUrlMutation.mutateAsync(fileId);
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
          className="flex items-center justify-between px-3 py-2 border rounded-md"
          style={{ borderColor: "var(--navy-600)" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--gray-200)" }}>
              {file.file_name}
            </p>
            <p className="text-xs" style={{ color: "var(--gray-500)" }}>
              {formatFileSize(file.size_bytes)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDownload(file.id)}
            disabled={signedUrlMutation.isPending}
            className="ml-3 px-3 py-1 text-sm border rounded disabled:opacity-50"
            style={{ borderColor: "var(--brand-500)", color: "var(--brand-500)" }}
          >
            {signedUrlMutation.isPending ? '준비 중...' : '다운로드'}
          </button>
        </li>
      ))}
    </ul>
  );
}
