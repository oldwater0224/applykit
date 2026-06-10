"use client";

import { ALLOWED_FILES_LABEL } from "@/src/lib/file/allowedTypes";
import { useFormBuilderStore } from "@/src/stores/formbuilderstore";
import { FormField, FieldType, FIELD_TYPE_LABELS } from "@/src/types/form";
import { useId } from "react";

const inputStyle: React.CSSProperties = {
  backgroundColor: "var(--navy-800)",
  borderColor: "var(--navy-600)",
  color: "var(--gray-100)",
};

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
    selectField(newField.id);
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
      <div
        className="rounded-lg border p-4 space-y-2"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        {schema.fields.length === 0 ? (
          <p className="text-center py-4" style={{ color: "var(--gray-500)" }}>
            필드를 추가해주세요
          </p>
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
      <div
        className="rounded-lg border p-4"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <p className="text-sm font-medium mb-3" style={{ color: "var(--gray-300)" }}>
          필드 추가
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleAddField(type)}
              className="px-3 py-2 text-sm border rounded text-left transition"
              style={{ borderColor: "var(--navy-600)", color: "var(--gray-300)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--navy-800)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
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
      className="p-3 border rounded cursor-pointer transition"
      style={{
        borderColor: isSelected ? "var(--brand-500)" : "var(--navy-600)",
        backgroundColor: isSelected ? "rgba(59, 130, 246, 0.1)" : "transparent",
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ backgroundColor: "var(--navy-800)", color: "var(--gray-400)" }}
          >
            {FIELD_TYPE_LABELS[field.type]}
          </span>
          <span className="font-medium" style={{ color: "var(--gray-200)" }}>
            {field.label}
          </span>
          {field.required && (
            <span className="text-xs" style={{ color: "var(--accent-rose)" }}>필수</span>
          )}
          {field.isCompanyName && (
            <span
              className="text-xs px-2 py-0.5 border rounded"
              style={{ borderColor: "var(--brand-500)", color: "var(--brand-500)" }}
            >
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
            className="p-1 disabled:opacity-30"
            style={{ color: "var(--gray-400)" }}
          >
            ↑
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={isLast}
            className="p-1 disabled:opacity-30"
            style={{ color: "var(--gray-400)" }}
          >
            ↓
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1"
            style={{ color: "var(--accent-rose)" }}
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
  const isFileField = field.type === "file";
  const canBeCompanyName = field.type === "text" || field.type === "textarea";

  return (
    <div
      className="rounded-lg border p-4 space-y-4"
      style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <h3 className="font-medium" style={{ color: "var(--gray-100)" }}>필드 설정</h3>

      <div>
        <label className="block text-sm mb-1" style={{ color: "var(--gray-400)" }}>라벨</label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => updateField(fieldId, { label: e.target.value })}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-sm mb-1" style={{ color: "var(--gray-400)" }}>플레이스홀더</label>
        <input
          type="text"
          value={field.placeholder || ""}
          onChange={(e) =>
            updateField(fieldId, { placeholder: e.target.value })
          }
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
          style={inputStyle}
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
        <label htmlFor="required" className="text-sm" style={{ color: "var(--gray-400)" }}>
          필수 입력
        </label>
      </div>

      {canBeCompanyName && (
        <div className="border-t pt-4" style={{ borderColor: "var(--navy-700)" }}>
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
              className="text-sm"
              style={{ color: "var(--gray-400)" }}
            >
              회사명 필드로 사용
            </label>
          </div>
          <p className="mt-1 ml-6 text-xs" style={{ color: "var(--gray-500)" }}>
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

      {isFileField && (
        <div className="border-t pt-4 space-y-2" style={{ borderColor: "var(--navy-700)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--gray-300)" }}>파일 업로드 설정</p>
          <p className="text-xs" style={{ color: "var(--gray-500)" }}>
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
      <label className="block text-sm mb-1" style={{ color: "var(--gray-400)" }}>옵션</label>
      <div className="space-y-2">
        {options.map((opt, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={opt}
              onChange={(e) => handleChange(index, e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
              style={inputStyle}
            />
            <button
              onClick={() => handleRemove(index)}
              className="px-2"
              style={{ color: "var(--accent-rose)" }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={handleAdd}
          className="text-sm hover:underline"
          style={{ color: "var(--brand-500)" }}
        >
          + 옵션 추가
        </button>
      </div>
    </div>
  );
}
