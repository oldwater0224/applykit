"use client";

import { useActionState } from "react";
import { acceptConsents } from "@/src/app/actions/consentAction";
import { ConsentCheckboxes } from "@/src/components/auth/consentCheckboxes";

const initialState = { error: "" };

export function ConsentForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(
    acceptConsents,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {/* 이동 경로 검증은 서버(safeRedirect)가 한다 */}
      <input type="hidden" name="redirect" value={redirectTo} />

      <ConsentCheckboxes refusalEffect="서비스를 이용할 수 없습니다." />

      {state?.error && (
        <div
          role="alert"
          className="rounded-md border border-(--accent-rose)/30 bg-(--accent-rose)/12 p-3 text-xs sm:text-[13px] text-(--dash-negative-text)"
        >
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-10 w-full rounded-md bg-(--brand-600) px-4 text-sm font-medium text-white transition-colors hover:bg-(--brand-700) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-500) disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-(--brand-600)"
      >
        {pending ? "처리 중..." : "동의하고 계속하기"}
      </button>
    </form>
  );
}
