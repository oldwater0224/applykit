'use client'

import { useFormBuilderStore } from '@/src/stores/formbuilderstore'
import { FormField } from '@/src/types/form'

export function FormPreview() {
  const { schema } = useFormBuilderStore()

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <form className="space-y-4">
        {schema.fields.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
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
            className="w-full py-2 bg-blue-600 text-white rounded-md cursor-not-allowed opacity-70"
          >
            제출 (미리보기)
          </button>
        )}
      </form>
    </div>
  )
}

function PreviewField({ field }: { field: FormField }) {
  const baseInputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {field.type === 'text' && (
        <input
          type="text"
          placeholder={field.placeholder}
          className={baseInputClass}
          disabled
        />
      )}

      {field.type === 'email' && (
        <input
          type="email"
          placeholder={field.placeholder}
          className={baseInputClass}
          disabled
        />
      )}

      {field.type === 'phone' && (
        <input
          type="tel"
          placeholder={field.placeholder}
          className={baseInputClass}
          disabled
        />
      )}

      {field.type === 'number' && (
        <input
          type="number"
          placeholder={field.placeholder}
          className={baseInputClass}
          disabled
        />
      )}

      {field.type === 'date' && (
        <input
          type="date"
          className={baseInputClass}
          disabled
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          placeholder={field.placeholder}
          rows={4}
          className={baseInputClass}
          disabled
        />
      )}

      {field.type === 'select' && (
        <select className={baseInputClass} disabled>
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
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === 'checkbox' && (
        <div className="space-y-2">
          {field.options?.map((opt, i) => (
            <label key={i} className="flex items-center gap-2">
              <input type="checkbox" disabled />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === 'file' && (
        <input
          type="file"
          className={baseInputClass}
          disabled
        />
      )}
    </div>
  )
}