"use client";

import { ALLOWED_FILES_LABEL } from "@/src/lib/file/allowedTypes";
import { useFormBuilderStore } from "@/src/stores/formbuilderstore";
import { FormField, FieldType, FIELD_TYPE_LABELS } from "@/src/types/form";
import { useId } from "react";

export function FormBuilder() {
  const {
    schema,
    selectedFieldId,
    addField,
    removeField,
    selectField,
    moveField,
  } = useFormBuilderStore();
  const fieldIdPrefix = useId();

  function handleAddField(type: FieldType) {
    const randomId = crypto
      .getRandomValues(new Uint8Array(8))
      .reduce((acc, byte) => acc + byte.toString(16).padStart(2, "0"), "");
    const newField: FormField = {
      id: `${fieldIdPrefix}_${randomId}`,
      type,
      label: `새 ${FIELD_TYPE_LABELS[type]} 필드`,
      required: false,
      options:
        type === "select" || type === "radio" || type === "checkbox"
          ? ["옵션 1", "옵션 2"]
          : undefined,
    };
    addField(newField);
    selectField(newField.id); // 추가 직후에 자동으로 선택
  }

  function handleMoveUp(index: number) {
    if (index > 0) {
      moveField(index, index - 1);
    }
  }

  function handleMoveDown(index: number) {
    if (index < schema.fields.length - 1) {
      moveField(index, index + 1);
    }
  }

  return (
    <div className="space-y-4">
      {/* 필드 목록 */}
      <div className="bg-white rounded-lg shadow p-4 space-y-2">
        {schema.fields.length === 0 ? (
          <p className="text-gray-500 text-center py-4">필드를 추가해주세요</p>
        ) : (
          schema.fields.map((field, index) => (
            <FieldItem
              key={field.id}
              field={field}
              index={index}
              isSelected={selectedFieldId === field.id}
              onSelect={() => selectField(field.id)}
              onRemove={() => removeField(field.id)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              isFirst={index === 0}
              isLast={index === schema.fields.length - 1}
            />
          ))
        )}
      </div>
      {/* 선택된 필드 편집 */}
      {selectedFieldId && <FieldEditor fieldId={selectedFieldId} />}
      {/* 필드 추가 버튼들 */}
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">필드 추가</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleAddField(type)}
              className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 text-left"
            >
              {FIELD_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldItem({
  field,
  
  isSelected,
  onSelect,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  field: FormField;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div
      onClick={onSelect}
      className={`p-3 border rounded cursor-pointer transition ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
            {FIELD_TYPE_LABELS[field.type]}
          </span>
          <span className="font-medium">{field.label}</span>
          {field.required && <span className="text-red-500 text-xs">필수</span>}
          {field.isCompanyName && (
            <span className="text-xs px-2 py-0.5 border border-blue-300 text-blue-600 rounded">
              회사명
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={isFirst}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={isLast}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            ↓
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldEditor({ fieldId }: { fieldId: string }) {
  const { schema, updateField, setCompanyNameField } = useFormBuilderStore();
  const field = schema.fields.find((f) => f.id === fieldId);

  if (!field) return null;

  const hasOptions = ["select", "radio", "checkbox"].includes(field.type);
  const isFileField = field.type === "file"; // ← 추가
  // 회사명 지정 가능한 타입 - 텍스트만
  const canBeCompanyName = field.type === "text" || field.type === "textarea";

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <h3 className="font-medium">필드 설정</h3>

      <div>
        <label className="block text-sm text-gray-600 mb-1">라벨</label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => updateField(fieldId, { label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">플레이스홀더</label>
        <input
          type="text"
          value={field.placeholder || ""}
          onChange={(e) =>
            updateField(fieldId, { placeholder: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="required"
          checked={field.required}
          onChange={(e) => updateField(fieldId, { required: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="required" className="text-sm text-gray-600">
          필수 입력
        </label>
      </div>
      {/* ↓ 회사명 필드 지정 (text/textarea만) */}
      {canBeCompanyName && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`company-name-${fieldId}`}
              checked={!!field.isCompanyName}
              onChange={(e) => setCompanyNameField(fieldId, e.target.checked)}
              className="rounded"
            />
            <label
              htmlFor={`company-name-${fieldId}`}
              className="text-sm text-gray-600"
            >
              회사명 필드로 사용
            </label>
          </div>
          <p className="mt-1 ml-6 text-xs text-gray-500">
            심사 결과 저장 시 이 필드의 값이 아카이브 검색의 키가 됩니다. 폼당
            하나만 지정할 수 있습니다.
          </p>
        </div>
      )}

      {hasOptions && (
        <OptionsEditor
          options={field.options || []}
          onChange={(options) => updateField(fieldId, { options })}
        />
      )}

      {/* ↓ 파일 필드 전용 설정 추가 */}
      {isFileField && (
        <div className="border-t pt-4 space-y-2">
          <p className="text-sm font-medium">파일 업로드 설정</p>
          <p className="text-xs text-gray-500">
            MVP에서는 {ALLOWED_FILES_LABEL} 파일만 허용되며, 최대 10MB까지
            업로드 가능합니다.
          </p>
        </div>
      )}
    </div>
  );
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  function handleAdd() {
    onChange([...options, `옵션 ${options.length + 1}`]);
  }

  function handleRemove(index: number) {
    onChange(options.filter((_, i) => i !== index));
  }

  function handleChange(index: number, value: string) {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange(newOptions);
  }

  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">옵션</label>
      <div className="space-y-2">
        {options.map((opt, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={opt}
              onChange={(e) => handleChange(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => handleRemove(index)}
              className="px-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={handleAdd}
          className="text-sm text-blue-600 hover:underline"
        >
          + 옵션 추가
        </button>
      </div>
    </div>
  );
}
