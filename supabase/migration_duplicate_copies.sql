-- ============================================================
-- 入职文件一式两份流程 - 数据库变更 SQL
-- 复制以下内容到 Supabase SQL Editor 执行
-- Supabase Dashboard → SQL Editor → New Query → 粘贴 → Run
-- ============================================================

-- 1. 添加新列到 onboarding_documents 表
ALTER TABLE onboarding_documents ADD COLUMN IF NOT EXISTS copy_count INT DEFAULT 1;
ALTER TABLE onboarding_documents ADD COLUMN IF NOT EXISTS company_copy_status VARCHAR(50) DEFAULT NULL;
ALTER TABLE onboarding_documents ADD COLUMN IF NOT EXISTS employee_copy_status VARCHAR(50) DEFAULT NULL;
ALTER TABLE onboarding_documents ADD COLUMN IF NOT EXISTS company_copy_archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE onboarding_documents ADD COLUMN IF NOT EXISTS employee_copy_returned_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE onboarding_documents ADD COLUMN IF NOT EXISTS returned_to_employee BOOLEAN DEFAULT false;

-- 2. 更新 doc_status 枚举类型，添加两个新状态
ALTER TYPE doc_status ADD VALUE IF NOT EXISTS 'company_archived';
ALTER TYPE doc_status ADD VALUE IF NOT EXISTS 'returned_to_employee';

-- 3. 更新现有劳动合同/实习协议/劳务协议/保安劳动合同为一式两份
UPDATE onboarding_documents
SET copy_count = 2,
    company_copy_status = CASE
      WHEN status IN ('archived', 'delivered') THEN 'archived'
      WHEN status = 'sealed' THEN 'sealed'
      ELSE 'pending'
    END,
    employee_copy_status = CASE
      WHEN status IN ('archived', 'delivered') THEN 'returned'
      WHEN status = 'sealed' THEN 'sealed'
      ELSE 'pending'
    END,
    returned_to_employee = (status IN ('archived', 'delivered')),
    company_copy_archived_at = CASE WHEN status IN ('archived', 'delivered') THEN updated_at ELSE NULL END,
    employee_copy_returned_at = CASE WHEN status IN ('archived', 'delivered') THEN updated_at ELSE NULL END
WHERE doc_type IN ('labor_contract', 'internship_agreement', 'service_agreement', 'security_contract');

-- 4. 将 delivered 状态文档更新为合适的归档状态
UPDATE onboarding_documents
SET status = CASE
    WHEN company_copy_status = 'archived' AND employee_copy_status = 'returned' THEN 'archived'
    WHEN company_copy_status = 'archived' THEN 'company_archived'
    ELSE 'sealed'
  END
WHERE doc_type IN ('labor_contract', 'internship_agreement', 'service_agreement', 'security_contract')
  AND copy_count = 2;

-- 5. 验证结果
SELECT doc_type, doc_name, status, copy_count,
       company_copy_status, employee_copy_status, returned_to_employee
FROM onboarding_documents
WHERE doc_type IN ('labor_contract', 'internship_agreement', 'service_agreement', 'security_contract')
ORDER BY created_at DESC;
