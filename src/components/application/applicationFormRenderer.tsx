"use client";

import { useState } from "react";
import { FormField, FormSchema } from "@/src/types/form";
import { ApplicationFormData } from "@/src/types/applications";
import { ApplicationFile, formatFileSize } from "@/src/types/applicationFile";
import { ACCEPT_ATTRIBUTE, ALLOWED_FILES_LABEL, isAllowedFile } from "@/src/lib/file/allowedTypes";

interface ApplicationFormRendererProps {
  schema: FormSchema;
  value: ApplicationFormData;
  onChange: (fieldId: string, fieldValue: ApplicationFormData[string]) => void;
  errors?: Record<string, string>;
  applicationId: string | null;
  uploadedFiles: ApplicationFile[];
  onFileUpload: (fieldKey: string, file: File) => Promise<void>;
  onFileDelete: (fileId: string) => Promise<void>;
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
      <div
        className="rounded-lg border p-8 text-center"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--gray-500)" }}
      >
        이 공고에는 아직 양식이 등록되지 않았습니다.
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border p-6 space-y-6"
      style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      {schema.fields.map((field) => (
        <FieldRenderer
          key={field.id}
          field={field}
          value={value[field.id]}
          onChange={(v) => onChange(field.id, v)}
          error={errors?.[field.id]}
          applicationId={applicationId}
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
  // 입력 필드 공통 스타일 — 다크 테마 인라인 적용
  const inputStyle: React.CSSProperties = {
    backgroundColor: "var(--navy-800)",
    borderColor: error ? "var(--accent-rose)" : "var(--navy-600)",
    color: "var(--gray-100)",
  };

  const baseInputClass =
    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]";

  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: "var(--gray-300)" }}>
        {field.label}
        {field.required && <span className="ml-1" style={{ color: "var(--accent-rose)" }}>*</span>}
      </label>

      {/* 텍스트 계열 */}
      {(field.type === "text" ||
        field.type === "email" ||
        field.type === "phone" ||
        field.type === "number" ||
        field.type === "date") && (
        <input
          type={
            field.type === "phone"
              ? "tel"
              : field.type === "date"
                ? "date"
                : field.type
          }
          placeholder={field.placeholder}
          value={
            typeof value === "string" || typeof value === "number"
              ? String(value)
              : ""
          }
          onChange={(e) => {
            if (field.type === "number") {
              onChange(e.target.value === "" ? null : Number(e.target.value));
            } else {
              onChange(e.target.value);
            }
          }}
          maxLength={field.maxLength}
          className={baseInputClass}
          style={inputStyle}
        />
      )}

      {field.type === "textarea" && (
        <textarea
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          maxLength={field.maxLength}
          rows={4}
          className={baseInputClass}
          style={inputStyle}
        />
      )}

      {field.type === "select" && (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
          style={inputStyle}
        >
          <option value="">선택하세요</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {field.type === "radio" && (
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
              <span className="text-sm" style={{ color: "var(--gray-200)" }}>{opt}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === "checkbox" && (
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
                <span className="text-sm" style={{ color: "var(--gray-200)" }}>{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* 파일 필드 */}
      {field.type === "file" && (
        <FileFieldRenderer
          field={field}
          files={fieldFiles}
          onUpload={onFileUpload}
          onDelete={onFileDelete}
          isUploading={isUploading}
        />
      )}

      {error && <p className="mt-1 text-sm" style={{ color: "var(--accent-rose)" }}>{error}</p>}

      {field.maxLength &&
        (field.type === "text" || field.type === "textarea") && (
          <p className="mt-1 text-xs text-right" style={{ color: "var(--gray-500)" }}>
            {typeof value === "string" ? value.length : 0} / {field.maxLength}
          </p>
        )}
    </div>
  );
}

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
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field.maxFileSize) {
      const maxBytes = field.maxFileSize * 1024 * 1024;
      if (file.size > maxBytes) {
        setValidationError(
          `파일 크기는 ${field.maxFileSize}MB 이하여야 합니다.`,
        );
        e.target.value = "";
        return;
      }
    }

    if (!isAllowedFile(file)) {
      setValidationError(`${ALLOWED_FILES_LABEL} 파일만 업로드할 수 있습니다.`);
      e.target.value = "";
      return;
    }

    setValidationError(null);
    try {
      await onUpload(file);
      e.target.value = "";
    } catch (err) {
      console.error("[FileFieldRenderer] upload failed", err);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {files.length > 0 && (
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
                onClick={() => onDelete(file.id)}
                className="ml-3 px-2 py-1 text-sm border rounded"
                style={{ color: "var(--accent-rose)", borderColor: "var(--accent-rose)" }}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 업로드 input */}
      <div
        className="px-3 py-4 border border-dashed rounded-md"
        style={{ borderColor: "var(--navy-600)" }}
      >
        <input
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          onChange={handleFileChange}
          disabled={isUploading}
          className="block w-full text-sm"
          style={{ color: "var(--gray-300)" }}
        />
        <div className="mt-2 text-xs space-y-1" style={{ color: "var(--gray-500)" }}>
          {field.accept && <p>허용 형식: {field.accept}</p>}
          {field.maxFileSize && <p>최대 크기: {field.maxFileSize}MB</p>}
          {isUploading && <p style={{ color: "var(--brand-500)" }}>업로드 중...</p>}
        </div>
      </div>

      {validationError && (
        <p className="text-sm" style={{ color: "var(--accent-rose)" }}>{validationError}</p>
      )}
    </div>
  );
}
