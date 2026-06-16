-- ============================================================
-- 修复: 给 offboarding 表添加 authenticated 角色全操作策略
-- 原因: HRO系统前端用 anon key 访问，但离职数据为敏感HR信息，
--       应限定登录用户(authenticated)访问，禁止未登录访客
-- 使用方式: 本脚本可重复执行（先 DROP 旧策略再 CREATE）
-- ============================================================

-- 清理旧策略: 兼容之前 anon 版本遗留的同名策略
DROP POLICY IF EXISTS "Anonymous users can view offboarding_cases" ON offboarding_cases;
DROP POLICY IF EXISTS "Anonymous users can view handover items"    ON offboarding_handover_items;
DROP POLICY IF EXISTS "Anonymous users can view exit interviews"    ON offboarding_exit_interviews;
DROP POLICY IF EXISTS "Anon users can view offboarding_cases"      ON offboarding_cases;
DROP POLICY IF EXISTS "Anon users can view handover items"         ON offboarding_handover_items;
DROP POLICY IF EXISTS "Anon users can view exit interviews"         ON offboarding_exit_interviews;
DROP POLICY IF EXISTS "Anon users can insert offboarding_cases"    ON offboarding_cases;
DROP POLICY IF EXISTS "Anon users can update offboarding_cases"    ON offboarding_cases;
DROP POLICY IF EXISTS "Anon users can delete offboarding_cases"    ON offboarding_cases;
DROP POLICY IF EXISTS "Anon users can insert handover items"       ON offboarding_handover_items;
DROP POLICY IF EXISTS "Anon users can update handover items"       ON offboarding_handover_items;
DROP POLICY IF EXISTS "Anon users can delete handover items"       ON offboarding_handover_items;
DROP POLICY IF EXISTS "Anon users can insert exit interviews"      ON offboarding_exit_interviews;
DROP POLICY IF EXISTS "Anon users can update exit interviews"      ON offboarding_exit_interviews;
DROP POLICY IF EXISTS "Anon users can delete exit interviews"      ON offboarding_exit_interviews;

-- 防御性 DROP: 本脚本定义的 12 条 Authenticated 策略
DROP POLICY IF EXISTS "Authenticated users can view offboarding_cases"       ON offboarding_cases;
DROP POLICY IF EXISTS "Authenticated users can view handover items"           ON offboarding_handover_items;
DROP POLICY IF EXISTS "Authenticated users can view exit interviews"          ON offboarding_exit_interviews;
DROP POLICY IF EXISTS "Authenticated users can insert offboarding_cases"     ON offboarding_cases;
DROP POLICY IF EXISTS "Authenticated users can update offboarding_cases"     ON offboarding_cases;
DROP POLICY IF EXISTS "Authenticated users can delete offboarding_cases"     ON offboarding_cases;
DROP POLICY IF EXISTS "Authenticated users can insert handover items"        ON offboarding_handover_items;
DROP POLICY IF EXISTS "Authenticated users can update handover items"        ON offboarding_handover_items;
DROP POLICY IF EXISTS "Authenticated users can delete handover items"        ON offboarding_handover_items;
DROP POLICY IF EXISTS "Authenticated users can insert exit interviews"       ON offboarding_exit_interviews;
DROP POLICY IF EXISTS "Authenticated users can update exit interviews"       ON offboarding_exit_interviews;
DROP POLICY IF EXISTS "Authenticated users can delete exit interviews"       ON offboarding_exit_interviews;

-- offboarding_cases - 已登录用户可查看
CREATE POLICY "Authenticated users can view offboarding_cases"
  ON offboarding_cases
  FOR SELECT
  TO authenticated
  USING (true);

-- offboarding_handover_items - 已登录用户可查看
CREATE POLICY "Authenticated users can view handover items"
  ON offboarding_handover_items
  FOR SELECT
  TO authenticated
  USING (true);

-- offboarding_exit_interviews - 已登录用户可查看
CREATE POLICY "Authenticated users can view exit interviews"
  ON offboarding_exit_interviews
  FOR SELECT
  TO authenticated
  USING (true);

-- 已登录用户 INSERT 权限
CREATE POLICY "Authenticated users can insert offboarding_cases"
  ON offboarding_cases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update offboarding_cases"
  ON offboarding_cases
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete offboarding_cases"
  ON offboarding_cases
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert handover items"
  ON offboarding_handover_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update handover items"
  ON offboarding_handover_items
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete handover items"
  ON offboarding_handover_items
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert exit interviews"
  ON offboarding_exit_interviews
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update exit interviews"
  ON offboarding_exit_interviews
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete exit interviews"
  ON offboarding_exit_interviews
  FOR DELETE
  TO authenticated
  USING (true);

-- 验证
SELECT tablename, policyname, roles FROM pg_policies
WHERE tablename IN ('offboarding_cases', 'offboarding_handover_items', 'offboarding_exit_interviews')
ORDER BY tablename;
