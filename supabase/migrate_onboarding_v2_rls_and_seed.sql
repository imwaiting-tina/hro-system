-- ============================================================
-- HRO入职板块V2 - RLS策略 + 测试数据
-- 在 Supabase SQL Editor 中一次性执行
-- ============================================================

-- ============================================================
-- Part 1: RLS 策略（允许所有操作，开发阶段）
-- ============================================================

-- onboarding_guide_tasks
ALTER TABLE onboarding_guide_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for onboarding_guide_tasks" ON onboarding_guide_tasks;
CREATE POLICY "Allow all for onboarding_guide_tasks" ON onboarding_guide_tasks FOR ALL USING (true) WITH CHECK (true);

-- welcome_announcements
ALTER TABLE welcome_announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for welcome_announcements" ON welcome_announcements;
CREATE POLICY "Allow all for welcome_announcements" ON welcome_announcements FOR ALL USING (true) WITH CHECK (true);

-- employee_training_progress
ALTER TABLE employee_training_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for employee_training_progress" ON employee_training_progress;
CREATE POLICY "Allow all for employee_training_progress" ON employee_training_progress FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Part 2: 测试虚拟数据
-- ============================================================

-- 先获取已插入的员工ID
DO $$
DECLARE
  emp1_id UUID;
  emp2_id UUID;
  emp3_id UUID;
  tina_id UUID := '98f14fd7-70e7-44f3-a8b0-d85a8272c575';
BEGIN
  SELECT id INTO emp1_id FROM employees WHERE employee_no = 'EMP2026001';
  SELECT id INTO emp2_id FROM employees WHERE employee_no = 'EMP2026002';
  SELECT id INTO emp3_id FROM employees WHERE employee_no = 'EMP2026003';

  -- ============================================================
  -- 2.1 入职引导任务 (每人16条)
  -- ============================================================
  
  -- 李明 (EMP2026001) - 前3已完成，4-6进行中，7-16待处理
  INSERT INTO onboarding_guide_tasks (employee_id, task_name, task_category, executor_name, status, sort_order, completed_by, completed_at) VALUES
  (emp1_id, '入职通知发放', '入职前', '黄燕婷', 'completed', 1, tina_id, NOW()),
  (emp1_id, '工位/设备准备', '行政准备', '行政专员', 'completed', 2, tina_id, NOW()),
  (emp1_id, '门禁卡/考勤录入', '行政准备', '行政专员', 'completed', 3, tina_id, NOW()),
  (emp1_id, '系统账号开通', 'IT准备', 'IT管理员', 'in_progress', 4, NULL, NULL),
  (emp1_id, '入职资料收集', '入职前', '黄燕婷', 'in_progress', 5, NULL, NULL),
  (emp1_id, '劳动合同签署', '入职当日', '黄燕婷', 'in_progress', 6, NULL, NULL),
  (emp1_id, '员工手册签收', '入职当日', '黄燕婷', 'pending', 7, NULL, NULL),
  (emp1_id, '保密协议签署', '入职当日', '黄燕婷', 'pending', 8, NULL, NULL),
  (emp1_id, '社保/公积金登记', '入职后', '黄燕婷', 'pending', 9, NULL, NULL),
  (emp1_id, '商业保险登记', '入职后', '黄燕婷', 'pending', 10, NULL, NULL),
  (emp1_id, '银行卡信息收集', '入职后', '黄燕婷', 'pending', 11, NULL, NULL),
  (emp1_id, '档案调入', '入职后', '黄燕婷', 'pending', 12, NULL, NULL),
  (emp1_id, '新员工培训安排', '培训', '部门负责人', 'pending', 13, NULL, NULL),
  (emp1_id, '试用期目标设定', '入职后', '部门负责人', 'pending', 14, NULL, NULL),
  (emp1_id, '导师分配', '入职当日', '部门负责人', 'pending', 15, NULL, NULL),
  (emp1_id, '迎新公告发布', '入职前', '黄燕婷', 'completed', 16, tina_id, NOW());

  -- 张思雨 (EMP2026002) - 前2已完成，其余待处理
  INSERT INTO onboarding_guide_tasks (employee_id, task_name, task_category, executor_name, status, sort_order, completed_by, completed_at) VALUES
  (emp2_id, '入职通知发放', '入职前', '黄燕婷', 'completed', 1, tina_id, NOW()),
  (emp2_id, '工位/设备准备', '行政准备', '行政专员', 'completed', 2, tina_id, NOW()),
  (emp2_id, '门禁卡/考勤录入', '行政准备', '行政专员', 'pending', 3, NULL, NULL),
  (emp2_id, '系统账号开通', 'IT准备', 'IT管理员', 'pending', 4, NULL, NULL),
  (emp2_id, '入职资料收集', '入职前', '黄燕婷', 'pending', 5, NULL, NULL),
  (emp2_id, '劳动合同签署', '入职当日', '黄燕婷', 'pending', 6, NULL, NULL),
  (emp2_id, '员工手册签收', '入职当日', '黄燕婷', 'pending', 7, NULL, NULL),
  (emp2_id, '保密协议签署', '入职当日', '黄燕婷', 'pending', 8, NULL, NULL),
  (emp2_id, '社保/公积金登记', '入职后', '黄燕婷', 'pending', 9, NULL, NULL),
  (emp2_id, '商业保险登记', '入职后', '黄燕婷', 'pending', 10, NULL, NULL),
  (emp2_id, '银行卡信息收集', '入职后', '黄燕婷', 'pending', 11, NULL, NULL),
  (emp2_id, '档案调入', '入职后', '黄燕婷', 'pending', 12, NULL, NULL),
  (emp2_id, '新员工培训安排', '培训', '部门负责人', 'pending', 13, NULL, NULL),
  (emp2_id, '试用期目标设定', '入职后', '部门负责人', 'pending', 14, NULL, NULL),
  (emp2_id, '导师分配', '入职当日', '部门负责人', 'pending', 15, NULL, NULL),
  (emp2_id, '迎新公告发布', '入职前', '黄燕婷', 'pending', 16, NULL, NULL);

  -- 王浩然 (EMP2026003) - 仅第1完成，其余待处理
  INSERT INTO onboarding_guide_tasks (employee_id, task_name, task_category, executor_name, status, sort_order, completed_by, completed_at) VALUES
  (emp3_id, '入职通知发放', '入职前', '黄燕婷', 'completed', 1, tina_id, NOW()),
  (emp3_id, '工位/设备准备', '行政准备', '行政专员', 'pending', 2, NULL, NULL),
  (emp3_id, '门禁卡/考勤录入', '行政准备', '行政专员', 'pending', 3, NULL, NULL),
  (emp3_id, '系统账号开通', 'IT准备', 'IT管理员', 'pending', 4, NULL, NULL),
  (emp3_id, '入职资料收集', '入职前', '黄燕婷', 'pending', 5, NULL, NULL),
  (emp3_id, '劳动合同签署', '入职当日', '黄燕婷', 'pending', 6, NULL, NULL),
  (emp3_id, '员工手册签收', '入职当日', '黄燕婷', 'pending', 7, NULL, NULL),
  (emp3_id, '保密协议签署', '入职当日', '黄燕婷', 'pending', 8, NULL, NULL),
  (emp3_id, '社保/公积金登记', '入职后', '黄燕婷', 'pending', 9, NULL, NULL),
  (emp3_id, '商业保险登记', '入职后', '黄燕婷', 'pending', 10, NULL, NULL),
  (emp3_id, '银行卡信息收集', '入职后', '黄燕婷', 'pending', 11, NULL, NULL),
  (emp3_id, '档案调入', '入职后', '黄燕婷', 'pending', 12, NULL, NULL),
  (emp3_id, '新员工培训安排', '培训', '部门负责人', 'pending', 13, NULL, NULL),
  (emp3_id, '试用期目标设定', '入职后', '部门负责人', 'pending', 14, NULL, NULL),
  (emp3_id, '导师分配', '入职当日', '部门负责人', 'pending', 15, NULL, NULL),
  (emp3_id, '迎新公告发布', '入职前', '黄燕婷', 'pending', 16, NULL, NULL);

  -- ============================================================
  -- 2.2 培训进度 (每人9个模块)
  -- ============================================================

  -- 李明 - 前3已完成
  INSERT INTO employee_training_progress (employee_id, module_key, module_name, module_order, is_read, read_at) VALUES
  (emp1_id, 'company_intro', '公司介绍与企业文化', 1, true, NOW()),
  (emp1_id, 'org_structure', '组织架构与部门介绍', 2, true, NOW()),
  (emp1_id, 'hr_policies', '人事制度与考勤规定', 3, true, NOW()),
  (emp1_id, 'it_security', 'IT安全与信息安全', 4, false, NULL),
  (emp1_id, 'oa_system', 'OA系统使用指南', 5, false, NULL),
  (emp1_id, 'finance_rules', '财务报销制度', 6, false, NULL),
  (emp1_id, 'code_conduct', '员工行为准则', 7, false, NULL),
  (emp1_id, 'career_dev', '职业发展与晋升通道', 8, false, NULL),
  (emp1_id, 'health_safety', '职业健康与安全', 9, false, NULL);

  -- 张思雨 - 全部未读
  INSERT INTO employee_training_progress (employee_id, module_key, module_name, module_order, is_read, read_at) VALUES
  (emp2_id, 'company_intro', '公司介绍与企业文化', 1, false, NULL),
  (emp2_id, 'org_structure', '组织架构与部门介绍', 2, false, NULL),
  (emp2_id, 'hr_policies', '人事制度与考勤规定', 3, false, NULL),
  (emp2_id, 'it_security', 'IT安全与信息安全', 4, false, NULL),
  (emp2_id, 'oa_system', 'OA系统使用指南', 5, false, NULL),
  (emp2_id, 'finance_rules', '财务报销制度', 6, false, NULL),
  (emp2_id, 'code_conduct', '员工行为准则', 7, false, NULL),
  (emp2_id, 'career_dev', '职业发展与晋升通道', 8, false, NULL),
  (emp2_id, 'health_safety', '职业健康与安全', 9, false, NULL);

  -- 王浩然 - 全部未读
  INSERT INTO employee_training_progress (employee_id, module_key, module_name, module_order, is_read, read_at) VALUES
  (emp3_id, 'company_intro', '公司介绍与企业文化', 1, false, NULL),
  (emp3_id, 'org_structure', '组织架构与部门介绍', 2, false, NULL),
  (emp3_id, 'hr_policies', '人事制度与考勤规定', 3, false, NULL),
  (emp3_id, 'it_security', 'IT安全与信息安全', 4, false, NULL),
  (emp3_id, 'oa_system', 'OA系统使用指南', 5, false, NULL),
  (emp3_id, 'finance_rules', '财务报销制度', 6, false, NULL),
  (emp3_id, 'code_conduct', '员工行为准则', 7, false, NULL),
  (emp3_id, 'career_dev', '职业发展与晋升通道', 8, false, NULL),
  (emp3_id, 'health_safety', '职业健康与安全', 9, false, NULL);

  -- ============================================================
  -- 2.3 迎新公告
  -- ============================================================

  -- 李明 - 已发布
  INSERT INTO welcome_announcements (employee_id, display_name, department_name, position_title, onboard_date, self_intro, education_bg, status, reviewed_by, reviewed_at, published_at) VALUES
  (emp1_id, '李明 Li Ming', '技术部', 'Java开发实习生', CURRENT_DATE,
   '大家好，我是李明，复旦大学计算机科学与技术专业应届毕业生。平时喜欢打篮球和研究开源项目，很高兴加入开弈大家庭！',
   '复旦大学 计算机科学与技术 本科',
   'published', tina_id, NOW(), NOW());

  -- 张思雨 - 草稿
  INSERT INTO welcome_announcements (employee_id, display_name, department_name, position_title, onboard_date, self_intro, education_bg, status) VALUES
  (emp2_id, '张思雨 Zhang Siyu', '业务部', '管理培训生', CURRENT_DATE + INTERVAL '7 days',
   '上海交通大学工商管理硕士，热爱商业分析和战略规划。期待在开弈快速成长！',
   '上海交通大学 工商管理 硕士',
   'draft');

END $$;
