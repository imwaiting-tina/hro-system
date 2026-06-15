// 自动生成的保险记录 mock 数据
// 数据来源：友邦意外险电子合同 G09221638G + 团险协议-开弈2026
// 保险期间：意外险 2025.10.16-2026.10.15 | 团险 2026.04.01-2027.03.31
// 生成时间：2026-06-15
// 仅包含指定11人：宋卫东、翟建设、徐培珍、于爱丽、孙建芳、殷德昌、高玉玲、丁成英、施玉芹、张林梅、韩雅凤

export interface InsuranceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_no: string;
  department_name: string;
  insurance_type: string;
  insurance_provider: string;
  policy_number: string;
  insured_name: string;
  relation: string;
  relation_detail: string;
  coverage_start: string;
  coverage_end: string;
  monthly_premium: number;
  coverage_amount: number;
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  remarks: string;
  created_at: string;
  updated_at: string;
}

export const REAL_INSURANCE_DATA: InsuranceRecord[] = [
  { id: 'real-1', employee_id: 'I049850380', employee_name: '宋卫东', employee_no: '', department_name: '上海开弈人力资源管理有限公司', insurance_type: '友邦意外险', insurance_provider: '友邦保险', policy_number: 'G09221638G', insured_name: '宋卫东', relation: '本人', relation_detail: '', coverage_start: '2025-10-16', coverage_end: '2026-10-15', monthly_premium: 360.0, coverage_amount: 400000, status: 'active', remarks: '意外险-员工 | 弈工分信息', created_at: '2025-10-16', updated_at: '2026-06-01',  },
  { id: 'real-2', employee_id: 'I049850383', employee_name: '翟建设', employee_no: '', department_name: '上海开弈人力资源管理有限公司', insurance_type: '友邦意外险', insurance_provider: '友邦保险', policy_number: 'G09221638G', insured_name: '翟建设', relation: '本人', relation_detail: '', coverage_start: '2025-10-16', coverage_end: '2026-10-15', monthly_premium: 360.0, coverage_amount: 400000, status: 'active', remarks: '意外险-员工 | 弈工分信息', created_at: '2025-10-16', updated_at: '2026-06-01',  },
  { id: 'real-3', employee_id: 'I049850384', employee_name: '徐培珍', employee_no: '', department_name: '上海开弈人力资源管理有限公司', insurance_type: '友邦意外险', insurance_provider: '友邦保险', policy_number: 'G09221638G', insured_name: '徐培珍', relation: '本人', relation_detail: '', coverage_start: '2025-10-16', coverage_end: '2026-10-15', monthly_premium: 360.0, coverage_amount: 400000, status: 'active', remarks: '意外险-员工 | 弈工分信息', created_at: '2025-10-16', updated_at: '2026-06-01',  },
  { id: 'real-4', employee_id: 'I049850388', employee_name: '于爱丽', employee_no: '', department_name: '上海开弈人力资源管理有限公司', insurance_type: '友邦意外险', insurance_provider: '友邦保险', policy_number: 'G09221638G', insured_name: '于爱丽', relation: '本人', relation_detail: '', coverage_start: '2025-10-16', coverage_end: '2026-10-15', monthly_premium: 360.0, coverage_amount: 400000, status: 'active', remarks: '意外险-员工 | 弈工分信息', created_at: '2025-10-16', updated_at: '2026-06-01',  },
  { id: 'real-5', employee_id: 'I050162388', employee_name: '孙建芳', employee_no: '', department_name: '上海开弈人力资源管理有限公司', insurance_type: '友邦意外险', insurance_provider: '友邦保险', policy_number: 'G09221638G', insured_name: '孙建芳', relation: '本人', relation_detail: '', coverage_start: '2025-10-16', coverage_end: '2026-10-15', monthly_premium: 360.0, coverage_amount: 400000, status: 'active', remarks: '意外险-员工 | 弈工分健康', created_at: '2025-10-16', updated_at: '2026-06-01',  },
  { id: 'real-6', employee_id: 'I050162394', employee_name: '殷德昌', employee_no: '', department_name: '上海开弈人力资源管理有限公司', insurance_type: '友邦意外险', insurance_provider: '友邦保险', policy_number: 'G09221638G', insured_name: '殷德昌', relation: '本人', relation_detail: '', coverage_start: '2025-10-16', coverage_end: '2026-10-15', monthly_premium: 360.0, coverage_amount: 400000, status: 'active', remarks: '意外险-员工 | 弈工分健康', created_at: '2025-10-16', updated_at: '2026-06-01',  },
  { id: 'real-7', employee_id: 'I050290080', employee_name: '高玉玲', employee_no: '', department_name: '上海开弈人力资源管理有限公司', insurance_type: '友邦意外险', insurance_provider: '友邦保险', policy_number: 'G09221638G', insured_name: '高玉玲', relation: '本人', relation_detail: '', coverage_start: '2025-10-16', coverage_end: '2026-10-15', monthly_premium: 360.0, coverage_amount: 400000, status: 'active', remarks: '意外险-员工 | 弈工分健康', created_at: '2025-10-16', updated_at: '2026-06-01',  },
  { id: 'real-8', employee_id: 'I050290084', employee_name: '丁成英', employee_no: '', department_name: '上海开弈人力资源管理有限公司', insurance_type: '友邦意外险', insurance_provider: '友邦保险', policy_number: 'G09221638G', insured_name: '丁成英', relation: '本人', relation_detail: '', coverage_start: '2025-10-16', coverage_end: '2026-10-15', monthly_premium: 360.0, coverage_amount: 400000, status: 'active', remarks: '意外险-员工 | 弈工分健康', created_at: '2025-10-16', updated_at: '2026-06-01',  },
  { id: 'real-9', employee_id: 'I050924593', employee_name: '施玉芹', employee_no: '', department_name: '上海开弈人力资源管理有限公司', insurance_type: '友邦意外险', insurance_provider: '友邦保险', policy_number: 'G09221638G', insured_name: '施玉芹', relation: '本人', relation_detail: '', coverage_start: '2025-10-16', coverage_end: '2026-10-15', monthly_premium: 360.0, coverage_amount: 400000, status: 'active', remarks: '意外险-员工 | 弈工分健康', created_at: '2025-10-16', updated_at: '2026-06-01',  },
  { id: 'real-10', employee_id: 'I051571629', employee_name: '张林梅', employee_no: '', department_name: '上海开弈人力资源管理有限公司', insurance_type: '友邦意外险', insurance_provider: '友邦保险', policy_number: 'G09221638G', insured_name: '张林梅', relation: '本人', relation_detail: '', coverage_start: '2026-01-04', coverage_end: '2026-10-15', monthly_premium: 281.1, coverage_amount: 400000, status: 'active', remarks: '意外险-员工 | 弈工分健康', created_at: '2025-10-16', updated_at: '2026-06-01',  },
  { id: 'real-11', employee_id: 'I051760013', employee_name: '韩雅凤', employee_no: '', department_name: '上海开弈人力资源管理有限公司', insurance_type: '友邦意外险', insurance_provider: '友邦保险', policy_number: 'G09221638G', insured_name: '韩雅凤', relation: '本人', relation_detail: '', coverage_start: '2025-10-16', coverage_end: '2026-10-15', monthly_premium: 360.0, coverage_amount: 400000, status: 'active', remarks: '意外险-员工 | 弈工分健康', created_at: '2025-10-16', updated_at: '2026-06-01',  }
];