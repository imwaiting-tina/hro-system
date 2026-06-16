-- ============================================================
-- 离职管理模块 - 测试数据插入
-- 复制到 Supabase SQL Editor 执行
-- ============================================================

-- 1. 王浩然 - 辞退/解雇（待审批）
INSERT INTO offboarding_cases (employee_id, initiator_type, type, reason_code, reason_detail, last_working_day, status, submitted_at)
VALUES ('64957763-ec08-428c-92e4-12003be60dd8', 'company', 'termination', 'discipline', '严重违反公司规章制度', '2026-06-30', 'pending', '2026-06-10T09:00:00Z');

-- 2. 李明 - 主动辞职（已批准）
INSERT INTO offboarding_cases (employee_id, initiator_type, type, reason_code, reason_detail, last_working_day, status, submitted_at, approved_at)
VALUES ('c91aba80-b393-4c0f-891c-c54d3368f7a8', 'employee', 'resignation', 'career_growth', '希望寻求更好的职业发展机会', '2026-07-15', 'approved', '2026-06-01T10:00:00Z', '2026-06-03T14:00:00Z');

-- 3. 张思雨 - 主动辞职（交接中）
INSERT INTO offboarding_cases (employee_id, initiator_type, type, reason_code, reason_detail, last_working_day, status, submitted_at, approved_at)
VALUES ('69b4b1f1-8d09-44a4-bbbe-c1b00a5585a6', 'employee', 'resignation', 'personal', '个人家庭原因需回老家发展', '2026-08-01', 'handovering', '2026-06-05T08:30:00Z', '2026-06-08T09:00:00Z');

-- 4. 黄一萧 - 退休（已关闭）
INSERT INTO offboarding_cases (employee_id, initiator_type, type, reason_code, reason_detail, last_working_day, status, submitted_at, approved_at)
VALUES ('659094e1-aefb-45c7-bfeb-d6e0ffc554d1', 'employee', 'retirement', 'personal', '正常退休', '2026-12-31', 'closed', '2026-01-15T09:00:00Z', '2026-01-20T10:00:00Z');

-- 5. 李保安 - 辞退（已关闭）
INSERT INTO offboarding_cases (employee_id, initiator_type, type, reason_code, reason_detail, last_working_day, status, submitted_at, approved_at)
VALUES ('1ec7f1ea-3425-445e-a80d-2e048befda8f', 'company', 'termination', 'layoff', '组织架构优化裁员', '2026-05-31', 'closed', '2026-05-01T09:00:00Z', '2026-05-05T14:00:00Z');

-- 验证插入结果
SELECT oc.id, e.chinese_name, oc.type, oc.status, oc.submitted_at
FROM offboarding_cases oc
LEFT JOIN employees e ON oc.employee_id = e.id
ORDER BY oc.submitted_at DESC;
