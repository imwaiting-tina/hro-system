"""
在职管理模拟数据填充脚本 v1
覆盖：
- employees: 所有employee_type (full_time/intern/retired_rehire/security) + 所有status
- probation_evaluations: 所有EvaluationStatus
- contract_renewals: 所有RenewalStatus
- employee_transfers: 所有transfer_type
- resignations: 所有ResignationStatus
"""
import requests
import uuid
from datetime import datetime, timedelta, timezone

URL = 'https://wzmobwfoalgtppglbpcg.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bW9id2ZvYWxndHBwZ2xicGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjAzMTQsImV4cCI6MjA5NjczNjMxNH0.UQtUrdDfCNyAfd2srVgRzg9GGpjP-vY2l6kceWMY_HA'
HEADERS = {'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json', 'Prefer': 'return=representation'}

TINA = '98f14fd7-70e7-44f3-a8b0-d85a8272c575'
JENNY = '25530087-7cc2-4d40-a11c-c7380b2e784f'
SHAUN = 'dce797a6-2bff-4868-b3a6-4d9e10adb0dc'
BELLA = 'f12f7fd9-f72d-4260-a1b2-455a323a927d'

now = datetime.now(timezone.utc)
def iso(d=0): return (now + timedelta(days=d)).isoformat()
def date_str(d=0): return (now + timedelta(days=d)).strftime('%Y-%m-%d')

def post(table, data):
    r = requests.post(f'{URL}/rest/v1/{table}', headers=HEADERS, json=data)
    if r.status_code == 201:
        result = r.json()
        return result[0] if isinstance(result, list) else result
    else:
        print(f"  ERROR {table}: {r.status_code} {r.text[:300]}")
        return None

# ============================================================
# 1. 清空旧数据
# ============================================================
print("=" * 60)
print("清空在职管理旧数据...")
h_del = {**HEADERS, 'Prefer': 'return=minimal'}
for t in ['probation_evaluations', 'contract_renewals', 'employee_transfers', 'resignations', 'employees']:
    r = requests.delete(f'{URL}/rest/v1/{t}?id=not.is.null', headers=h_del)
    print(f"  {t}: {r.status_code}")
print("已清空\n")

# ============================================================
# 2. 员工档案（15条，覆盖所有类型和状态）
# ============================================================
print("=" * 60)
print("创建员工档案（15条，所有类型+所有状态）...")

employees = [
    # --- full_time 全日制 ---
    {"id": str(uuid.uuid4()), "employee_no": "KY2024-001", "chinese_name": "黄一萧",
     "english_name": "Tina Huang", "gender": "女", "id_card": "310107199001011234",
     "phone": "13800001111", "email": "tina_huang@china-key.com",
     "birthday": "1990-01-01", "highest_education": "硕士", "graduate_school": "复旦大学",
     "major": "人力资源管理", "employee_type": "full_time", "department_id": None,
     "position_name": "HR总监", "grade": "M3", "onboard_date": "2020-03-15",
     "contract_start": "2024-03-15", "contract_end": "2027-03-14", "probation_end": "2020-09-14",
     "monthly_salary": 35000, "bank_account": "6222021001001234567", "bank_name": "工商银行",
     "status": "active", "report_to": JENNY, "social_insurance": True, "commercial_insurance": True,
     "emergency_contact_name": "黄先生", "emergency_contact_phone": "13800001112"},

    {"id": str(uuid.uuid4()), "employee_no": "KY2024-002", "chinese_name": "王妤扬",
     "english_name": "Shaun Wang", "gender": "男", "id_card": "310107198805052345",
     "phone": "13800002222", "email": "wang_shayang@china-key.com",
     "birthday": "1988-05-05", "highest_education": "本科", "graduate_school": "华东师范大学",
     "major": "计算机科学与技术", "employee_type": "full_time", "department_id": None,
     "position_name": "技术总监", "grade": "M2", "onboard_date": "2021-06-01",
     "contract_start": "2024-06-01", "contract_end": "2027-05-31", "probation_end": "2021-11-30",
     "monthly_salary": 30000, "bank_account": "6222021001002345678", "bank_name": "建设银行",
     "status": "active", "report_to": JENNY, "social_insurance": True, "commercial_insurance": False,
     "emergency_contact_name": "王太太", "emergency_contact_phone": "13800002223"},

    {"id": str(uuid.uuid4()), "employee_no": "KY2025-001", "chinese_name": "张明辉",
     "english_name": "Mark Zhang", "gender": "男", "id_card": "310107199508083456",
     "phone": "13800003333", "email": "zhang_minghui@china-key.com",
     "birthday": "1995-08-08", "highest_education": "本科", "graduate_school": "同济大学",
     "major": "软件工程", "employee_type": "full_time", "department_id": None,
     "position_name": "Java开发工程师", "grade": "P2", "onboard_date": date_str(-20),
     "contract_start": date_str(-20), "contract_end": "2028-05-31", "probation_end": date_str(70),
     "monthly_salary": 14000, "bank_account": "6222021001003456789", "bank_name": "招商银行",
     "status": "probation", "report_to": SHAUN, "social_insurance": True, "commercial_insurance": False,
     "emergency_contact_name": "张女士", "emergency_contact_phone": "13800003334"},

    {"id": str(uuid.uuid4()), "employee_no": "KY2025-002", "chinese_name": "李晓燕",
     "english_name": "Cindy Li", "gender": "女", "id_card": "310107199710104567",
     "phone": "13800004444", "email": "li_xiaoyan@china-key.com",
     "birthday": "1997-10-10", "highest_education": "硕士", "graduate_school": "上海交通大学",
     "major": "财务管理", "employee_type": "full_time", "department_id": None,
     "position_name": "财务专员", "grade": "P2", "onboard_date": date_str(-10),
     "contract_start": date_str(-10), "contract_end": "2028-06-30", "probation_end": date_str(80),
     "monthly_salary": 12000, "bank_account": "6222021001004567890", "bank_name": "中国银行",
     "status": "probation", "report_to": TINA, "social_insurance": True, "commercial_insurance": False,
     "emergency_contact_name": "李先生", "emergency_contact_phone": "13800004445"},

    {"id": str(uuid.uuid4()), "employee_no": "KY2023-001", "chinese_name": "陈建国",
     "english_name": "Jack Chen", "gender": "男", "id_card": "310107198002022345",
     "phone": "13800005555", "email": "chen_jianguo@china-key.com",
     "birthday": "1980-02-02", "highest_education": "本科", "graduate_school": "华东理工大学",
     "major": "工商管理", "employee_type": "full_time", "department_id": None,
     "position_name": "行政经理", "grade": "M1", "onboard_date": "2023-01-10",
     "contract_start": "2023-01-10", "contract_end": "2026-01-09", "probation_end": "2023-07-09",
     "monthly_salary": 20000, "bank_account": "6222021001005678901", "bank_name": "农业银行",
     "status": "active", "report_to": TINA, "social_insurance": True, "commercial_insurance": True,
     "emergency_contact_name": "陈太太", "emergency_contact_phone": "13800005556"},

    # --- intern 实习生 ---
    {"id": str(uuid.uuid4()), "employee_no": "KY2026-INT001", "chinese_name": "刘思雨",
     "english_name": "", "gender": "女", "id_card": "310107200209095678",
     "phone": "13800006666", "email": "liusiyu@fudan.edu.cn",
     "birthday": "2002-09-09", "highest_education": "本科在读", "graduate_school": "复旦大学",
     "major": "行政管理", "employee_type": "intern", "department_id": None,
     "position_name": "HR实习生", "grade": "实习", "onboard_date": date_str(-5),
     "probation_end": None,
     "monthly_salary": 4000, "bank_account": "6222021001006789012", "bank_name": "浦发银行",
     "status": "internship", "report_to": TINA, "social_insurance": False, "commercial_insurance": False,
     "emergency_contact_name": "刘父", "emergency_contact_phone": "13800006667"},

    {"id": str(uuid.uuid4()), "employee_no": "KY2026-INT002", "chinese_name": "赵宇航",
     "english_name": "", "gender": "男", "id_card": "310107200307076789",
     "phone": "13800007777", "email": "zhaoyuhang@shnu.edu.cn",
     "birthday": "2003-07-07", "highest_education": "本科在读", "graduate_school": "上海师范大学",
     "major": "计算机科学与技术", "employee_type": "intern", "department_id": None,
     "position_name": "前端开发实习生", "grade": "实习", "onboard_date": date_str(-15),
     "probation_end": None,
     "monthly_salary": 3500, "bank_account": "6222021001007890123", "bank_name": "交通银行",
     "status": "internship", "report_to": SHAUN, "social_insurance": False, "commercial_insurance": False,
     "emergency_contact_name": "赵母", "emergency_contact_phone": "13800007778"},

    # --- retired_rehire 退休返聘 ---
    {"id": str(uuid.uuid4()), "employee_no": "KY2024-RET001", "chinese_name": "周国平",
     "english_name": "David Zhou", "gender": "男", "id_card": "310107196505054321",
     "phone": "13800008888", "email": "zhou_guoping@china-key.com",
     "birthday": "1965-05-05", "highest_education": "本科", "graduate_school": "华东师范大学",
     "major": "数学教育", "employee_type": "retired_rehire", "department_id": None,
     "position_name": "高级顾问", "grade": "M2", "onboard_date": "2024-09-01",
     "contract_start": "2024-09-01", "contract_end": "2027-08-31",
     "monthly_salary": 25000, "bank_account": "6222021001008901234", "bank_name": "工商银行",
     "status": "active", "report_to": JENNY, "social_insurance": False, "commercial_insurance": True,
     "emergency_contact_name": "周女士", "emergency_contact_phone": "13800008889"},

    # --- security 保安 ---
    {"id": str(uuid.uuid4()), "employee_no": "KY2023-SEC001", "chinese_name": "王大勇",
     "english_name": "", "gender": "男", "id_card": "310107197809091234",
     "phone": "13800009999", "email": "", "birthday": "1978-09-09",
     "highest_education": "高中", "graduate_school": "", "major": "",
     "employee_type": "security", "department_id": None,
     "position_name": "保安队长", "grade": "P1", "onboard_date": "2023-04-01",
     "contract_start": "2023-04-01", "contract_end": "2026-03-31",
     "monthly_salary": 6000, "bank_account": "6222021001009012345", "bank_name": "农村商业银行",
     "status": "active", "report_to": TINA, "social_insurance": True, "commercial_insurance": False,
     "emergency_contact_name": "王太太", "emergency_contact_phone": "13800009998"},

    {"id": str(uuid.uuid4()), "employee_no": "KY2024-SEC002", "chinese_name": "李保安",
     "english_name": "", "gender": "男", "id_card": "310107198512121234",
     "phone": "13800010000", "email": "", "birthday": "1985-12-12",
     "highest_education": "初中", "graduate_school": "", "major": "",
     "employee_type": "security", "department_id": None,
     "position_name": "保安", "grade": "P1", "onboard_date": "2024-01-15",
     "contract_start": "2024-01-15", "contract_end": "2027-01-14",
     "monthly_salary": 5000, "bank_account": "6222021001000123456", "bank_name": "农村商业银行",
     "status": "active", "report_to": None, "social_insurance": True, "commercial_insurance": False,
     "emergency_contact_name": "", "emergency_contact_phone": ""},

    # --- resigned 已离职 ---
    {"id": str(uuid.uuid4()), "employee_no": "KY2022-001", "chinese_name": "吴晓东",
     "english_name": "Wu Xiao", "gender": "男", "id_card": "310107199209092345",
     "phone": "13800011111", "email": "wu_xiaodong@china-key.com",
     "birthday": "1992-09-09", "highest_education": "本科", "graduate_school": "上海大学",
     "major": "市场营销", "employee_type": "full_time", "department_id": None,
     "position_name": "市场专员", "grade": "P1", "onboard_date": "2022-05-01",
     "contract_start": "2022-05-01", "contract_end": "2025-04-30",
     "monthly_salary": 9000, "status": "resigned", "report_to": TINA,
     "social_insurance": True, "commercial_insurance": False,
     "emergency_contact_name": "", "emergency_contact_phone": ""},

    # --- 合同即将到期（用于续签功能演示）---
    {"id": str(uuid.uuid4()), "employee_no": "KY2023-002", "chinese_name": "孙丽华",
     "english_name": "Sunny Sun", "gender": "女", "id_card": "310107199303033456",
     "phone": "13800012222", "email": "sun_lihua@china-key.com",
     "birthday": "1993-03-03", "highest_education": "本科", "graduate_school": "南京大学",
     "major": "汉语言文学", "employee_type": "full_time", "department_id": None,
     "position_name": "行政专员", "grade": "P2", "onboard_date": "2023-08-01",
     "contract_start": "2023-08-01", "contract_end": date_str(15),  # 即将到期
     "probation_end": "2024-01-31",
     "monthly_salary": 10000, "bank_account": "6222021001001234567", "bank_name": "工商银行",
     "status": "active", "report_to": TINA, "social_insurance": True, "commercial_insurance": False,
     "emergency_contact_name": "孙先生", "emergency_contact_phone": "13800012223"},

    # --- 即将完成试用期 ---
    {"id": str(uuid.uuid4()), "employee_no": "KY2025-003", "chinese_name": "黄海涛",
     "english_name": "Sea Huang", "gender": "男", "id_card": "310107199611114567",
     "phone": "13800013333", "email": "huang_haitao@china-key.com",
     "birthday": "1996-11-11", "highest_education": "硕士", "graduate_school": "浙江大学",
     "major": "计算机科学与技术", "employee_type": "full_time", "department_id": None,
     "position_name": "Python开发工程师", "grade": "P2", "onboard_date": date_str(-50),
     "contract_start": date_str(-50), "contract_end": "2028-12-31", "probation_end": date_str(10),
     "monthly_salary": 15000, "bank_account": "6222021001002345678", "bank_name": "招商银行",
     "status": "probation", "report_to": SHAUN, "social_insurance": True, "commercial_insurance": False,
     "emergency_contact_name": "黄父", "emergency_contact_phone": "13800013334"},

    # --- 新员工（刚入职，评估待启动）---
    {"id": str(uuid.uuid4()), "employee_no": "KY2026-001", "chinese_name": "林小凤",
     "english_name": "Phoenix Lin", "gender": "女", "id_card": "310107199812124567",
     "phone": "13800014444", "email": "lin_xiaofeng@china-key.com",
     "birthday": "1998-12-12", "highest_education": "本科", "graduate_school": "上海财经大学",
     "major": "会计学", "employee_type": "full_time", "department_id": None,
     "position_name": "财务助理", "grade": "P1", "onboard_date": date_str(-3),
     "contract_start": date_str(-3), "contract_end": "2028-06-30",
     "monthly_salary": 8000, "bank_account": "6222021001003456789", "bank_name": "中国银行",
     "status": "probation", "report_to": TINA, "social_insurance": True, "commercial_insurance": False,
     "emergency_contact_name": "林母", "emergency_contact_phone": "13800014445"},
]

emp_ids: dict = {}
for emp in employees:
    r = post('employees', emp)
    if r:
        emp_ids[emp['chinese_name']] = r['id']
        print(f"  [{emp['employee_type']}] {emp['chinese_name']} ({emp['status']}) - OK")
    else:
        emp_ids[emp['chinese_name']] = emp['id']

# ============================================================
# 3. 试用期/实习评估（覆盖所有EvaluationStatus）
# ============================================================
print("\n" + "=" * 60)
print("创建评估记录（覆盖所有状态）...")

evaluations = [
    # pending_employee - 待员工自评
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("林小凤"), "evaluation_type": "probation",
     "status": "pending_employee", "created_at": iso(-2)},

    # pending_dept - 待部门主管评估
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("黄海涛"), "evaluation_type": "probation",
     "employee_self_review": "入职2个月以来，参与了HRO系统V2.1迭代开发，主要负责任职模块前后端开发。熟悉了Spring Boot和React技术栈，能够独立完成模块开发任务。与团队沟通顺畅，学习能力强。",
     "employee_signed": True, "employee_signed_at": iso(-5),
     "status": "pending_dept", "created_at": iso(-20)},

    # pending_bu - 待BU负责人审批
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("张明辉"), "evaluation_type": "probation",
     "employee_self_review": "试用期期间完成了员工档案管理模块的开发，参与了HRO系统V2.1的迭代。技术能力达标，工作态度认真。",
     "employee_signed": True, "employee_signed_at": iso(-15),
     "dept_supervisor_score": {"technical": 85, "communication": 90, "execution": 88, "learning": 92},
     "dept_supervisor_comment": "张明辉在试用期间表现优秀，技术基础扎实，能够独立完成任务。建议转正后定岗Java开发工程师，定薪14000。",
     "dept_supervisor_id": SHAUN,
     "confirmed_position": "Java开发工程师", "confirmed_salary": 14000,
     "status": "pending_bu", "created_at": iso(-30)},

    # pending_hr - 待HR审批
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("李晓燕"), "evaluation_type": "probation",
     "employee_self_review": "入职以来主要负责财务日常账务处理，工作认真细致，与各部门沟通顺畅。",
     "employee_signed": True, "employee_signed_at": iso(-12),
     "dept_supervisor_score": {"professional": 88, "communication": 85, "execution": 90, "learning": 87},
     "dept_supervisor_comment": "李晓燕工作态度端正，财务专业知识扎实，建议转正。",
     "dept_supervisor_id": TINA,
     "confirmed_position": "财务专员", "confirmed_salary": 12000,
     "bu_head_opinion": "同意部门意见，建议转正。",
     "bu_head_id": SHAUN, "bu_head_signed": True, "bu_head_signed_at": iso(-6),
     "status": "pending_hr", "created_at": iso(-25)},

    # pending_final - 待终审
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("赵宇航"), "evaluation_type": "internship",
     "employee_self_review": "实习期间参与了HRO系统前端页面开发，主要使用React和TypeScript。完成了入职引导页面的重构，学到了很多。",
     "employee_signed": True, "employee_signed_at": iso(-8),
     "dept_supervisor_score": {"technical": 82, "communication": 88, "execution": 85, "potential": 90},
     "dept_supervisor_comment": "赵宇航实习期间表现积极，前端技术能力有提升空间但学习态度很好。建议实习转正。",
     "dept_supervisor_id": SHAUN,
     "bu_head_opinion": "实习生表现良好，建议录用为正式员工。",
     "bu_head_id": SHAUN, "bu_head_signed": True, "bu_head_signed_at": iso(-3),
     "hr_opinion": "实习生评估通过，建议终面后发放Offer。",
     "hr_head_id": TINA, "hr_signed": True, "hr_signed_at": iso(-2),
     "status": "pending_final", "created_at": iso(-20)},

    # completed - 已完成
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("刘思雨"), "evaluation_type": "internship",
     "employee_self_review": "实习期间协助HR部门完成了招聘数据整理和员工档案归档，参与了3场面试安排，收获很大。",
     "employee_signed": True, "employee_signed_at": iso(-40),
     "dept_supervisor_score": {"attitude": 95, "execution": 90, "communication": 92, "potential": 88},
     "dept_supervisor_comment": "刘思雨实习期间工作认真，人力资源专业知识扎实，建议转正。",
     "dept_supervisor_id": TINA,
     "bu_head_opinion": "同意。",
     "bu_head_id": SHAUN, "bu_head_signed": True, "bu_head_signed_at": iso(-30),
     "hr_opinion": "实习生评估优秀，建议录用。",
     "hr_head_id": TINA, "hr_signed": True, "hr_signed_at": iso(-28),
     "final_opinion": "同意录用，请HR跟进签约事宜。",
     "final_approver_id": JENNY, "final_signed": True, "final_signed_at": iso(-25),
     "confirmed_position": "HR助理", "confirmed_salary": 4500,
     "status": "completed", "created_at": iso(-50)},

    # rejected - 已退回
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("吴晓东"), "evaluation_type": "probation",
     "employee_self_review": "试用期期间参与了部分项目，但感觉与岗位匹配度不高。",
     "employee_signed": True, "employee_signed_at": iso(-60),
     "dept_supervisor_comment": "该员工在试用期间表现未达预期，技术能力不足以胜任岗位要求。建议不予转正。",
     "dept_supervisor_id": SHAUN,
     "status": "rejected", "created_at": iso(-70)},
]

for ev in evaluations:
    r = post('probation_evaluations', ev)
    emp_name = ""
    for name, eid in emp_ids.items():
        if eid == ev['employee_id']:
            emp_name = name
            break
    print(f"  [{ev['status']}] {emp_name} ({ev['evaluation_type']}) - {'OK' if r else 'FAIL'}")

# ============================================================
# 4. 续签管理（覆盖所有RenewalStatus）
# ============================================================
print("\n" + "=" * 60)
print("创建续签记录（覆盖所有状态）...")

renewals = [
    # pending_employee - 待员工确认
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("孙丽华"), "renewal_type": "labor_contract",
     "original_contract_start": "2023-08-01", "original_contract_end": date_str(15),
     "new_contract_start": date_str(16), "new_contract_end": "2029-08-31",
     "new_salary": 10500, "new_grade": "P2",
     "status": "pending_employee", "created_at": iso(-5)},

    # pending_bu - 待BU审批
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("陈建国"), "renewal_type": "labor_contract",
     "original_contract_start": "2023-01-10", "original_contract_end": "2026-01-09",
     "new_contract_start": "2026-01-10", "new_contract_end": "2029-01-09",
     "new_salary": 22000, "new_grade": "M1",
     "employee_confirmed": True, "employee_signed_at": iso(-10),
     "status": "pending_bu", "created_at": iso(-15)},

    # pending_hr - 待HR审批
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("王大勇"), "renewal_type": "labor_contract",
     "original_contract_start": "2023-04-01", "original_contract_end": "2026-03-31",
     "new_contract_start": "2026-04-01", "new_contract_end": "2029-03-31",
     "new_salary": 6500, "new_grade": "P1",
     "employee_confirmed": True, "employee_signed_at": iso(-12),
     "bu_head_opinion": "保安队长工作尽职，建议续签。",
     "bu_head_id": SHAUN, "bu_head_signed": True, "bu_head_signed_at": iso(-8),
     "status": "pending_hr", "created_at": iso(-14)},

    # pending_final - 待终审
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("周国平"), "renewal_type": "service_agreement",
     "original_contract_start": "2024-09-01", "original_contract_end": "2027-08-31",
     "new_contract_start": "2027-09-01", "new_contract_end": "2030-08-31",
     "new_salary": 27000, "new_grade": "M2",
     "employee_confirmed": True, "employee_signed_at": iso(-20),
     "bu_head_opinion": "高级顾问工作出色，建议续签3年。",
     "bu_head_id": SHAUN, "bu_head_signed": True, "bu_head_signed_at": iso(-16),
     "hr_opinion": "退休返聘人员，协议续签无异议。",
     "hr_head_id": TINA, "hr_signed": True, "hr_signed_at": iso(-14),
     "status": "pending_final", "created_at": iso(-22)},

    # approved - 已批准（待完成用印）
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("黄一萧"), "renewal_type": "labor_contract",
     "original_contract_start": "2020-03-15", "original_contract_end": "2027-03-14",
     "new_contract_start": "2027-03-15", "new_contract_end": "2030-03-14",
     "new_salary": 38000, "new_grade": "M3",
     "employee_confirmed": True, "employee_signed_at": iso(-30),
     "bu_head_opinion": "HR总监工作出色，建议续签3年并调薪。",
     "bu_head_id": JENNY, "bu_head_signed": True, "bu_head_signed_at": iso(-25),
     "hr_opinion": "同意续签。",
     "hr_head_id": TINA, "hr_signed": True, "hr_signed_at": iso(-22),
     "final_opinion": "同意。",
     "final_approver_id": JENNY, "final_signed": True, "final_signed_at": iso(-20),
     "seal_approved": True, "seal_approved_at": iso(-18),
     "status": "approved", "created_at": iso(-35)},

    # completed - 已完成
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("王妤扬"), "renewal_type": "labor_contract",
     "original_contract_start": "2021-06-01", "original_contract_end": "2027-05-31",
     "new_contract_start": "2027-06-01", "new_contract_end": "2030-05-31",
     "new_salary": 32000, "new_grade": "M2",
     "employee_confirmed": True, "employee_signed_at": iso(-60),
     "bu_head_opinion": "技术总监工作出色，建议续签。",
     "bu_head_id": JENNY, "bu_head_signed": True, "bu_head_signed_at": iso(-55),
     "hr_opinion": "同意。",
     "hr_head_id": TINA, "hr_signed": True, "hr_signed_at": iso(-52),
     "final_opinion": "同意续签3年。",
     "final_approver_id": JENNY, "final_signed": True, "final_signed_at": iso(-50),
     "seal_approved": True, "seal_approved_at": iso(-48),
     "status": "completed", "created_at": iso(-70)},
]

for rn in renewals:
    r = post('contract_renewals', rn)
    emp_name = ""
    for name, eid in emp_ids.items():
        if eid == rn['employee_id']:
            emp_name = name
            break
    print(f"  [{rn['status']}] {emp_name} ({rn['renewal_type']}) - {'OK' if r else 'FAIL'}")

# ============================================================
# 5. 员工流动（覆盖所有transfer_type）
# ============================================================
print("\n" + "=" * 60)
print("创建员工流动记录...")

transfers = [
    # transfer - 调岗
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("李晓燕"), "transfer_type": "transfer",
     "from_department_id": None, "to_department_id": None,
     "from_position": "财务助理", "to_position": "财务专员",
     "from_salary": 8000, "to_salary": 12000,
     "effective_date": date_str(30), "reason": "工作能力突出，晋升为财务专员",
     "status": "pending", "created_at": iso(-2)},

    # promotion - 晋升
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("张明辉"), "transfer_type": "promotion",
     "from_position": "Java开发工程师", "to_position": "高级Java开发工程师",
     "from_grade": "P2", "to_grade": "P3",
     "from_salary": 14000, "to_salary": 17000,
     "effective_date": date_str(60), "reason": "技术能力突出，团队协作良好，予以晋升",
     "status": "pending", "created_at": iso(-1)},

    # salary_adjust - 调薪
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("孙丽华"), "transfer_type": "salary_adjust",
     "from_salary": 10000, "to_salary": 11000,
     "effective_date": date_str(10), "reason": "年度调薪，根据绩效评估结果调整",
     "status": "completed", "created_at": iso(-20)},

    # re_grade - 重新定级
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("赵宇航"), "transfer_type": "re_grade",
     "from_grade": "实习", "to_grade": "P1",
     "from_position": "前端开发实习生", "to_position": "前端开发工程师（初级）",
     "from_salary": 3500, "to_salary": 11000,
     "effective_date": date_str(20), "reason": "实习生转正，重新定级定薪",
     "status": "pending", "created_at": iso(-5)},

    # completed
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("吴晓东"), "transfer_type": "transfer",
     "from_position": "市场专员", "to_position": "市场高级专员",
     "from_salary": 9000, "to_salary": 11000,
     "effective_date": "2023-01-01", "reason": "已离职员工的流动记录（历史）",
     "status": "completed", "created_at": iso(-200)},
]

for tf in transfers:
    r = post('employee_transfers', tf)
    emp_name = ""
    for name, eid in emp_ids.items():
        if eid == tf['employee_id']:
            emp_name = name
            break
    print(f"  [{tf['transfer_type']}] {emp_name} - {'OK' if r else 'FAIL'}")

# ============================================================
# 6. 离职管理（覆盖所有ResignationStatus）
# ============================================================
print("\n" + "=" * 60)
print("创建离职记录（覆盖所有状态）...")

resignations = [
    # pending - 待处理
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("林小凤"),
     "resignation_type": "主动离职", "apply_date": date_str(0), "last_working_date": date_str(15),
     "reason": "个人原因，需回老家发展",
     "status": "pending", "created_at": iso(0)},

    # in_progress - 处理中
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("黄海涛"),
     "resignation_type": "协商解除", "apply_date": date_str(-5), "last_working_date": date_str(10),
     "reason": "因业务调整，与员工协商一致解除劳动合同",
     "dept_head_id": SHAUN, "dept_head_approved": True, "dept_head_approved_at": iso(-4),
     "hr_head_id": TINA, "hr_approved": True, "hr_approved_at": iso(-3),
     "status": "in_progress", "created_at": iso(-5)},

    # pending_handover - 待交接
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("张明辉"),
     "resignation_type": "主动离职", "apply_date": date_str(-10), "last_working_date": date_str(5),
     "reason": "获得更好职业发展机会",
     "dept_head_id": SHAUN, "dept_head_approved": True, "dept_head_approved_at": iso(-9),
     "hr_head_id": TINA, "hr_approved": True, "hr_approved_at": iso(-8),
     "final_approver_id": JENNY, "final_approved": True, "final_approved_at": iso(-7),
     "status": "pending_handover", "created_at": iso(-10)},

    # pending_clearance - 待结算
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("刘思雨"),
     "resignation_type": "实习结束", "apply_date": date_str(-15), "last_working_date": date_str(-2),
     "reason": "实习期结束，返校完成学业",
     "dept_head_id": TINA, "dept_head_approved": True, "dept_head_approved_at": iso(-14),
     "hr_head_id": TINA, "hr_approved": True, "hr_approved_at": iso(-13),
     "final_approver_id": JENNY, "final_approved": True, "final_approved_at": iso(-12),
     "status": "pending_clearance", "created_at": iso(-15)},

    # completed - 已完成
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("吴晓东"),
     "resignation_type": "主动离职", "apply_date": "2024-12-01", "last_working_date": "2024-12-31",
     "reason": "个人职业发展原因",
     "dept_head_id": TINA, "dept_head_approved": True, "dept_head_approved_at": "2024-12-02T00:00:00+00:00",
     "hr_head_id": TINA, "hr_approved": True, "hr_approved_at": "2024-12-03T00:00:00+00:00",
     "final_approver_id": JENNY, "final_approved": True, "final_approved_at": "2024-12-04T00:00:00+00:00",
     "status": "completed", "created_at": "2024-11-25T00:00:00+00:00"},

    # cancelled - 已取消
    {"id": str(uuid.uuid4()), "employee_id": emp_ids.get("李晓燕"),
     "resignation_type": "主动离职", "apply_date": date_str(-20), "last_working_date": date_str(-5),
     "reason": "员工已撤销离职申请",
     "status": "cancelled", "created_at": iso(-20)},
]

for res in resignations:
    r = post('resignations', res)
    emp_name = ""
    for name, eid in emp_ids.items():
        if eid == res['employee_id']:
            emp_name = name
            break
    print(f"  [{res['status']}] {emp_name} ({res['resignation_type']}) - {'OK' if r else 'FAIL'}")

# ============================================================
# 汇总
# ============================================================
print("\n" + "=" * 60)
print("在职管理模拟数据填充完成！")
print("=" * 60)
print(f"  员工档案:  {len(employees)}条")
print(f"    ├─ full_time:     {sum(1 for e in employees if e['employee_type']=='full_time')}条 (active/probation/resigned)")
print(f"    ├─ intern:        {sum(1 for e in employees if e['employee_type']=='intern')}条 (internship)")
print(f"    ├─ retired_rehire: {sum(1 for e in employees if e['employee_type']=='retired_rehire')}条 (active)")
print(f"    └─ security:      {sum(1 for e in employees if e['employee_type']=='security')}条 (active)")
print(f"  评估记录:  {len(evaluations)}条 (pending_employee/pending_dept/pending_bu/pending_hr/pending_final/completed/rejected)")
print(f"  续签记录:  {len(renewals)}条 (pending_employee/pending_bu/pending_hr/pending_final/approved/completed)")
print(f"  流动记录:  {len(transfers)}条 (transfer/promotion/salary_adjust/re_grade)")
print(f"  离职记录:  {len(resignations)}条 (pending/in_progress/pending_handover/pending_clearance/completed/cancelled)")
