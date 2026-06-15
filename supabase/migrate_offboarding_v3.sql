-- ============================================================
-- HRO人事管理系统 - 离职管理V3数据库迁移
-- 上海羿工分信息科技有限公司
-- 执行环境: Supabase SQL Editor
-- 说明: 创建完整offboarding模块所需的3张新表 + RLS策略
-- ============================================================

-- ============================================================
-- 1. 创建枚举类型
-- ============================================================

-- 离职发起方
CREATE TYPE offboarding_initiator_type AS ENUM (
  'employee',    -- 员工主动
  'company'      -- 公司发起
);

-- 离职类型
CREATE TYPE offboarding_type AS ENUM (
  'resignation',   -- 主动辞职
  'termination',   -- 辞退/解雇
  'retirement'     -- 退休
);

-- 离职单状态
CREATE TYPE offboarding_case_status AS ENUM (
  'pending',       -- 待审批
  'approved',      -- 已批准
  'handovering',   -- 交接中
  'settled',       -- 已结算
  'closed'         -- 已关闭
);

-- 交接项类型
CREATE TYPE handover_item_type AS ENUM (
  'asset',       -- 资产类
  'knowledge',   -- 知识/权限类
  'finance'      -- 财务类
);

-- 交接项状态
CREATE TYPE handover_item_status AS ENUM (
  'pending',     -- 待交接
  'confirmed'    -- 已确认
);

-- ============================================================
-- 2. 创建离职管理主表
-- ============================================================

CREATE TABLE offboarding_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) NOT NULL,

  -- 离职信息
  initiator_type offboarding_initiator_type NOT NULL,
  type offboarding_type NOT NULL,
  status offboarding_case_status DEFAULT 'pending',

  -- 原因
  reason_code VARCHAR(50),       -- 下拉字典: salary/career_growth/environment/management/personal/discipline/layoff/other
  reason_detail TEXT,            -- 详细说明

  -- 时间节点
  last_working_day DATE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,

  -- 审批
  approver_id UUID REFERENCES users(id),

  -- 补偿金
  compensation_amount NUMERIC(12,2),

  -- 结算信息（settled时填充）
  settlement_data JSONB,         -- { final_salary, unused_annual_leave_days, annual_leave_compensation, service_years, n_plus_one, total_settlement }
  settlement_by UUID REFERENCES users(id),
  settled_at TIMESTAMPTZ,

  -- 备注
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. 创建交接清单表
-- ============================================================

CREATE TABLE offboarding_handover_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES offboarding_cases(id) ON DELETE CASCADE NOT NULL,

  item_type handover_item_type NOT NULL,
  description TEXT NOT NULL,
  assigned_to UUID REFERENCES users(id),   -- 接收人

  status handover_item_status DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES users(id),

  sort_order INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. 创建离职面谈表
-- ============================================================

CREATE TABLE offboarding_exit_interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES offboarding_cases(id) ON DELETE CASCADE NOT NULL,

  interviewer_id UUID REFERENCES users(id),
  interview_date DATE,

  rating INT CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  rehire_eligible BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. RLS策略 - 启用行级安全
-- ============================================================

ALTER TABLE offboarding_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE offboarding_handover_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE offboarding_exit_interviews ENABLE ROW LEVEL SECURITY;

-- === offboarding_cases 策略 ===

-- 所有认证用户可查看（前端根据角色过滤）
CREATE POLICY "Authenticated users can view offboarding_cases"
  ON offboarding_cases
  FOR SELECT
  TO authenticated
  USING (true);

-- 员工只能插入自己的离职单
CREATE POLICY "Employees can insert own case"
  ON offboarding_cases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'employee'
    AND employee_id = (SELECT id FROM employees WHERE id = offboarding_cases.employee_id)
  );

-- HR/Admin可以插入任意离职单
CREATE POLICY "HR can insert any case"
  ON offboarding_cases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('super_admin', 'main_admin', 'sub_admin')
  );

-- 员工只能更新自己的离职单（且仅限pending状态）
CREATE POLICY "Employees can update own case"
  ON offboarding_cases
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'employee'
    AND employee_id = (SELECT id FROM employees WHERE id = offboarding_cases.employee_id)
    AND status = 'pending'
  );

-- HR/Admin可以更新任意离职单
CREATE POLICY "HR can update any case"
  ON offboarding_cases
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('super_admin', 'main_admin', 'sub_admin')
  );

-- HR/Admin可以删除离职单
CREATE POLICY "HR can delete cases"
  ON offboarding_cases
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('super_admin', 'main_admin', 'sub_admin')
  );

-- === offboarding_handover_items 策略 ===

CREATE POLICY "Authenticated users can view handover items"
  ON offboarding_handover_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR can insert handover items"
  ON offboarding_handover_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('super_admin', 'main_admin', 'sub_admin')
  );

CREATE POLICY "HR can update handover items"
  ON offboarding_handover_items
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('super_admin', 'main_admin', 'sub_admin')
  );

CREATE POLICY "HR can delete handover items"
  ON offboarding_handover_items
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('super_admin', 'main_admin', 'sub_admin')
  );

-- === offboarding_exit_interviews 策略 ===

CREATE POLICY "Authenticated users can view exit interviews"
  ON offboarding_exit_interviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR can insert exit interviews"
  ON offboarding_exit_interviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('super_admin', 'main_admin', 'sub_admin')
  );

CREATE POLICY "HR can update exit interviews"
  ON offboarding_exit_interviews
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('super_admin', 'main_admin', 'sub_admin')
  );

-- ============================================================
-- 6. 默认交接项模板函数
-- ============================================================

-- 当离职单被批准后，自动创建默认交接清单
CREATE OR REPLACE FUNCTION create_default_handover_items()
RETURNS TRIGGER AS $$
DECLARE
  emp_record RECORD;
BEGIN
  -- 仅在状态变更为 approved 时触发
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- 获取员工信息
    SELECT * INTO emp_record FROM employees WHERE id = NEW.employee_id;

    -- 插入默认交接项
    INSERT INTO offboarding_handover_items (case_id, item_type, description, sort_order) VALUES
      (NEW.id, 'asset', '归还公司电脑及配件', 1),
      (NEW.id, 'asset', '归还门禁卡/工牌', 2),
      (NEW.id, 'knowledge', '工作文档及项目资料交接', 3),
      (NEW.id, 'knowledge', '系统账号及权限移交', 4),
      (NEW.id, 'finance', '财务报销清算', 5),
      (NEW.id, 'finance', '薪资结算确认', 6);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trg_create_default_handover ON offboarding_cases;
CREATE TRIGGER trg_create_default_handover
  AFTER UPDATE ON offboarding_cases
  FOR EACH ROW
  EXECUTE FUNCTION create_default_handover_items();

-- ============================================================
-- 7. 通知触发器 - 离职单状态变更通知
-- ============================================================

CREATE OR REPLACE FUNCTION notify_offboarding_status_change()
RETURNS TRIGGER AS $$
DECLARE
  emp_name VARCHAR;
  notif_title VARCHAR;
  notif_content TEXT;
BEGIN
  SELECT display_name INTO emp_name FROM employees WHERE id = NEW.employee_id;

  -- 员工提交离职申请 → 通知HR
  IF TG_OP = 'INSERT' THEN
    notif_title := '新离职申请';
    notif_content := emp_name || ' 提交了离职申请，请及时审批。';
    INSERT INTO notifications (user_id, title, content)
    SELECT id, notif_title, notif_content FROM users WHERE role IN ('super_admin', 'main_admin', 'sub_admin');
  END IF;

  -- 状态变更 → 通知员工
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'approved' THEN
        notif_title := '离职申请已批准';
        notif_content := '您的离职申请已批准，最后工作日为 ' || NEW.last_working_day::TEXT || '。请尽快完成工作交接。';
      WHEN 'settled' THEN
        notif_title := '离职结算已完成';
        notif_content := '您的离职结算已完成，结算金额 ¥' || NEW.settlement_data->>'total_settlement' || '。';
      WHEN 'closed' THEN
        notif_title := '离职流程已关闭';
        notif_content := '您的离职流程已全部完成。';
      ELSE
        RETURN NEW;
    END CASE;

    -- 通知员工本人
    INSERT INTO notifications (user_id, title, content)
    SELECT id, notif_title, notif_content FROM users WHERE username = (SELECT email FROM employees WHERE id = NEW.employee_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_offboarding ON offboarding_cases;
CREATE TRIGGER trg_notify_offboarding
  AFTER INSERT OR UPDATE ON offboarding_cases
  FOR EACH ROW
  EXECUTE FUNCTION notify_offboarding_status_change();

-- ============================================================
-- 8. 索引
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_offboarding_cases_employee ON offboarding_cases(employee_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_cases_status ON offboarding_cases(status);
CREATE INDEX IF NOT EXISTS idx_offboarding_cases_type ON offboarding_cases(type);
CREATE INDEX IF NOT EXISTS idx_handover_items_case ON offboarding_handover_items(case_id);
CREATE INDEX IF NOT EXISTS idx_exit_interviews_case ON offboarding_exit_interviews(case_id);

-- ============================================================
-- 9. 虚拟种子数据（可选，用于开发测试）
-- ============================================================

-- 假设 employees 表中存在测试员工，插入几条离职单
-- 请根据实际员工ID调整
-- INSERT INTO offboarding_cases (employee_id, initiator_type, type, reason_code, reason_detail, last_working_day)
-- VALUES
--   ('<employee-uuid-1>', 'employee', 'resignation', 'career_growth', '个人职业发展需要，寻求新机会', '2026-07-31'),
--   ('<employee-uuid-2>', 'company', 'termination', 'discipline', '严重违反公司规章制度', '2026-06-30');

-- ============================================================
-- 完成
-- ============================================================
