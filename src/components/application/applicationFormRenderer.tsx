'use client';

import { useState } from 'react';
import { FormField, FormSchema } from '@/src/types/form';
import { ApplicationFormData } from '@/src/types/applications';
import {
  ApplicationFile,
  formatFileSize,
} from '@/src/types/applicationFile';

interface ApplicationFormRendererProps {
  schema: FormSchema;
  value: ApplicationFormData;
  onChange: (fieldId: string, fieldValue: ApplicationFormData[string]) => void;
  errors?: Record<string, string>;

  // ↓ 5-3단계 추가: 파일 업로드 관련 props
  // applicationId가 null이면 아직 draft가 없는 상태 - 파일 업로드 시 자동 생성됨
  applicationId: string | null;
  // 현재 지원서에 업로드된 파일들 - field_key별로 필터링해서 표시
  uploadedFiles: ApplicationFile[];
  // 파일 업로드 핸들러 - 부모가 draft 생성 + 업로드를 처리
  onFileUpload: (fieldKey: string, file: File) => Promise<void>;
  // 파일 삭제 핸들러
  onFileDelete: (fileId: string) => Promise<void>;
  // 업로드 진행 중인 field_key 목록 - 해당 필드 disable 처리
  uploadingFields: Set<string>;
}

export function ApplicationFormRenderer({
  schema,
  value,
  onChange,
  errors,
  applicationId,
  uploadedFiles,
  onFileUpload,
  onFileDelete,
  uploadingFields,
}: ApplicationFormRendererProps) {
  if (schema.fields.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        이 공고에는 아직 양식이 등록되지 않았습니다.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {schema.fields.map((field) => (
        <FieldRenderer
          key={field.id}
          field={field}
          value={value[field.id]}
          onChange={(v) => onChange(field.id, v)}
          error={errors?.[field.id]}
          // 파일 필드용 props - 다른 필드는 안 쓰지만 props drilling 회피용
          applicationId={applicationId}
          // 이 필드에 속한 파일만 필터링해서 전달
          fieldFiles={uploadedFiles.filter((f) => f.field_key === field.id)}
          onFileUpload={(file) => onFileUpload(field.id, file)}
          onFileDelete={onFileDelete}
          isUploading={uploadingFields.has(field.id)}
        />
      ))}
    </div>
  );
}

interface FieldRendererProps {
  field: FormField;
  value: ApplicationFormData[string] | undefined;
  onChange: (value: ApplicationFormData[string]) => void;
  error?: string;
  applicationId: string | null;
  fieldFiles: ApplicationFile[];
  onFileUpload: (file: File) => Promise<void>;
  onFileDelete: (fileId: string) => Promise<void>;
  isUploading: boolean;
}

function FieldRenderer({
  field,
  value,
  onChange,
  error,
  fieldFiles,
  onFileUpload,
  onFileDelete,
  isUploading,
}: FieldRendererProps) {
  const baseInputClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    error ? 'border-red-500' : 'border-gray-300'
  }`;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* 텍스트 계열 - 5-1단계 그대로 */}
      {(field.type === 'text' ||
        field.type === 'email' ||
        field.type === 'phone' ||
        field.type === 'number' ||
        field.type === 'date') && (
        <input
          type={
            field.type === 'phone'
              ? 'tel'
              : field.type === 'date'
                ? 'date'
                : field.type
          }
          placeholder={field.placeholder}
          value={
            typeof value === 'string' || typeof value === 'number'
              ? String(value)
              : ''
          }
          onChange={(e) => {
            if (field.type === 'number') {
              onChange(e.target.value === '' ? null : Number(e.target.value));
            } else {
              onChange(e.target.value);
            }
          }}
          maxLength={field.maxLength}
          className={baseInputClass}
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          placeholder={field.placeholder}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          maxLength={field.maxLength}
          rows={4}
          className={baseInputClass}
        />
      )}

      {field.type === 'select' && (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        >
          <option value="">선택하세요</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {field.type === 'radio' && (
        <div className="space-y-2">
          {field.options?.map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={field.id}
                value={opt}
                checked={value === opt}
                onChange={(e) => onChange(e.target.value)}
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === 'checkbox' && (
        <div className="space-y-2">
          {field.options?.map((opt) => {
            const selected = Array.isArray(value) ? value : [];
            const isChecked = selected.includes(opt);

            return (
              <label
                key={opt}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selected, opt]);
                    } else {
                      onChange(selected.filter((v) => v !== opt));
                    }
                  }}
                />
                <span className="text-sm">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* ↓ 파일 필드 - 5-3단계에서 실제 업로드 연결 */}
      {field.type === 'file' && (
        <FileFieldRenderer
          field={field}
          files={fieldFiles}
          onUpload={onFileUpload}
          onDelete={onFileDelete}
          isUploading={isUploading}
        />
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {field.maxLength &&
        (field.type === 'text' || field.type === 'textarea') && (
          <p className="mt-1 text-xs text-gray-500 text-right">
            {typeof value === 'string' ? value.length : 0} / {field.maxLength}
          </p>
        )}
    </div>
  );
}

/**
 * 파일 필드 전용 렌더러
 * - 업로드된 파일 목록 표시
 * - 새 파일 업로드 input
 * - 클라이언트 사이드 검증 (파일 크기, 형식)
 */
function FileFieldRenderer({
  field,
  files,
  onUpload,
  onDelete,
  isUploading,
}: {
  field: FormField;
  files: ApplicationFile[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (fileId: string) => Promise<void>;
  isUploading: boolean;
}) {
  // 클라이언트 사이드 검증 에러
  // 서버 에러는 부모가 mutation.error로 표시, 여기는 즉시 피드백용
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. 파일 크기 검증
    // maxFileSize는 MB 단위이므로 바이트로 환산해서 비교
    if (field.maxFileSize) {
      const maxBytes = field.maxFileSize * 1024 * 1024;
      if (file.size > maxBytes) {
        setValidationError(
          `파일 크기는 ${field.maxFileSize}MB 이하여야 합니다.`,
        );
        // input 초기화 - 사용자가 다른 파일 선택할 수 있도록
        e.target.value = '';
        return;
      }
    }

    // 2. 파일 형식 검증 (확장자 기준)
    // accept는 ".pdf,.doc,.docx" 형식의 문자열
    if (field.accept) {
      const allowed = field.accept
        .split(',')
        .map((ext) => ext.trim().toLowerCase());
      const fileName = file.name.toLowerCase();
      const isAllowed = allowed.some((ext) => fileName.endsWith(ext));

      if (!isAllowed) {
        setValidationError(`허용된 파일 형식이 아닙니다: ${field.accept}`);
        e.target.value = '';
        return;
      }
    }

    // 검증 통과 - 업로드 시작
    setValidationError(null);
    try {
      await onUpload(file);
      // 업로드 성공 시 input 초기화 - 같은 파일 다시 선택 가능하게
      e.target.value = '';
    } catch (err) {
      // 부모가 에러를 surface하므로 여기서는 console만
      console.error('[FileFieldRenderer] upload failed', err);
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-3">
      {/* 업로드된 파일 목록 */}
      {files.length > 0 && (
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
                onClick={() => onDelete(file.id)}
                className="ml-3 px-2 py-1 text-sm text-red-600 border border-red-300 rounded"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 업로드 input */}
      <div className="px-3 py-4 border border-dashed border-gray-300 rounded-md">
        <input
          type="file"
          accept={field.accept}
          onChange={handleFileChange}
          disabled={isUploading}
          className="block w-full text-sm"
        />
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          {field.accept && <p>허용 형식: {field.accept}</p>}
          {field.maxFileSize && <p>최대 크기: {field.maxFileSize}MB</p>}
          {isUploading && <p className="text-blue-600">업로드 중...</p>}
        </div>
      </div>

      {/* 클라이언트 사이드 검증 에러 */}
      {validationError && (
        <p className="text-sm text-red-600">{validationError}</p>
      )}
    </div>
  );
}