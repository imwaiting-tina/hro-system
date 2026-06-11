-- ===========================================================
-- HRO系统：简历状态迁移脚本
-- 将 resume_status ENUM 从旧值迁移到新值
-- 执行方式：在 Supabase SQL Editor 中分步执行
-- ===========================================================

-- 第1步：创建新的 ENUM 类型
CREATE TYPE resume_status_new AS ENUM (
  'new',                  -- 新收
  'screening',            -- 筛选中
  'interviewing_first',   -- 一面中
  'interviewing_second',  -- 二面中
  'interviewing_final',   -- 终面中
  'pending_offer',        -- 待发Offer
  'offered',             -- 已发Offer
  'accepted',             -- 已接受
  'rejected',            -- 不录取
  'withdrawn'            -- 候选人放弃
);

-- 第2步：将 resumes 表的 status 列临时改为 TEXT
ALTER TABLE resumes ALTER COLUMN status TYPE TEXT;

-- 第3步：更新现有数据
-- 'interviewing' → 'interviewing_first'（旧数据默认归为二面中）
-- 'offered' → 'pending_offer'（已发Offer的按实际情况处理，这里先保留offered）
UPDATE resumes SET status = 'interviewing_first' WHERE status = 'interviewing';

-- 第4步：将列类型改为新 ENUM
ALTER TABLE resumes ALTER COLUMN status TYPE resume_status_new
  USING (
    CASE status
      WHEN 'new'             THEN 'new'::resume_status_new
      WHEN 'screening'       THEN 'screening'::resume_status_new
      WHEN 'interviewing'    THEN 'interviewing_first'::resume_status_new
      WHEN 'interviewing_first'  THEN 'interviewing_first'::resume_status_new
      WHEN 'interviewing_second' THEN 'interviewing_second'::resume_status_new
      WHEN 'interviewing_final'  THEN 'interviewing_final'::resume_status_new
      WHEN 'pending_offer'   THEN 'pending_offer'::resume_status_new
      WHEN 'offered'         THEN 'offered'::resume_status_new
      WHEN 'accepted'        THEN 'accepted'::resume_status_new
      WHEN 'rejected'        THEN 'rejected'::resume_status_new
      WHEN 'withdrawn'       THEN 'withdrawn'::resume_status_new
      ELSE 'new'::resume_status_new
    END
  );

-- 第5步：删除旧类型，重命名新类型
DROP TYPE resume_status;
ALTER TYPE resume_status_new RENAME TO resume_status;

-- 完成！验证：
-- SELECT DISTINCT status FROM resumes;
