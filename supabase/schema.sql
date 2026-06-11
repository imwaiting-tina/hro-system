-- ============================================================
-- HRO人事管理系统 - 数据库Schema
-- 上海羿工分信息科技有限公司
-- ============================================================

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. 用户与权限
-- ============================================================

-- 角色枚举
CREATE TYPE user_role AS ENUM (
  'super_admin',      -- 超级管理员 (Jenny)
  'main_admin',       -- 系统主管理员 (黄一萧)
  'sub_admin',        -- 系统子管理员 (黄燕婷)
  'bu_head',          -- BU负责人 (王妤扬)
  'employee'          -- 普通员工 (仅查看)
);

-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  email VARCHAR(255),
  phone VARCHAR(20),
  department VARCHAR(100),
  position VARCHAR(100),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 预设账号
-- 密码统一为 ky2026，使用 bcrypt 加密

-- ============================================================
-- 2. 部门与职位
-- ============================================================

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES departments(id),
  head_user_id UUID REFERENCES users(id),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES departments(id),
  grade VARCHAR(20),            -- 职级
  base_salary_min DECIMAL(12,2),
  base_salary_max DECIMAL(12,2),
  headcount INT DEFAULT 0,      -- 编制数
  current_count INT DEFAULT 0,  -- 在岗人数
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. 招聘需求管理
-- ============================================================

CREATE TYPE recruitment_status AS ENUM (
  'draft',           -- 草稿
  'pending_dept',    -- 待部门负责人确认
  'pending_hr',      -- 待人事负责人确认
  'pending_final',   -- 待Jenny终审
  'approved',        -- 已批准
  'rejected',        -- 已驳回
  'published',       -- 已发布
  'closed'           -- 已关闭
);

-- 聘用员工申请表 (招聘需求)
CREATE TABLE recruitment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_no VARCHAR(50) UNIQUE NOT NULL,  -- 需求编号
  department_id UUID REFERENCES departments(id),
  position_name VARCHAR(100) NOT NULL,
  quantity INT DEFAULT 1,
  grade VARCHAR(20),              -- 职级
  salary_range_min DECIMAL(12,2),
  salary_range_max DECIMAL(12,2),
  annual_budget DECIMAL(12,2),
  expected_onboard_date DATE,
  recruitment_reason TEXT,        -- 招聘原因

  -- 候选人画像
  gender_requirement VARCHAR(20),
  age_requirement VARCHAR(50),
  education_requirement VARCHAR(100),
  work_experience_requirement TEXT,
  household_requirement VARCHAR(100),
  preferred_major VARCHAR(200),
  certificate_requirement VARCHAR(200),
  other_requirements TEXT,
  brief_job_description TEXT,

  status recruitment_status DEFAULT 'draft',

  -- 审批人
  created_by UUID REFERENCES users(id),
  dept_head_id UUID REFERENCES users(id),
  hr_head_id UUID REFERENCES users(id),
  final_approver_id UUID REFERENCES users(id),

  -- 审批时间
  dept_approved_at TIMESTAMPTZ,
  hr_approved_at TIMESTAMPTZ,
  final_approved_at TIMESTAMPTZ,

  -- 发布平台
  publish_platforms TEXT[],       -- ['boss_zhipin', ...]
  published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. 简历库
-- ============================================================

CREATE TYPE resume_source AS ENUM (
  'boss_zhipin',
  'internal_referral',
  'email',
  'other'
);

CREATE TYPE resume_status AS ENUM (
  'new',             -- 新收
  'screening',       -- 筛选中
  'interviewing',    -- 面试中
  'offered',         -- 已发Offer
  'accepted',        -- 已接受
  'rejected',        -- 已淘汰
  'withdrawn'        -- 候选人放弃
);

CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_name VARCHAR(100) NOT NULL,
  gender VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(255),
  source resume_source DEFAULT 'boss_zhipin',
  source_detail TEXT,             -- 来源详情

  -- 教育背景
  highest_education VARCHAR(50),
  school VARCHAR(200),
  major VARCHAR(200),
  graduation_year INT,

  -- 简历文件
  resume_file_url TEXT,
  resume_text TEXT,               -- 解析后的纯文本

  applied_position UUID REFERENCES recruitment_requests(id),
  expected_salary DECIMAL(12,2),
  available_date DATE,

  status resume_status DEFAULT 'new',

  -- 标记
  tags TEXT[],                    -- 标签
  notes TEXT,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. 面试管理
-- ============================================================

CREATE TYPE interview_round AS ENUM (
  'first',           -- 一面 (HR)
  'second',          -- 二面 (BU负责人)
  'final'            -- 终面 (Jenny+黄一萧)
);

CREATE TYPE interview_result AS ENUM (
  'pending',         -- 待面试
  'passed',          -- 通过
  'failed',          -- 未通过
  'cancelled'        -- 取消
);

-- 面试安排
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID REFERENCES resumes(id) NOT NULL,
  recruitment_request_id UUID REFERENCES recruitment_requests(id),
  round interview_round NOT NULL,

  -- 面试时间
  scheduled_at TIMESTAMPTZ,
  location VARCHAR(200),
  interviewers UUID[] NOT NULL,   -- 面试官ID列表

  result interview_result DEFAULT 'pending',
  feedback TEXT,

  -- 面试官评价
  interviewer_notes JSONB,        -- [{"user_id": "...", "notes": "..."}]

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. 求职申请表 (三联单)
-- ============================================================

CREATE TYPE application_status AS ENUM (
  'draft',           -- 草稿
  'submitted',       -- 已提交
  'hr_reviewed',     -- HR已审核
  'dept_reviewed',   -- 部门已审核
  'final_reviewed',  -- 终审通过
  'rejected'         -- 已拒绝
);

-- 求职申请表 - 主表
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_no VARCHAR(50) UNIQUE NOT NULL,
  resume_id UUID REFERENCES resumes(id),
  recruitment_request_id UUID REFERENCES recruitment_requests(id),

  -- 审批状态
  status application_status DEFAULT 'draft',

  -- 第一联: 个人信息 (候选人填写, 免登录链接)
  first_form JSONB,               -- 见 first_form 结构

  -- 第二联: 面试结果 (BU负责人 + Jenny/黄一萧填写)
  second_form JSONB,              -- 见 second_form 结构

  -- 第三联: 录用审批单 (BU负责人填写)
  third_form JSONB,               -- 见 third_form 结构

  -- 审批流
  bu_head_approved BOOLEAN DEFAULT false,
  bu_head_id UUID REFERENCES users(id),
  bu_head_approved_at TIMESTAMPTZ,

  hr_approved BOOLEAN DEFAULT false,
  hr_approver_id UUID REFERENCES users(id),
  hr_approved_at TIMESTAMPTZ,

  final_approved BOOLEAN DEFAULT false,
  final_approver_id UUID REFERENCES users(id),
  final_approved_at TIMESTAMPTZ,

  -- 免登录表单链接
  public_link_token VARCHAR(100) UNIQUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/*
第一联 JSONB 结构:
{
  "personal_info": {
    "name": "", "gender": "", "phone": "", "email": "",
    "id_card": "", "applied_position": ""
  },
  "education": [{"school": "", "major": "", "degree": "", "graduation": ""}],
  "work_experience": [{"company": "", "position": "", "start_date": "", "end_date": ""}],
  "skills": "",
  "self_evaluation": "",
  "expected_salary": 0,
  "available_date": "",
  "emergency_contact": {"name": "", "phone": ""},
  "electronic_signature": ""
}

第二联 JSONB 结构:
{
  "bu_review": {
    "industry_experience": "", "position_experience": "",
    "qualification_match": "", "competency_summary": "",
    "technical_ability": "", "knowledge_structure": "",
    "overall_assessment": "recommend" // or "reject"
  },
  "final_review": {
    "development_potential": "", "culture_match": "",
    "overall_assessment": "hire" // or "reject"
  }
}

第三联 JSONB 结构:
{
  "employment_info": {
    "position_name": "", "department": "", "onboard_company": "",
    "report_to": "", "grade": "", "salary_region": "",
    "monthly_pretax_salary": 0, "probation_salary": 0
  },
  "salary_composition": {
    "base_salary": 0, "meal_allowance": 0, "transport_allowance": 0,
    "housing_allowance": 0, "other_allowance": 0
  },
  "benefits": {
    "social_insurance": true, "commercial_insurance": false, "other": ""
  },
  "start_date": "", "contract_period": "", "probation_period": "",
  "signatures": {
    "bu_head": {"signed": false, "date": null},
    "hr": {"signed": false, "date": null},
    "final": {"signed": false, "date": null}
  }
}
*/

-- ============================================================
-- 7. 入职谈话
-- ============================================================

CREATE TABLE onboarding_talks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES job_applications(id) NOT NULL,
  candidate_name VARCHAR(100) NOT NULL,

  -- 确认信息
  confirmed_position VARCHAR(100),
  confirmed_salary DECIMAL(12,2),
  confirmed_benefits TEXT,
  contract_period VARCHAR(50),
  confirmed_onboard_date DATE,

  -- 额外需求
  need_household_service BOOLEAN DEFAULT false,  -- 落户需求
  need_tripartite_agreement BOOLEAN DEFAULT false, -- 三方协议(实习生)

  participants UUID[],            -- 参与人: bu负责人, HR
  notes TEXT,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. Offer管理
-- ============================================================

CREATE TYPE offer_status AS ENUM (
  'draft',           -- 草稿
  'pending_send',    -- 待发送
  'sent',            -- 已发送
  'delivered',       -- 已送达
  'accepted',        -- 已接受
  'rejected',        -- 已拒绝
  'expired',         -- 已过期
  'revoked'          -- 已撤回
);

CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_no VARCHAR(50) UNIQUE NOT NULL,
  application_id UUID REFERENCES job_applications(id) NOT NULL,

  -- Offer内容
  candidate_name VARCHAR(100) NOT NULL,
  candidate_email VARCHAR(255) NOT NULL,
  onboard_company VARCHAR(200),
  position_name VARCHAR(100),
  grade VARCHAR(20),
  report_to VARCHAR(100),
  monthly_salary DECIMAL(12,2),
  start_date DATE,
  probation_period VARCHAR(50),
  report_time VARCHAR(50),
  report_location VARCHAR(200),

  -- 模板变量JSON
  template_variables JSONB,

  status offer_status DEFAULT 'draft',

  -- 发送追踪
  sent_at TIMESTAMPTZ,
  reply_deadline TIMESTAMPTZ,     -- 回复截止时间
  replied_at TIMESTAMPTZ,
  reply_content TEXT,

  -- 提醒
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,

  -- 是否确认入职(招聘流程结束标记)
  onboarding_confirmed BOOLEAN DEFAULT false,
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. 员工档案
-- ============================================================

CREATE TYPE employee_type AS ENUM (
  'full_time',       -- 全日制员工
  'intern',          -- 实习生
  'retired_rehire',  -- 退休返聘
  'security'         -- 保安
);

CREATE TYPE employee_status AS ENUM (
  'active',          -- 在职
  'probation',       -- 试用期
  'internship',      -- 实习期
  'resigned',        -- 已离职
  'suspended'        -- 停职
);

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_no VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  application_id UUID REFERENCES job_applications(id),

  -- 基本信息
  chinese_name VARCHAR(100) NOT NULL,
  english_name VARCHAR(100),
  gender VARCHAR(10),
  id_card VARCHAR(18),
  phone VARCHAR(20),
  email VARCHAR(255),
  birthday DATE,

  -- 户籍
  household_type VARCHAR(20),     -- 城镇/农村
  household_address TEXT,

  -- 教育
  highest_education VARCHAR(50),
  graduate_school VARCHAR(200),
  major VARCHAR(200),
  graduation_date DATE,

  -- 工作信息
  employee_type employee_type DEFAULT 'full_time',
  department_id UUID REFERENCES departments(id),
  position_name VARCHAR(100),
  grade VARCHAR(20),
  onboard_date DATE,
  contract_start DATE,
  contract_end DATE,
  probation_end DATE,

  -- 薪资
  monthly_salary DECIMAL(12,2),
  bank_account VARCHAR(50),
  bank_name VARCHAR(100),

  -- 状态
  status employee_status DEFAULT 'probation',
  report_to UUID REFERENCES users(id),

  -- 保险
  social_insurance BOOLEAN DEFAULT true,
  commercial_insurance BOOLEAN DEFAULT false,

  -- 紧急联系人
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. 入职文件管理
-- ============================================================

CREATE TYPE onboarding_doc_type AS ENUM (
  'onboarding_guide',         -- 新员工入职引导表
  'offer_letter',             -- 录用通知书
  'employee_info_form',       -- 员工信息登记表
  'recruitment_approval',     -- 录用审批单(第三联)
  'intern_approval',          -- 应届生实习录用表
  'rehire_approval',          -- 劳务录用审批单
  'labor_contract',           -- 劳动合同(含4个附属文件)
  'internship_agreement',     -- 实习协议
  'service_agreement',        -- 劳务协议
  'security_contract',        -- 保安劳动合同
  'employee_handbook',        -- 员工手册
  'other'
);

CREATE TYPE doc_status AS ENUM (
  'pending',         -- 待准备
  'pending_sign',    -- 待签署
  'pending_seal',    -- 待用印
  'sealed',          -- 已用印
  'delivered',       -- 已交付员工
  'archived'         -- 已归档
);

CREATE TABLE onboarding_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  application_id UUID REFERENCES job_applications(id),
  doc_type onboarding_doc_type NOT NULL,
  doc_name VARCHAR(200) NOT NULL,
  doc_number VARCHAR(100),

  -- 签署信息
  signer_id UUID REFERENCES users(id),
  signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,

  -- 用印信息
  need_seal BOOLEAN DEFAULT false,
  seal_count INT DEFAULT 0,
  seal_approved BOOLEAN DEFAULT false,
  seal_approved_by UUID REFERENCES users(id),
  seal_approved_at TIMESTAMPTZ,
  sealed_at TIMESTAMPTZ,

  -- 状态
  status doc_status DEFAULT 'pending',

  -- 文件
  file_url TEXT,
  archived_file_url TEXT,

  -- 备注
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. 行政准备清单
-- ============================================================

CREATE TABLE admin_preparations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) NOT NULL,

  -- 门禁卡
  access_card_issued BOOLEAN DEFAULT false,
  access_card_by UUID REFERENCES users(id),

  -- 工位
  workstation_assigned VARCHAR(100),
  workstation_by UUID REFERENCES users(id),

  -- 电脑
  computer_assigned VARCHAR(200),
  computer_by UUID REFERENCES users(id),

  -- 文具
  stationery_provided BOOLEAN DEFAULT false,

  -- 邮箱
  email_created BOOLEAN DEFAULT false,
  email_created_by UUID REFERENCES users(id),

  -- HKMS
  hkms_account_created BOOLEAN DEFAULT false,
  hkms_created_by UUID REFERENCES users(id),

  -- 钉钉
  dingtalk_added BOOLEAN DEFAULT false,
  dingtalk_added_by UUID REFERENCES users(id),

  -- 微信群
  wechat_group_added BOOLEAN DEFAULT false,
  wechat_added_by UUID REFERENCES users(id),

  -- 培训
  training_completed BOOLEAN DEFAULT false,
  training_by UUID REFERENCES users(id),
  training_date DATE,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. 试用期评估
-- ============================================================

CREATE TYPE evaluation_status AS ENUM (
  'pending_employee',    -- 待员工自评
  'pending_dept',        -- 待部门主管评估
  'pending_bu',          -- 待BU负责人审批
  'pending_hr',          -- 待人事审批
  'pending_final',       -- 待Jenny终审
  'completed',           -- 已完成
  'rejected'             -- 已退回
);

CREATE TABLE probation_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  evaluation_type VARCHAR(50) DEFAULT 'probation', -- probation / internship

  -- 员工自评
  employee_self_review TEXT,
  employee_signed BOOLEAN DEFAULT false,
  employee_signed_at TIMESTAMPTZ,

  -- 部门主管评估
  dept_supervisor_score JSONB,    -- 各项评分
  dept_supervisor_comment TEXT,
  dept_supervisor_id UUID REFERENCES users(id),

  -- 定岗定薪
  confirmed_position VARCHAR(100),
  confirmed_grade VARCHAR(20),
  confirmed_salary DECIMAL(12,2),

  -- 审批
  bu_head_opinion TEXT,
  bu_head_id UUID REFERENCES users(id),
  bu_head_signed BOOLEAN DEFAULT false,
  bu_head_signed_at TIMESTAMPTZ,

  hr_opinion TEXT,
  hr_head_id UUID REFERENCES users(id),
  hr_signed BOOLEAN DEFAULT false,
  hr_signed_at TIMESTAMPTZ,

  final_opinion TEXT,
  final_approver_id UUID REFERENCES users(id),
  final_signed BOOLEAN DEFAULT false,
  final_signed_at TIMESTAMPTZ,

  status evaluation_status DEFAULT 'pending_employee',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. 续签管理
-- ============================================================

CREATE TYPE renewal_status AS ENUM (
  'pending_employee',    -- 待员工确认
  'pending_bu',          -- 待BU负责人审批
  'pending_hr',          -- 待人事审批
  'pending_final',       -- 待Jenny终审
  'approved',            -- 已批准
  'rejected',            -- 已拒绝
  'completed'            -- 已完成
);

CREATE TABLE contract_renewals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  renewal_type VARCHAR(50) NOT NULL,  -- labor_contract / service_agreement

  -- 原合同信息
  original_contract_start DATE,
  original_contract_end DATE,

  -- 续签信息
  new_contract_start DATE,
  new_contract_end DATE,
  new_salary DECIMAL(12,2),
  new_grade VARCHAR(20),

  -- 员工确认
  employee_confirmed BOOLEAN DEFAULT false,
  employee_signed_at TIMESTAMPTZ,

  -- 审批
  bu_head_opinion TEXT,
  bu_head_id UUID REFERENCES users(id),
  bu_head_signed BOOLEAN DEFAULT false,
  bu_head_signed_at TIMESTAMPTZ,

  hr_opinion TEXT,
  hr_head_id UUID REFERENCES users(id),
  hr_signed BOOLEAN DEFAULT false,
  hr_signed_at TIMESTAMPTZ,

  final_opinion TEXT,
  final_approver_id UUID REFERENCES users(id),
  final_signed BOOLEAN DEFAULT false,
  final_signed_at TIMESTAMPTZ,

  -- 用印
  seal_approved BOOLEAN DEFAULT false,
  seal_approved_at TIMESTAMPTZ,

  status renewal_status DEFAULT 'pending_employee',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. 员工流动
-- ============================================================

CREATE TABLE employee_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  transfer_type VARCHAR(50) NOT NULL,  -- transfer / promotion / salary_adjust / re_grade

  -- 变动信息
  from_department_id UUID REFERENCES departments(id),
  to_department_id UUID REFERENCES departments(id),
  from_position VARCHAR(100),
  to_position VARCHAR(100),
  from_grade VARCHAR(20),
  to_grade VARCHAR(20),
  from_salary DECIMAL(12,2),
  to_salary DECIMAL(12,2),
  effective_date DATE,

  reason TEXT,

  -- 审批 (3-4级)
  original_dept_head_id UUID REFERENCES users(id),
  original_dept_signed BOOLEAN DEFAULT false,
  original_dept_signed_at TIMESTAMPTZ,

  new_dept_head_id UUID REFERENCES users(id),
  new_dept_signed BOOLEAN DEFAULT false,
  new_dept_signed_at TIMESTAMPTZ,

  hr_head_id UUID REFERENCES users(id),
  hr_signed BOOLEAN DEFAULT false,
  hr_signed_at TIMESTAMPTZ,

  final_approver_id UUID REFERENCES users(id),
  final_signed BOOLEAN DEFAULT false,
  final_signed_at TIMESTAMPTZ,

  status VARCHAR(50) DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. 离职管理
-- ============================================================

CREATE TYPE resignation_status AS ENUM (
  'pending',         -- 待处理
  'in_progress',     -- 处理中
  'pending_handover', -- 待交接
  'pending_clearance', -- 待结算
  'completed',       -- 已完成
  'cancelled'        -- 已取消
);

CREATE TABLE resignations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) NOT NULL,

  resignation_type VARCHAR(50),    -- 主动离职/协商解除/合同到期不续签
  apply_date DATE NOT NULL,
  last_working_date DATE,
  reason TEXT,

  -- 审批
  dept_head_id UUID REFERENCES users(id),
  dept_head_approved BOOLEAN DEFAULT false,
  dept_head_approved_at TIMESTAMPTZ,

  hr_head_id UUID REFERENCES users(id),
  hr_approved BOOLEAN DEFAULT false,
  hr_approved_at TIMESTAMPTZ,

  final_approver_id UUID REFERENCES users(id),
  final_approved BOOLEAN DEFAULT false,
  final_approved_at TIMESTAMPTZ,

  -- 交接清单
  handover_items JSONB,

  status resignation_status DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. 审批流通用表
-- ============================================================

CREATE TABLE approval_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module VARCHAR(50) NOT NULL,        -- recruitment / onboarding / probation / renewal / transfer / resignation
  record_id UUID NOT NULL,            -- 关联记录ID

  step_order INT NOT NULL,            -- 审批步骤序号
  step_name VARCHAR(100),             -- 步骤名称
  approver_id UUID REFERENCES users(id),
  approver_role VARCHAR(50),

  status VARCHAR(50) DEFAULT 'pending', -- pending / approved / rejected
  opinion TEXT,
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 17. 操作日志
-- ============================================================

CREATE TABLE operation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  module VARCHAR(50),
  action VARCHAR(100),
  record_type VARCHAR(50),
  record_id UUID,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 18. 系统配置
-- ============================================================

CREATE TABLE system_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 索引
-- ============================================================

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_username ON users(username);

CREATE INDEX idx_recruitment_requests_status ON recruitment_requests(status);
CREATE INDEX idx_recruitment_requests_dept ON recruitment_requests(department_id);

CREATE INDEX idx_resumes_status ON resumes(status);
CREATE INDEX idx_resumes_applied ON resumes(applied_position);

CREATE INDEX idx_interviews_resume ON interviews(resume_id);
CREATE INDEX idx_interviews_round ON interviews(round);

CREATE INDEX idx_job_applications_resume ON job_applications(resume_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);

CREATE INDEX idx_offers_application ON offers(application_id);
CREATE INDEX idx_offers_status ON offers(status);

CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_dept ON employees(department_id);

CREATE INDEX idx_onboarding_docs_employee ON onboarding_documents(employee_id);

CREATE INDEX idx_probation_evaluations_employee ON probation_evaluations(employee_id);
CREATE INDEX idx_probation_evaluations_status ON probation_evaluations(status);

CREATE INDEX idx_contract_renewals_employee ON contract_renewals(employee_id);

CREATE INDEX idx_employee_transfers_employee ON employee_transfers(employee_id);

CREATE INDEX idx_resignations_employee ON resignations(employee_id);

CREATE INDEX idx_approval_records_module ON approval_records(module, record_id);

CREATE INDEX idx_operation_logs_user ON operation_logs(user_id);
CREATE INDEX idx_operation_logs_module ON operation_logs(module);

-- ============================================================
-- RLS (Row Level Security) 策略
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE probation_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE resignations ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_records ENABLE ROW LEVEL SECURITY;

-- 超级管理员/主管理员/子管理员: 全部可读写
-- BU负责人: 本部门数据可读写
-- 普通员工: 仅查看本人相关数据
