"""
从友邦意外险Excel和团险协议PDF提取真实数据，生成Insurance模块的mock数据。
数据来源：
1. 友邦意外险电子合同 (G09221638G, 2025.10.16-2026.10.15, 219人)
2. 团险协议-开弈2026 (2026.04.01-2027.03.31, 月付)
3. 友邦意外险20260601.xlsx (人员清单)
"""
import openpyxl
import json
import re

def load_excel_data(filepath):
    """从Excel加载人员清单"""
    wb = openpyxl.load_workbook(filepath, data_only=True)
    ws = wb['人员清单']
    
    records = []
    headers = None
    for row in ws.iter_rows(values_only=True):
        # 找到表头行
        if row[0] and '分支机构' in str(row[0]):
            headers = row
            continue
        if headers is None:
            continue
        # 跳过空行和汇总行
        if not row[1] or str(row[1]).startswith('合计'):
            continue
        
        records.append({
            'branch': row[0],
            'insured_no': row[1],
            'employee_no': row[2] or '',
            'department': row[3] or '',
            'position': row[4] or '',
            'person_type': row[5],
            'status': row[6],
            'main_insured': row[7],
            'main_insured_id': row[8],
            'insured_name': row[9],
            'effective_date': row[10],
            'end_date': row[11],
            'id_type': row[12],
            'id_number': row[13],
            'nationality': row[14] or '',
            'gender': row[15],
            'birthday': row[16],
            'plan_code': row[17],
            'plan_desc': row[18],
            'has_social': row[19] or '',
            'workplace': row[20] or '',
            'salary': row[21] or '',
            'premium': row[22],
            'customer': row[25] or '',
            'service': row[26] or '',
        })
    
    return records


def get_branch_name(branch_str):
    """解析分支机构名称"""
    if not branch_str:
        return ''
    # 提取公司名
    if '人力资源管理' in str(branch_str):
        return '上海开弈人力资源管理有限公司'
    elif '企业服务外包' in str(branch_str):
        return '上海开弈企业服务外包有限公司'
    elif '人才服务' in str(branch_str):
        return '上海开弈人才服务（集团）有限公司'
    return str(branch_str)


def generate_ts_code(records):
    """生成TypeScript mock数据代码"""
    
    lines = []
    lines.append('// 自动生成的保险记录 mock 数据')
    lines.append('// 数据来源：友邦意外险电子合同 G09221638G + 团险协议-开弈2026')
    lines.append('// 保险期间：意外险 2025.10.16-2026.10.15 | 团险 2026.04.01-2027.03.31')
    lines.append('// 生成时间：2026-06-15')
    lines.append('// 仅包含指定11人：宋卫东、翟建设、徐培珍、于爱丽、孙建芳、殷德昌、高玉玲、丁成英、施玉芹、张林梅、韩雅凤')
    lines.append('')
    lines.append('export interface InsuranceRecord {')
    lines.append('  id: string;')
    lines.append('  employee_id: string;')
    lines.append('  employee_name: string;')
    lines.append('  employee_no: string;')
    lines.append('  department_name: string;')
    lines.append('  insurance_type: string;')
    lines.append('  insurance_provider: string;')
    lines.append('  policy_number: string;')
    lines.append('  insured_name: string;')
    lines.append('  relation: string;')
    lines.append('  relation_detail: string;')
    lines.append('  coverage_start: string;')
    lines.append('  coverage_end: string;')
    lines.append('  monthly_premium: number;')
    lines.append('  coverage_amount: number;')
    lines.append('  status: \'active\' | \'expired\' | \'pending\' | \'cancelled\';')
    lines.append('  remarks: string;')
    lines.append('  created_at: string;')
    lines.append('  updated_at: string;')
    lines.append('}')
    lines.append('')
    lines.append('export const REAL_INSURANCE_DATA: InsuranceRecord[] = [')
    
    total = len(records)
    idx = 0
    for r in records:
        idx += 1
        is_last = (idx == total)
        branch_name = get_branch_name(r['branch'])
        insured_name = str(r['insured_name']).strip()
        main_insured = str(r['main_insured']).strip()
        premium = float(r['premium']) if r['premium'] else 0
        
        # 判断relation：如果被保人姓名与主被保人不同则为家属
        relation = '本人' if insured_name == main_insured else '家属'
        
        # 保险类型：根据实际保险产品分类
        # 意外险电子合同：友邦2022团体意外伤害保险 + 友邦意外医药补偿2022团体医疗保险 + 附加意外住院给付B款
        insurance_type = '友邦意外险'
        
        # 保额：意外伤害 400,000
        coverage_amount = 400000
        
        # 状态：根据保障期间判断
        status = 'active'  # 都在保障期内
        
        # 转义字符串中的特殊字符
        def escape_str(s):
            if s is None:
                return ''
            s = str(s).replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ')
            return s
        
        line = f"  {{"
        line += f" id: 'real-{idx}',"
        line += f" employee_id: '{escape_str(r['insured_no'])}',"
        line += f" employee_name: '{escape_str(main_insured)}',"
        line += f" employee_no: '{escape_str(r['employee_no'])}',"
        line += f" department_name: '{escape_str(branch_name)}',"
        line += f" insurance_type: '{insurance_type}',"
        line += f" insurance_provider: '友邦保险',"
        line += f" policy_number: 'G09221638G',"
        line += f" insured_name: '{escape_str(insured_name)}',"
        line += f" relation: '{relation}',"
        line += f" relation_detail: '',"
        line += f" coverage_start: '{escape_str(r['effective_date'])}',"
        line += f" coverage_end: '{escape_str(r['end_date'])}',"
        line += f" monthly_premium: {premium},"
        line += f" coverage_amount: {coverage_amount},"
        line += f" status: '{status}',"
        plan_desc = escape_str(r.get('plan_desc') or '员工')
        customer = escape_str(r.get('customer') or '')
        line += f" remarks: '意外险-{plan_desc} | {customer}',"
        line += f" created_at: '2025-10-16',"
        line += f" updated_at: '2026-06-01',"
        line += f"  }}"
        if not is_last:
            line += ","
        lines.append(line)
    
    lines.append('];')
    return '\n'.join(lines)


def main():
    excel_path = 'D:/xwechat_files/wxid_kqriaocrvw7b22_b5e3/msg/file/2026-06/友邦意外险20260601.xlsx'
    
    print("Loading Excel data...")
    all_records = load_excel_data(excel_path)
    print(f"Loaded {len(all_records)} records")
    
    # 只保留指定的11人
    target_names = {'宋卫东','翟建设','徐培珍','于爱丽','孙建芳','殷德昌','高玉玲','丁成英','施玉芹','张林梅','韩雅凤'}
    records = [r for r in all_records if str(r['insured_name']).strip() in target_names]
    print(f"Filtered to {len(records)} records (target: 11 persons)")
    
    # 按分支机构统计
    branches = {}
    for r in records:
        bn = get_branch_name(r['branch'])
        if bn not in branches:
            branches[bn] = 0
        branches[bn] += 1
    
    print("\n按分支机构统计:")
    for bn, cnt in branches.items():
        print(f"  {bn}: {cnt}人")
    
    # 按客户统计
    customers = {}
    for r in records:
        c = str(r['customer']).strip() if r['customer'] else '未知'
        if c not in customers:
            customers[c] = 0
        customers[c] += 1
    
    print("\n按客户统计:")
    for c, cnt in sorted(customers.items(), key=lambda x: -x[1]):
        print(f"  {c}: {cnt}人")
    
    # 保费汇总
    total_premium = sum(float(r['premium']) for r in records if r['premium'])
    print(f"\n总年保费: ¥{total_premium:,.2f}")
    print(f"总人数: {len(records)}人")
    
    # 生成TS代码
    print("\nGenerating TypeScript code...")
    ts_code = generate_ts_code(records)
    
    output_path = 'D:/workbuddy存储/2026-06-11-14-59-50/hro-system/src/pages/Insurance/realData.ts'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(ts_code)
    
    print(f"Generated {len(records)} records -> {output_path}")
    print("Done!")


if __name__ == '__main__':
    main()
