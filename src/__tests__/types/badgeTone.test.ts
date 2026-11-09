import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
} from "@/src/types/applications";
import { REVIEW_RESULT_LABEL, REVIEW_RESULT_TONE } from "@/src/types/review";

describe("배지 톤 매핑 (#67 4단계)", () => {
  it("지원서 상태: 라벨과 같은 키를 모두 덮는다", () => {
    expect(Object.keys(APPLICATION_STATUS_TONE).sort()).toEqual(
      Object.keys(APPLICATION_STATUS_LABEL).sort(),
    );
    expect(APPLICATION_STATUS_TONE).toEqual({
      draft: "muted",
      submitted: "brand",
      passed: "success",
      failed: "danger",
    });
  });

  it("심사 결과: 지원서 상태의 합격/불합격과 같은 톤", () => {
    expect(Object.keys(REVIEW_RESULT_TONE).sort()).toEqual(
      Object.keys(REVIEW_RESULT_LABEL).sort(),
    );
    expect(REVIEW_RESULT_TONE.passed).toBe(APPLICATION_STATUS_TONE.passed);
    expect(REVIEW_RESULT_TONE.failed).toBe(APPLICATION_STATUS_TONE.failed);
  });
});
