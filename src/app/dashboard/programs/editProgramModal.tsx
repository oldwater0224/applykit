"use client";

import { useState, useEffect } from "react";
import { useProgramStore } from "@/src/stores/programstore";
import { useUpdateProgram } from "@/src/hooks/usePrograms";

const modalInputStyle: React.CSSProperties = {
  backgroundColor: "var(--navy-800)",
  borderColor: "var(--navy-600)",
  color: "var(--gray-100)",
};

export function EditProgramModal() {
  const { isEditModalOpen, selectedProgram, closeModal } = useProgramStore();
  const updateProgram = useUpdateProgram();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    status: "draft",
  });

  useEffect(() => {
    if (!selectedProgram) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({
      title: selectedProgram.title,
      description: selectedProgram.description ?? "",
      deadline: selectedProgram.deadline ?? "",
      status: selectedProgram.status,
    });
  }, [selectedProgram]);

  if (!isEditModalOpen || !selectedProgram) return null;

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await updateProgram.mutateAsync({
        id: selectedProgram!.id,
        ...formData,
      });
      closeModal();
    } catch (error) {
      console.error("프로그램 수정 실패:", error);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="rounded-lg w-full max-w-md p-6 border"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--gray-100)" }}>
          공고 수정
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--gray-300)" }}>
              공고 제목 *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
              style={modalInputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--gray-300)" }}>
              설명
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
              style={modalInputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--gray-300)" }}>
              마감일
            </label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
              style={modalInputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--gray-300)" }}>
              상태
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
              style={modalInputStyle}
            >
              <option value="draft">작성 중</option>
              <option value="active">모집 중</option>
              <option value="closed">마감</option>
            </select>
          </div>

          {updateProgram.error && (
            <p className="text-sm" style={{ color: "var(--accent-rose)" }}>
              오류: {updateProgram.error.message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border rounded-md transition"
              style={{ borderColor: "var(--navy-600)", color: "var(--gray-300)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--navy-800)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={updateProgram.isPending}
              className="px-4 py-2 text-white rounded-md disabled:opacity-50"
              style={{ backgroundColor: "var(--brand-600)" }}
            >
              {updateProgram.isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
