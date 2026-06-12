-- ============================================================
-- HRO人事管理系统 - 入职板块V2 数据库迁移
-- 基于《260612人事流程梳理-入职板块v2》
-- ============================================================

-- ============================================================
-- Part 1: 新建入职引导任务表
-- ============================================================
CREATE TABLE IF NOT EXISTS onboarding_guide_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  task_name VARCHAR(200) NOT NULL,
  task_category VARCHAR(50),              -- 文件准备 / 沟通协调 / 行政安排 / 系统设置 / 培训
  executor_name VARCHAR(50) NOT NULL,     -- 执行人姓名（黄燕婷/汪顺/黄欢欢/程璐/王力/社保部）
  status VARCHAR(20) DEFAULT 'pending',   -- pending / in_progress / completed
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  sort_order INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE onboarding_guide_tasks IS '入职引导任务清单 - 13项标准引导任务';
COMMENT ON COLUMN onboarding_guide_tasks.task_name IS '任务名称，如：发送录用通知书、安排座位等';
COMMENT ON COLUMN onboarding_guide_tasks.executor_name IS '执行人姓名（中文名，非user_id），便于跨部门分配';
COMMENT ON COLUMN onboarding_guide_tasks.status IS 'pending=待执行, in_progress=进行中, completed=已完成';

-- ============================================================
-- Part 2: 新建迎新公告表
-- ============================================================
CREATE TABLE IF NOT EXISTS welcome_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) NOT NULL,

  -- 自动提取字段（来源：简历/录用表）
  display_name VARCHAR(100),              -- 姓名
  department_name VARCHAR(100),           -- 部门
  position_title VARCHAR(100),            -- 岗位
  onboard_date DATE,                      -- 入职日期
  avatar_url TEXT,                        -- 头像照片
  self_intro TEXT,                        -- 自我介绍
  education_bg VARCHAR(200),              -- 学历/毕业

  -- 公告状态
  status VARCHAR(20) DEFAULT 'draft',     -- draft / pending_review / approved / published
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE welcome_announcements IS '迎新公告卡片 - 微信工作群新人介绍';
COMMENT ON COLUMN welcome_announcements.status IS 'draft=草稿, pending_review=待审核, approved=已审核, published=已发布';

-- ============================================================
-- Part 3: 新建员工培训进度表
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_training_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) NOT NULL,

  module_key VARCHAR(50) NOT NULL,        -- 模块标识: company_intro / history / honors / admin_rules / hr_rules / salary / finance / seal / obligations
  module_name VARCHAR(100) NOT NULL,      -- 模块名称（中文）
  module_order INT NOT NULL,              -- 模块顺序 1-9
  is_read BOOLEAN DEFAULT false,          -- 是否已阅读
  read_at TIMESTAMPTZ,                    -- 阅读确认时间

  -- 唯一约束：同一员工同一模块只有一条记录
  UNIQUE(employee_id, module_key),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE employee_training_progress IS '员工培训进度 - 9模块顺序解锁阅读确认';
COMMENT ON COLUMN employee_training_progress.module_key IS '模块标识，用于前端路由/状态管理';

-- ============================================================
-- Part 4: 扩展 employees 表 - 信息登记字段
-- ============================================================
ALTER TABLE employees ADD COLUMN IF NOT EXISTS birth_place VARCHAR(100);          -- 出生地
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nation VARCHAR(30);                -- 民族
ALTER TABLE employees ADD COLUMN IF NOT EXISTS political_status VARCHAR(30);      -- 政治面貌
ALTER TABLE employees ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20);        -- 婚姻状况
ALTER TABLE employees ADD COLUMN IF NOT EXISTS children_status VARCHAR(30);       -- 子女状况
ALTER TABLE employees ADD COLUMN IF NOT EXISTS family_info TEXT;                  -- 家庭情况（直属）
ALTER TABLE employees ADD COLUMN IF NOT EXISTS first_work_date DATE;              -- 首次参加工作时间
ALTER TABLE employees ADD COLUMN IF NOT EXISTS prev_employment_status VARCHAR(50);-- 前期就业状态
ALTER TABLE employees ADD COLUMN IF NOT EXISTS archive_location VARCHAR(200);     -- 档案所在地
ALTER TABLE employees ADD COLUMN IF NOT EXISTS technical_skills TEXT;             -- 技术特长
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_history TEXT;                 -- 工作履历
ALTER TABLE employees ADD COLUMN IF NOT EXISTS declarations JSONB;                -- 个人声明确认 {q1:true, q2:false, ...}
ALTER TABLE employees ADD COLUMN IF NOT EXISTS living_address TEXT;               -- 现居地址
ALTER TABLE employees ADD COLUMN IF NOT EXISTS social_insurance_status VARCHAR(50);-- 社会保险状况
ALTER TABLE employees ADD COLUMN IF NOT EXISTS info_form_completed BOOLEAN DEFAULT false; -- 信息登记表是否完成
ALTER TABLE employees ADD COLUMN IF NOT EXISTS info_form_completed_at TIMESTAMPTZ;

-- ============================================================
-- Part 5: 入职培训完成标记（已有 training_completed 在 admin_preparations，此处补充到 employees）
-- ============================================================
ALTER TABLE employees ADD COLUMN IF NOT EXISTS training_completed_at TIMESTAMPTZ;

-- ============================================================
-- Part 6: 索引
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_guide_tasks_employee ON onboarding_guide_tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_guide_tasks_status ON onboarding_guide_tasks(status);
CREATE INDEX IF NOT EXISTS idx_welcome_announcements_employee ON welcome_announcements(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_employee ON employee_training_progress(employee_id);
