# HRO人事管理系统

上海弈工分信息科技有限公司 - 人力资源管理系统

## 功能模块

- **工作台** - 数据概览、待办任务、近期动态
- **招聘管理** - 简历库、面试安排（一面/二面/终面）、招聘需求（《聘用员工申请表》）、Offer管理
- **入职管理** - 11类入职文件管理（劳动合同、实习协议、劳务协议等）、用印流程、行政准备
- **在职管理** - 试用期/实习评估、续签管理、员工流动、员工档案
- **日常管理** - 考勤查看、请假管理、用印申请
- **离职板块** - 离职申请、三级审批、交接结算
- **审批管理** - 统一审批工作台

## 用户账号

| 用户名 | 姓名 | 角色 | 权限 |
|--------|------|------|------|
| tina | 黄燕婷 | 系统子管理员 | 全模块管理 |
| jenny | Jenny | 超级管理员 | 终审权限 |
| shaun | 黄一萧 | 系统主管理员 | 全模块管理 |
| bella | 王妤扬 | BU负责人 | 本部门管理 |
| employee | 普通员工 | 仅查看 | 仅查看 |

密码统一：`ky2026`

## 技术栈

- **前端**: React 18 + TypeScript + Ant Design 5 + Vite 6
- **状态管理**: Zustand
- **后端**: Supabase (PostgreSQL + Auth)
- **部署**: GitHub Pages

## 快速开始

### 1. 配置 Supabase

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 在 SQL Editor 中执行 `supabase/schema.sql` 创建数据库表
3. 执行 `supabase/seed.sql` 初始化预设数据
4. 在 Authentication > Settings 中启用 Email 登录
5. 获取项目 URL 和 anon key

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入 Supabase 配置
```

### 3. 安装依赖

```bash
npm install
```

### 4. 启动开发服务器

```bash
npm run dev
```

### 5. 构建部署

```bash
npm run build
```

## GitHub Pages 部署

1. 在 GitHub 仓库 Settings > Secrets and variables > Actions 中添加:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. 在 Settings > Pages 中启用 GitHub Pages，选择 GitHub Actions
3. Push 代码到 main 分支自动触发部署

## 数据库结构

详见 `supabase/schema.sql`，包含以下核心表：

- `users` - 用户与权限
- `recruitment_requests` - 《聘用员工申请表》
- `resumes` - 简历库
- `interviews` - 面试安排
- `job_applications` - 《求职申请表》(三联单)
- `offers` - Offer管理
- `employees` - 员工档案
- `onboarding_documents` - 入职文件
- `probation_evaluations` - 试用期/实习评估
- `contract_renewals` - 续签管理
- `employee_transfers` - 员工流动
- `resignations` - 离职管理
- `approval_records` - 审批记录
