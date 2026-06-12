-- ============================================================
-- 创建5位测试员工 Supabase Auth 账号
-- 密码统一: ky2026
-- 请在 Supabase SQL Editor 中执行此脚本
-- ============================================================

-- 使用 Supabase 内置的 auth.users 创建方式
-- 通过 supabase_auth.create_user() 或直接操作 auth schema

-- 1. 李明 - Java实习生 (EMP2026001)
SELECT auth.create_user(
  uid := 'c91aba80-b393-4c0f-891c-c54d3368f7a8',
  email := 'liming@china-key.com',
  password := 'ky2026',
  email_confirm := true
);

-- 2. 张思雨 - 管培生 (EMP2026002)
SELECT auth.create_user(
  uid := '69b4b1f1-8d09-44a4-bbbe-c1b00a5585a6',
  email := 'zhangsiyu@china-key.com',
  password := 'ky2026',
  email_confirm := true
);

-- 3. 王浩然 - HR实习生 (EMP2026003)
SELECT auth.create_user(
  uid := '64957763-ec08-428c-92e4-12003be60dd8',
  email := 'wanghaoran@china-key.com',
  password := 'ky2026',
  email_confirm := true
);

-- 4. 赵建国 - 退休返聘 (EMP2026004)
SELECT auth.create_user(
  uid := '2b0ae11f-2075-41ba-ba02-8832153a87cd',
  email := 'zhaojianguo@china-key.com',
  password := 'ky2026',
  email_confirm := true
);

-- 5. 陈志强 - 保安 (EMP2026005)
SELECT auth.create_user(
  uid := 'ccae98a0-8127-46b6-abf5-5d97bc4bfd0f',
  email := 'chenzhiqiang@china-key.com',
  password := 'ky2026',
  email_confirm := true
);

-- 验证
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email LIKE '%china-key.com'
ORDER BY email;
