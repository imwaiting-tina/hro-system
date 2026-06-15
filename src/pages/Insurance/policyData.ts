// 保单数据 - 来自实际保险合同
// 数据来源：
// 1. 团险协议-开弈2026（含金额）.pdf - 友邦团体综合险
// 2. 意外险电子合同.pdf - 友邦意外险 G09221638G
// 生成时间：2026-06-15

export interface PolicyInfo {
  id: string;
  policy_number: string;        // 保单号
  policy_name: string;          // 保单名称
  insurance_provider: string;   // 保险公司
  insurance_type: string;       // 保险类型
  contract_period: string;      // 合同期间
  payment_method: string;       // 缴费方式
  total_insured: number;        // 总被保人数
  annual_premium: number;       // 年保费
  coverage_summary: string;     // 保障概要
  plans: PolicyPlan[];          // 保障计划明细
  special_terms: string[];      // 特别约定
  insured_employees: string[];  // 关联的在保员工姓名列表（用于普通员工权限判断）
  insured_branches: string[];   // 关联的分支机构
}

export interface PolicyPlan {
  plan_name: string;            // 计划名称
  department?: string;          // 适用部门
  monthly_premium: number;      // 月保费
  coverage_items: CoverageItem[]; // 保障项目
}

export interface CoverageItem {
  item_name: string;            // 保障项目名称
  coverage_amount: string;      // 保额/保障内容
}

// ============================================================
// 保单1：友邦意外险 G09221638G
// ============================================================
export const POLICY_ACCIDENT: PolicyInfo = {
  id: 'policy-accident',
  policy_number: 'G09221638G',
  policy_name: '友邦团体意外伤害保险',
  insurance_provider: '友邦保险',
  insurance_type: '友邦意外险',
  contract_period: '2025-10-16 至 2026-10-15',
  payment_method: '年缴',
  total_insured: 219,
  annual_premium: 78840,
  coverage_summary: '友邦2022团体意外伤害保险 + 友邦意外医药补偿2022团体医疗保险 + 附加意外住院给付B款',
  plans: [
    {
      plan_name: '员工计划',
      monthly_premium: 30,
      coverage_items: [
        { item_name: '意外身故保险金', coverage_amount: '300,000元/人' },
        { item_name: '意外伤残保险金', coverage_amount: '按伤残等级比例赔付，最高300,000元/人' },
        { item_name: '意外医疗保险金', coverage_amount: '30,000元/次/人' },
        { item_name: '意外住院津贴', coverage_amount: '50元/天/人（每次最高90天）' },
      ],
    },
  ],
  special_terms: [
    '被保险人职业类别限1-3类（机关内勤）',
    '保险期间内可进行人员替换（增员/减员）',
    '意外医疗免赔额0元，赔付比例100%',
    '住院津贴每次事故免赔3天',
  ],
  insured_employees: [
    '宋卫东', '翟建设', '徐培珍', '于爱丽', '孙建芳',
    '殷德昌', '高玉玲', '丁成英', '施玉芹', '张林梅', '韩雅凤',
  ],
  insured_branches: ['上海开弈人力资源管理有限公司'],
};

// ============================================================
// 保单2：友邦团体综合险 - 团险协议 开弈2026
// ============================================================
export const POLICY_GROUP: PolicyInfo = {
  id: 'policy-group',
  policy_number: '团险协议-开弈2026',
  policy_name: '友邦团体综合保险',
  insurance_provider: '友邦保险',
  insurance_type: '友邦团体综合险',
  contract_period: '2026-04-01 至 2027-03-31',
  payment_method: '月付',
  total_insured: 84,
  annual_premium: 169548,
  coverage_summary: '涵盖定期寿险、重大疾病、意外伤害、意外医疗、住院津贴、门诊医疗等综合保障',
  plans: [
    {
      plan_name: '计划一：员工计划（有社保）',
      department: 'A部门',
      monthly_premium: 172.45,
      coverage_items: [
        { item_name: '定期寿险', coverage_amount: '100,000元/人' },
        { item_name: '重大疾病保险', coverage_amount: '100,000元/人' },
        { item_name: '意外伤害保险', coverage_amount: '100,000元/人' },
        { item_name: '意外医疗保险', coverage_amount: '10,000元/次/人' },
        { item_name: '住院津贴', coverage_amount: '50元/天/人' },
        { item_name: '门诊医疗保险', coverage_amount: '2,000元/年/人' },
      ],
    },
    {
      plan_name: '计划二：员工计划（无社保）',
      department: 'A部门',
      monthly_premium: 187.85,
      coverage_items: [
        { item_name: '定期寿险', coverage_amount: '100,000元/人' },
        { item_name: '重大疾病保险', coverage_amount: '100,000元/人' },
        { item_name: '意外伤害保险', coverage_amount: '100,000元/人' },
        { item_name: '意外医疗保险', coverage_amount: '10,000元/次/人' },
        { item_name: '住院津贴', coverage_amount: '50元/天/人' },
        { item_name: '门诊医疗保险', coverage_amount: '5,000元/年/人' },
      ],
    },
    {
      plan_name: '计划三：高管计划（有社保）',
      department: 'A部门',
      monthly_premium: 257.16,
      coverage_items: [
        { item_name: '定期寿险', coverage_amount: '200,000元/人' },
        { item_name: '重大疾病保险', coverage_amount: '200,000元/人' },
        { item_name: '意外伤害保险', coverage_amount: '200,000元/人' },
        { item_name: '意外医疗保险', coverage_amount: '20,000元/次/人' },
        { item_name: '住院津贴', coverage_amount: '100元/天/人' },
        { item_name: '门诊医疗保险', coverage_amount: '5,000元/年/人' },
      ],
    },
    {
      plan_name: '计划四：高管计划（无社保）',
      department: 'A部门',
      monthly_premium: 276.28,
      coverage_items: [
        { item_name: '定期寿险', coverage_amount: '200,000元/人' },
        { item_name: '重大疾病保险', coverage_amount: '200,000元/人' },
        { item_name: '意外伤害保险', coverage_amount: '200,000元/人' },
        { item_name: '意外医疗保险', coverage_amount: '20,000元/次/人' },
        { item_name: '住院津贴', coverage_amount: '100元/天/人' },
        { item_name: '门诊医疗保险', coverage_amount: '10,000元/年/人' },
      ],
    },
    {
      plan_name: '计划五：员工计划（有社保）',
      department: 'B部门',
      monthly_premium: 172.45,
      coverage_items: [
        { item_name: '定期寿险', coverage_amount: '100,000元/人' },
        { item_name: '重大疾病保险', coverage_amount: '100,000元/人' },
        { item_name: '意外伤害保险', coverage_amount: '100,000元/人' },
        { item_name: '意外医疗保险', coverage_amount: '10,000元/次/人' },
        { item_name: '住院津贴', coverage_amount: '50元/天/人' },
        { item_name: '门诊医疗保险', coverage_amount: '2,000元/年/人' },
      ],
    },
    {
      plan_name: '计划六：员工计划（无社保）',
      department: 'B部门',
      monthly_premium: 187.85,
      coverage_items: [
        { item_name: '定期寿险', coverage_amount: '100,000元/人' },
        { item_name: '重大疾病保险', coverage_amount: '100,000元/人' },
        { item_name: '意外伤害保险', coverage_amount: '100,000元/人' },
        { item_name: '意外医疗保险', coverage_amount: '10,000元/次/人' },
        { item_name: '住院津贴', coverage_amount: '50元/天/人' },
        { item_name: '门诊医疗保险', coverage_amount: '5,000元/年/人' },
      ],
    },
    {
      plan_name: '计划七：高管计划（有社保）',
      department: 'B部门',
      monthly_premium: 257.16,
      coverage_items: [
        { item_name: '定期寿险', coverage_amount: '200,000元/人' },
        { item_name: '重大疾病保险', coverage_amount: '200,000元/人' },
        { item_name: '意外伤害保险', coverage_amount: '200,000元/人' },
        { item_name: '意外医疗保险', coverage_amount: '20,000元/次/人' },
        { item_name: '住院津贴', coverage_amount: '100元/天/人' },
        { item_name: '门诊医疗保险', coverage_amount: '5,000元/年/人' },
      ],
    },
    {
      plan_name: '计划八：高管计划（无社保）',
      department: 'B部门',
      monthly_premium: 276.28,
      coverage_items: [
        { item_name: '定期寿险', coverage_amount: '200,000元/人' },
        { item_name: '重大疾病保险', coverage_amount: '200,000元/人' },
        { item_name: '意外伤害保险', coverage_amount: '200,000元/人' },
        { item_name: '意外医疗保险', coverage_amount: '20,000元/次/人' },
        { item_name: '住院津贴', coverage_amount: '100元/天/人' },
        { item_name: '门诊医疗保险', coverage_amount: '10,000元/年/人' },
      ],
    },
    {
      plan_name: '子女计划',
      monthly_premium: 111.60,
      coverage_items: [
        { item_name: '定期寿险', coverage_amount: '50,000元/人' },
        { item_name: '重大疾病保险', coverage_amount: '50,000元/人' },
        { item_name: '意外伤害保险', coverage_amount: '50,000元/人' },
        { item_name: '意外医疗保险', coverage_amount: '5,000元/次/人' },
        { item_name: '住院津贴', coverage_amount: '50元/天/人' },
        { item_name: '门诊医疗保险', coverage_amount: '1,000元/年/人' },
      ],
    },
    {
      plan_name: '意外保障计划',
      monthly_premium: 31.18,
      coverage_items: [
        { item_name: '意外身故保险金', coverage_amount: '300,000元/人' },
        { item_name: '意外伤残保险金', coverage_amount: '按伤残等级比例赔付，最高300,000元/人' },
        { item_name: '意外医疗保险金', coverage_amount: '30,000元/次/人' },
        { item_name: '意外住院津贴', coverage_amount: '50元/天/人' },
      ],
    },
  ],
  special_terms: [
    '李本一：不承保重大疾病保险',
    '朱琼：不承保定期寿险和重大疾病保险',
    '孔瑾瑾：不承保定期寿险和重大疾病保险',
    '被保险人职业类别限1-3类',
    '门诊医疗：有社保版本赔付比例90%，无社保版本赔付比例80%',
    '住院医疗：社保目录内赔付比例100%，社保目录外赔付比例60%',
  ],
  insured_employees: [
    '宋卫东', '翟建设', '徐培珍', '于爱丽', '孙建芳',
    '殷德昌', '高玉玲', '丁成英', '施玉芹', '张林梅', '韩雅凤',
  ],
  insured_branches: ['上海开弈人力资源管理有限公司'],
};

// 所有保单列表
export const ALL_POLICIES: PolicyInfo[] = [POLICY_ACCIDENT, POLICY_GROUP];
