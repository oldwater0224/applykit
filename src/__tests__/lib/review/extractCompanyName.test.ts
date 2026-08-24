import { extractCompanyName } from "@/src/lib/review/extractCompanyName";
import type { FormSchema } from "@/src/types/form";
import type { ApplicationFormData } from "@/src/types/applications";

describe("extractCompanyName", () => {
  describe("1순위: isCompanyName 플래그", () => {
    const schema: FormSchema = {
      version: 1,
      fields: [
        { id: "name", type: "text", label: "이름", required: true },
        {
          id: "company",
          type: "text",
          label: "팀명",
          required: true,
          isCompanyName: true,
        },
      ],
    };

    it("플래그가 있는 필드에서 회사명을 추출한다", () => {
      const formData: ApplicationFormData = {
        name: "홍길동",
        company: "토스",
      };
      expect(extractCompanyName(schema, formData)).toBe("토스");
    });

    it("값 양쪽 공백을 trim한다", () => {
      const formData: ApplicationFormData = {
        name: "홍길동",
        company: "  토스뱅크  ",
      };
      expect(extractCompanyName(schema, formData)).toBe("토스뱅크");
    });

    it("플래그 필드 값이 빈 문자열이면 2순위로 fallback한다", () => {
      const schemaWithKeyword: FormSchema = {
        version: 1,
        fields: [
          {
            id: "flagged",
            type: "text",
            label: "팀명",
            required: true,
            isCompanyName: true,
          },
          {
            id: "company_name",
            type: "text",
            label: "회사명",
            required: true,
          },
        ],
      };
      const formData: ApplicationFormData = {
        flagged: "",
        company_name: "카카오",
      };
      expect(extractCompanyName(schemaWithKeyword, formData)).toBe("카카오");
    });

    it("플래그 필드 값이 공백만이면 2순위로 fallback한다", () => {
      const schemaWithKeyword: FormSchema = {
        version: 1,
        fields: [
          {
            id: "flagged",
            type: "text",
            label: "팀명",
            required: true,
            isCompanyName: true,
          },
          {
            id: "org",
            type: "text",
            label: "기관명",
            required: true,
          },
        ],
      };
      const formData: ApplicationFormData = {
        flagged: "   ",
        org: "네이버",
      };
      expect(extractCompanyName(schemaWithKeyword, formData)).toBe("네이버");
    });
  });

  describe("2순위: 라벨 키워드 매칭", () => {
    it.each([
      ["회사명", "회사"],
      ["소속 기관", "기관"],
      ["업체명", "업체"],
      ["사업자명", "사업자"],
      ["스타트업 이름", "스타트업"],
    ])("라벨 '%s'에 키워드 '%s'가 포함되면 매칭한다", (label) => {
      const schema: FormSchema = {
        version: 1,
        fields: [
          { id: "f1", type: "text", label, required: true },
        ],
      };
      const formData: ApplicationFormData = { f1: "테스트컴퍼니" };
      expect(extractCompanyName(schema, formData)).toBe("테스트컴퍼니");
    });

    it("text 타입이 아닌 필드는 매칭하지 않는다", () => {
      const schema: FormSchema = {
        version: 1,
        fields: [
          { id: "f1", type: "textarea", label: "회사 소개", required: true },
        ],
      };
      const formData: ApplicationFormData = { f1: "우리회사" };
      expect(extractCompanyName(schema, formData)).toBeNull();
    });

    it("키워드가 없는 라벨은 매칭하지 않는다", () => {
      const schema: FormSchema = {
        version: 1,
        fields: [
          { id: "f1", type: "text", label: "이름", required: true },
          { id: "f2", type: "text", label: "이메일", required: true },
        ],
      };
      const formData: ApplicationFormData = { f1: "홍길동", f2: "test@test.com" };
      expect(extractCompanyName(schema, formData)).toBeNull();
    });
  });

  describe("null 반환", () => {
    it("빈 fields면 null을 반환한다", () => {
      const schema: FormSchema = { version: 1, fields: [] };
      expect(extractCompanyName(schema, {})).toBeNull();
    });

    it("매칭 필드는 있지만 formData에 값이 없으면 null을 반환한다", () => {
      const schema: FormSchema = {
        version: 1,
        fields: [
          { id: "company", type: "text", label: "회사명", required: true },
        ],
      };
      expect(extractCompanyName(schema, {})).toBeNull();
    });

    it("매칭 필드의 값이 문자열이 아니면 null을 반환한다", () => {
      const schema: FormSchema = {
        version: 1,
        fields: [
          {
            id: "company",
            type: "text",
            label: "회사명",
            required: true,
            isCompanyName: true,
          },
        ],
      };
      const formData: ApplicationFormData = { company: 12345 };
      expect(extractCompanyName(schema, formData)).toBeNull();
    });
  });
});
