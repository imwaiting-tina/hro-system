-- ============================================================
-- 预设数据初始化脚本
-- 密码统一为 ky2026, 使用 bcrypt 哈希
-- ============================================================

-- 预设5个账号 (密码: ky2026)
-- bcrypt hash of "ky2026" - 在实际部署时需要通过Supabase Auth API创建
INSERT INTO users (username, password_hash, display_name, role, email, department, position) VALUES
  ('tina',    '$2a$10$igAO1bB9ioW53rMkgxfVaeCcNJQfCh09Fss6z5Sn/2T6D5Tyu0Qoq',    '黄燕婷', 'sub_admin',   'tina_huang@china-key.com',   '人事部',   'HR经理'),
  ('jenny',   '$2a$10$igAO1bB9ioW53rMkgxfVaeCcNJQfCh09Fss6z5Sn/2T6D5Tyu0Qoq',   'Jenny',   'super_admin', 'jenny@china-key.com',        '董事会',   '董事'),
  ('shaun',   '$2a$10$igAO1bB9ioW53rMkgxfVaeCcNJQfCh09Fss6z5Sn/2T6D5Tyu0Qoq',   '黄一萧', 'main_admin',  'shaun_huang@china-key.com',   '人事部',   '人事负责人'),
  ('bella',   '$2a$10$igAO1bB9ioW53rMkgxfVaeCcNJQfCh09Fss6z5Sn/2T6D5Tyu0Qoq',   '王妤扬', 'bu_head',     'bella_wang@china-key.com',    '业务部',   'BU负责人'),
  ('employee','$2a$10$igAO1bB9ioW53rMkgxfVaeCcNJQfCh09Fss6z5Sn/2T6D5Tyu0Qoq','普通员工','employee',    'employee@china-key.com',      '业务部',   '员工')
ON CONFLICT (username) DO NOTHING;

-- 预设部门
INSERT INTO departments (name, sort_order) VALUES
  ('董事会', 1),
  ('人事部', 2),
  ('财务部', 3),
  ('法务部', 4),
  ('技术部', 5),
  ('行政部', 6),
  ('业务部', 7)
ON CONFLICT DO NOTHING;

-- 预设系统配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
  ('company_name', '{"value": "上海弈工分信息科技有限公司"}', '公司全称'),
  ('company_short_name', '{"value": "弈工分"}', '公司简称'),
  ('offer_email_template', '{"subject": "录用通知书 - {{position}}", "body": "尊敬的{{candidate_name}}{{gender_title}}：\n\n您好！\n\n我们非常荣幸可以邀请您加入{{company_name}}（以下简称公司）：\n..."}', 'Offer邮件模板'),
  ('recruitment_platforms', '{"platforms": ["boss_zhipin"], "boss_account": "上海弈工分信息", "contact_phone": "15617500410", "receive_email": "tina.huang@china-key.com"}', '招聘平台配置')
ON CONFLICT (config_key) DO NOTHING;
