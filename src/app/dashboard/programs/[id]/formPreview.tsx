'use client'

import { useFormBuilderStore } from '@/src/stores/formbuilderstore'
import { FormField } from '@/src/types/form'

const previewInputStyle: React.CSSProperties = {
  backgroundColor: 'var(--navy-800)',
  borderColor: 'var(--navy-600)',
  color: 'var(--gray-100)',
}

export function FormPreview() {
  const { schema } = useFormBuilderStore()

  return (
    <div
      className="rounded-lg border p-6"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      <form className="space-y-4">
        {schema.fields.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--gray-500)' }}>
            왼쪽에서 필드를 추가하면 여기에 미리보기가 표시됩니다.
          </p>
        ) : (
          schema.fields.map((field) => (
            <PreviewField key={field.id} field={field} />
          ))
        )}

        {schema.fields.length > 0 && (
          <button
            type="button"
            className="w-full py-2 text-white rounded-md cursor-not-allowed opacity-70"
            style={{ backgroundColor: 'var(--brand-600)' }}
          >
            제출 (미리보기)
          </button>
        )}
      </form>
    </div>
  )
}

function PreviewField({ field }: { field: FormField }) {
  const baseInputClass = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"

  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--gray-300)' }}>
        {field.label}
        {field.required && <span className="ml-1" style={{ color: 'var(--accent-rose)' }}>*</span>}
      </label>

      {field.type === 'text' && (
        <input
          type="text"
          placeholder={field.placeholder}
          className={baseInputClass}
          style={previewInputStyle}
          disabled
        />
      )}

      {field.type === 'email' && (
        <input
          type="email"
          placeholder={field.placeholder}
          className={baseInputClass}
          style={previewInputStyle}
          disabled
        />
      )}

      {field.type === 'phone' && (
        <input
          type="tel"
          placeholder={field.placeholder}
          className={baseInputClass}
          style={previewInputStyle}
          disabled
        />
      )}

      {field.type === 'number' && (
        <input
          type="number"
          placeholder={field.placeholder}
          className={baseInputClass}
          style={previewInputStyle}
          disabled
        />
      )}

      {field.type === 'date' && (
        <input
          type="date"
          className={baseInputClass}
          style={previewInputStyle}
          disabled
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          placeholder={field.placeholder}
          rows={4}
          className={baseInputClass}
          style={previewInputStyle}
          disabled
        />
      )}

      {field.type === 'select' && (
        <select className={baseInputClass} style={previewInputStyle} disabled>
          <option value="">선택하세요</option>
          {field.options?.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {field.type === 'radio' && (
        <div className="space-y-2">
          {field.options?.map((opt, i) => (
            <label key={i} className="flex items-center gap-2">
              <input type="radio" name={field.id} disabled />
              <span className="text-sm" style={{ color: 'var(--gray-200)' }}>{opt}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === 'checkbox' && (
        <div className="space-y-2">
          {field.options?.map((opt, i) => (
            <label key={i} className="flex items-center gap-2">
              <input type="checkbox" disabled />
              <span className="text-sm" style={{ color: 'var(--gray-200)' }}>{opt}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === 'file' && (
        <input
          type="file"
          className={baseInputClass}
          style={previewInputStyle}
          disabled
        />
      )}
    </div>
  )
}
