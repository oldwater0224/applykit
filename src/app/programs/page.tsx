// src/app/programs/page.tsx 전체 교체

import { Suspense } from "react";
import ProgramsContent from "@/src/components/programs/programsContent";

export default function ProgramsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <ProgramsContent />
    </Suspense>
  );
}