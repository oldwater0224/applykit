-- ============================================
-- Day 2: 심사 인프라 DB 구축
-- ============================================
-- review_checklists: 프로그램별 심사 체크리스트 (프로그램당 1개)
-- review_results:    지원서별 심사 결과 (심사자당 1개)
-- ============================================

-- 1. 확장 활성화 (trigram 부분검색용)
-- company_name LIKE '%스타트%' 같은 중간 매칭을 빠르게 하기 위한 GIN 인덱스 지원
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 2. review_checklists 테이블
-- ============================================
-- 프로그램당 1개의 체크리스트만 허용 (UNIQUE program_id)
-- items는 [{id, label, max_score}] 형태의 JSONB 배열
-- 프로그램이 삭제되면 체크리스트도 함께 삭제 (CASCADE)
CREATE TABLE review_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  passing_score INT NOT NULL CHECK (passing_score >= 0),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(program_id)
);

-- ============================================
-- 3. review_results 테이블
-- ============================================
-- 지원서별 심사 결과 - 점수, 합격 여부, 심사 코멘트
-- reviewer_id는 심사자 탈퇴 시 NULL로 (이력은 보존)
-- is_passed는 심사 시점의 스냅샷 (나중에 passing_score 바뀌어도 과거 결과 유지)
-- company_name은 form_data에서 추출해서 중복 저장 (아카이브 검색 성능)
-- UNIQUE(application_id, reviewer_id): 한 심사자가 한 지원서에 한 번만
CREATE TABLE review_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scores JSONB NOT NULL,
  total_score INT NOT NULL CHECK (total_score >= 0),
  is_passed BOOLEAN NOT NULL,
  company_name TEXT,
  comment TEXT,
  reviewed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(application_id, reviewer_id)
);

-- ============================================
-- 4. 인덱스
-- ============================================
-- 지원서 상세 페이지에서 해당 지원서의 심사 결과 조회
CREATE INDEX idx_review_results_application ON review_results(application_id);

-- 프로그램 상세 > 심사 탭에서 프로그램 단위 심사 결과 조회
CREATE INDEX idx_review_results_program ON review_results(program_id);

-- 심사 아카이브 > 회사명 부분검색 (trigram 인덱스)
-- B-tree는 '스타트%'만 지원하지만 trigram은 '%스타트%'도 가속
CREATE INDEX idx_review_results_company_name
  ON review_results USING gin (company_name gin_trgm_ops);

-- ============================================
-- 5. RLS 활성화
-- ============================================
ALTER TABLE review_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. review_checklists 정책
-- ============================================
-- 운영기관 멤버만 CRUD (프로그램이 속한 org의 멤버인지 체크)
-- 패턴: programs.org_member_manage와 동일 (기존 RLS 일관성 유지)
CREATE POLICY "org_member_manage_checklists" ON review_checklists
  FOR ALL
  USING (
    program_id IN (
      SELECT p.id FROM programs p
      JOIN org_members m ON m.org_id = p.org_id
      WHERE m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    program_id IN (
      SELECT p.id FROM programs p
      JOIN org_members m ON m.org_id = p.org_id
      WHERE m.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. review_results 정책 (4개)
-- ============================================
-- SELECT: 운영기관 멤버는 자기 기관 프로그램의 모든 심사 결과 열람 가능
-- (동료가 심사한 것도 볼 수 있음 - 합격자 리스트 등)
CREATE POLICY "org_member_read_results" ON review_results
  FOR SELECT
  USING (
    program_id IN (
      SELECT p.id FROM programs p
      JOIN org_members m ON m.org_id = p.org_id
      WHERE m.user_id = auth.uid()
    )
  );

-- INSERT: 본인이 심사자(reviewer_id = auth.uid())이면서
--         동시에 해당 프로그램의 운영기관 멤버여야 함
CREATE POLICY "reviewer_insert_own_result" ON review_results
  FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid() AND
    program_id IN (
      SELECT p.id FROM programs p
      JOIN org_members m ON m.org_id = p.org_id
      WHERE m.user_id = auth.uid()
    )
  );

-- UPDATE: 본인 심사 기록만 수정 가능 (감사 무결성)
-- 동료의 심사 기록을 임의로 수정하지 못하게 차단
CREATE POLICY "reviewer_update_own_result" ON review_results
  FOR UPDATE
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- DELETE: 본인 심사 기록만 삭제 가능 (MVP에선 거의 사용 안 하지만 방어적으로 명시)
CREATE POLICY "reviewer_delete_own_result" ON review_results
  FOR DELETE
  USING (reviewer_id = auth.uid());
