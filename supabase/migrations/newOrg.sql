-- 새 사용자 user_id 확인
SELECT id, email FROM auth.users WHERE email = '<신규 운영자 이메일>'; -- ex) admin2@applykit.dev

-- 새 운영기관 생성
INSERT INTO organizations (id, name, owner_id) 
VALUES (gen_random_uuid(), '<기관명>', '<위에서 확인한 user_id>') -- '운영기관 B' '<admin2_user_id>'
RETURNING id;

-- 멤버십 등록
INSERT INTO org_members (user_id, org_id, role)
VALUES ('<user_id>', '<org_id>', 'admin'); -- '<admin2_user_id>' , '<org_id>' ,'admin'