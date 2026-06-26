// ============================================================
// 离职管理模块 - 模拟数据
// 当 Supabase 表不存在或查询失败时自动 fallback
// ============================================================

import type { OffboardingCase, OffboardingHandoverItem } from '../types';

// ============================================================
// 模拟员工数据
// ============================================================

export interface MockEmployee {
  id: string;
  chinese_name: string;
  employee_no: string;
  position_name: string;
  employee_type: string;
  department: string;
  name: string;
  email: string;
}

export const mockEmployees: MockEmployee[] = [
  { id: 'emp-001', chinese_name: '张三', employee_no: 'YG2021001', position_name: '高级前端工程师', employee_type: 'full_time', department: '技术部', name: '张三', email: 'zhangsan@example.com' },
  { id: 'emp-002', chinese_name: '李四', employee_no: 'YG2021002', position_name: '产品经理', employee_type: 'full_time', department: '产品部', name: '李四', email: 'lisi@example.com' },
  { id: 'emp-003', chinese_name: '王五', employee_no: 'YG2021003', position_name: 'UI设计师', employee_type: 'full_time', department: '设计部', name: '王五', email: 'wangwu@example.com' },
  { id: 'emp-004', chinese_name: '赵六', employee_no: 'YG2022004', position_name: '后端开发工程师', employee_type: 'full_time', department: '技术部', name: '赵六', email: 'zhaoliu@example.com' },
  { id: 'emp-005', chinese_name: '孙七', employee_no: 'YG2022005', position_name: '测试工程师', employee_type: 'full_time', department: '质量部', name: '孙七', email: 'sunqi@example.com' },
  { id: 'emp-006', chinese_name: '周八', employee_no: 'YG2023006', position_name: '运营专员', employee_type: 'full_time', department: '运营部', name: '周八', email: 'zhouba@example.com' },
  { id: 'emp-007', chinese_name: '吴九', employee_no: 'YG2023007', position_name: '市场经理', employee_type: 'full_time', department: '市场部', name: '吴九', email: 'wujiu@example.com' },
  { id: 'emp-008', chinese_name: '郑十', employee_no: 'YG2024008', position_name: 'HR专员', employee_type: 'full_time', department: '人事部', name: '郑十', email: 'zhengshi@example.com' },
  { id: 'emp-009', chinese_name: '陈小明', employee_no: 'YG2024009', position_name: '前端实习生', employee_type: 'intern', department: '技术部', name: '陈小明', email: 'chenxm@example.com' },
  { id: 'emp-010', chinese_name: '林小红', employee_no: 'YG2024010', position_name: '财务专员', employee_type: 'full_time', department: '财务部', name: '林小红', email: 'linxh@example.com' },
];

// ============================================================
// 模拟离职单数据
// ============================================================

export const mockOffboardingCases: OffboardingCase[] = [
  {
    id: 'case-001',
    employee_id: 'emp-001',
    initiator_type: 'employee',
    type: 'resignation',
    status: 'pending',
    reason_code: 'career_growth',
    reason_detail: '希望寻求更广阔的职业发展空间，已收到其他公司的offer',
    last_working_day: '2026-07-25',
    submitted_at: '2026-06-25T09:00:00Z',
    approved_at: '',
    approver_id: '',
    compensation_amount: 0,
    settlement_data: null,
    settlement_by: '',
    settled_at: '',
    notes: '',
    created_at: '2026-06-25T09:00:00Z',
    updated_at: '2026-06-25T09:00:00Z',
    employee_name: '张三',
    employee_department: '技术部',
    employee_position: '高级前端工程师',
    employee_no: 'YG2021001',
    approver_name: '',
  },
  {
    id: 'case-002',
    employee_id: 'emp-003',
    initiator_type: 'company',
    type: 'termination',
    status: 'approved',
    reason_code: 'layoff',
    reason_detail: '因业务调整，设计部门缩编，协商解除劳动合同',
    last_working_day: '2026-07-15',
    submitted_at: '2026-06-15T14:30:00Z',
    approved_at: '2026-06-16T10:00:00Z',
    approver_id: 'user-hr-001',
    compensation_amount: 45000,
    settlement_data: null,
    settlement_by: '',
    settled_at: '',
    notes: '补偿金按N+1标准计算',
    created_at: '2026-06-15T14:30:00Z',
    updated_at: '2026-06-16T10:00:00Z',
    employee_name: '王五',
    employee_department: '设计部',
    employee_position: 'UI设计师',
    employee_no: 'YG2021003',
    approver_name: '黄一萧',
  },
  {
    id: 'case-003',
    employee_id: 'emp-006',
    initiator_type: 'employee',
    type: 'resignation',
    status: 'handovering',
    reason_code: 'personal',
    reason_detail: '因个人家庭原因需要回老家发展',
    last_working_day: '2026-07-20',
    submitted_at: '2026-06-20T10:00:00Z',
    approved_at: '2026-06-21T09:00:00Z',
    approver_id: 'user-hr-001',
    compensation_amount: 0,
    settlement_data: null,
    settlement_by: '',
    settled_at: '',
    notes: '',
    created_at: '2026-06-20T10:00:00Z',
    updated_at: '2026-06-21T09:00:00Z',
    employee_name: '周八',
    employee_department: '运营部',
    employee_position: '运营专员',
    employee_no: 'YG2023006',
    approver_name: '黄一萧',
  },
  {
    id: 'case-004',
    employee_id: 'emp-005',
    initiator_type: 'employee',
    type: 'resignation',
    status: 'settled',
    reason_code: 'salary',
    reason_detail: '薪资待遇与期望差距较大',
    last_working_day: '2026-06-30',
    submitted_at: '2026-05-30T08:00:00Z',
    approved_at: '2026-05-31T10:00:00Z',
    approver_id: 'user-hr-001',
    compensation_amount: 0,
    settlement_data: null,
    settlement_by: 'user-hr-001',
    settled_at: '2026-06-30T17:00:00Z',
    notes: '',
    created_at: '2026-05-30T08:00:00Z',
    updated_at: '2026-06-30T17:00:00Z',
    employee_name: '孙七',
    employee_department: '质量部',
    employee_position: '测试工程师',
    employee_no: 'YG2022005',
    approver_name: '黄一萧',
  },
  {
    id: 'case-005',
    employee_id: 'emp-009',
    initiator_type: 'employee',
    type: 'resignation',
    status: 'closed',
    reason_code: 'career_growth',
    reason_detail: '实习期满，回校继续深造',
    last_working_day: '2026-06-01',
    submitted_at: '2026-05-01T09:00:00Z',
    approved_at: '2026-05-02T09:00:00Z',
    approver_id: 'user-hr-001',
    compensation_amount: 0,
    settlement_data: null,
    settlement_by: 'user-hr-001',
    settled_at: '2026-06-01T17:00:00Z',
    notes: '实习生正常离职',
    created_at: '2026-05-01T09:00:00Z',
    updated_at: '2026-06-01T17:00:00Z',
    employee_name: '陈小明',
    employee_department: '技术部',
    employee_position: '前端实习生',
    employee_no: 'YG2024009',
    approver_name: '黄一萧',
  },
  {
    id: 'case-006',
    employee_id: 'emp-004',
    initiator_type: 'company',
    type: 'termination',
    status: 'pending',
    reason_code: 'discipline',
    reason_detail: '多次违反公司考勤制度，经多次警告无效',
    last_working_day: '2026-07-10',
    submitted_at: '2026-06-24T16:00:00Z',
    approved_at: '',
    approver_id: '',
    compensation_amount: 0,
    settlement_data: null,
    settlement_by: '',
    settled_at: '',
    notes: '需走辞退流程，签署协商解除协议',
    created_at: '2026-06-24T16:00:00Z',
    updated_at: '2026-06-24T16:00:00Z',
    employee_name: '赵六',
    employee_department: '技术部',
    employee_position: '后端开发工程师',
    employee_no: 'YG2022004',
    approver_name: '',
  },
];

// ============================================================
// 模拟交接项数据（用于 OffboardingHandover 页面）
// ============================================================

export const mockHandoverItems: Record<string, OffboardingHandoverItem[]> = {
  'case-003': [
    { id: 'hi-001', case_id: 'case-003', item_type: 'asset', description: '归还公司笔记本电脑 MacBook Pro', assigned_to: 'MIS-01', status: 'confirmed', confirmed_at: '2026-06-22T10:00:00Z', confirmed_by: 'admin', sort_order: 1, created_at: '2026-06-21T09:00:00Z', assigned_to_name: 'MIS管理员', confirmed_by_name: '黄一萧' },
    { id: 'hi-002', case_id: 'case-003', item_type: 'asset', description: '归还门禁卡和工牌', assigned_to: 'ADMIN-01', status: 'confirmed', confirmed_at: '2026-06-22T11:00:00Z', confirmed_by: 'admin', sort_order: 2, created_at: '2026-06-21T09:00:00Z', assigned_to_name: 'Admin管理员', confirmed_by_name: '黄一萧' },
    { id: 'hi-003', case_id: 'case-003', item_type: 'knowledge', description: '交接运营数据看板权限', assigned_to: 'emp-007', status: 'confirmed', confirmed_at: '2026-06-23T09:00:00Z', confirmed_by: 'bu_head', sort_order: 3, created_at: '2026-06-21T09:00:00Z', assigned_to_name: '吴九', confirmed_by_name: '部门负责人' },
    { id: 'hi-004', case_id: 'case-003', item_type: 'knowledge', description: '交接社媒账号密码及运营文档', assigned_to: 'emp-007', status: 'pending', confirmed_at: '', confirmed_by: '', sort_order: 4, created_at: '2026-06-21T09:00:00Z', assigned_to_name: '吴九', confirmed_by_name: '' },
    { id: 'hi-005', case_id: 'case-003', item_type: 'finance', description: '结算未报销的差旅费用', assigned_to: 'FIN-01', status: 'pending', confirmed_at: '', confirmed_by: '', sort_order: 5, created_at: '2026-06-21T09:00:00Z', assigned_to_name: '财务', confirmed_by_name: '' },
  ],
};

// ============================================================
// 模拟离职交接清单数据（用于 OffboardingHandoverChecklist 页面）
// ============================================================

export interface MockChecklistItem {
  id: string;
  employee_id: string;
  dept_key: string;
  item_index: number;
  description: string;
  status: 'pending' | 'confirmed';
  confirmed_by: string | null;
  confirmed_by_name: string | null;
  confirmed_at: string | null;
  note: string | null;
}

export const mockChecklistItems: MockChecklistItem[] = [
  // emp-003 (王五) — 已批准，部分已确认
  { id: 'cl-001', employee_id: 'emp-003', dept_key: 'dept_head', item_index: 0, description: '所有相关的书面文件、合同等的交接', status: 'confirmed', confirmed_by: 'user-hr-001', confirmed_by_name: '黄一萧', confirmed_at: '2026-06-20T10:30:00Z', note: null },
  { id: 'cl-002', employee_id: 'emp-003', dept_key: 'dept_head', item_index: 1, description: '所有相关的电子文档的交接', status: 'confirmed', confirmed_by: 'user-hr-001', confirmed_by_name: '黄一萧', confirmed_at: '2026-06-20T11:00:00Z', note: null },
  { id: 'cl-003', employee_id: 'emp-003', dept_key: 'dept_head', item_index: 2, description: '正在进行工作的交接', status: 'pending', confirmed_by: null, confirmed_by_name: null, confirmed_at: null, note: null },
  { id: 'cl-004', employee_id: 'emp-003', dept_key: 'dept_head', item_index: 3, description: '对外客户关系及沟通程度的交接', status: 'pending', confirmed_by: null, confirmed_by_name: null, confirmed_at: null, note: null },
  { id: 'cl-005', employee_id: 'emp-003', dept_key: 'mis', item_index: 0, description: '保存备份 E-mail 内容并切断 E-mail 地址', status: 'confirmed', confirmed_by: 'user-mis-001', confirmed_by_name: 'MIS管理员', confirmed_at: '2026-06-21T09:00:00Z', note: null },
  { id: 'cl-006', employee_id: 'emp-003', dept_key: 'admin', item_index: 0, description: '门禁卡的归还', status: 'pending', confirmed_by: null, confirmed_by_name: null, confirmed_at: null, note: null },
  { id: 'cl-007', employee_id: 'emp-003', dept_key: 'finance', item_index: 0, description: '应收应付款项的结算', status: 'pending', confirmed_by: null, confirmed_by_name: null, confirmed_at: null, note: null },
  { id: 'cl-008', employee_id: 'emp-003', dept_key: 'finance', item_index: 1, description: '预借款等的结算', status: 'pending', confirmed_by: null, confirmed_by_name: null, confirmed_at: null, note: null },
  { id: 'cl-009', employee_id: 'emp-003', dept_key: 'hr', item_index: 0, description: '公司档案的归还', status: 'pending', confirmed_by: null, confirmed_by_name: null, confirmed_at: null, note: null },
  { id: 'cl-010', employee_id: 'emp-003', dept_key: 'hr', item_index: 1, description: '登记个人联系信息', status: 'pending', confirmed_by: null, confirmed_by_name: null, confirmed_at: null, note: null },
];
