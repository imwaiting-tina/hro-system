"""
HRO入职模块V2 - 测试虚拟数据生成
通过Supabase REST API插入测试数据
"""
import requests
import json
import uuid
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

BASE = "https://wzmobwfoalgtppglbpcg.supabase.co/rest/v1"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bW9id2ZvYWxndHBwZ2xicGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjAzMTQsImV4cCI6MjA5NjczNjMxNH0.UQtUrdDfCNyAfd2srVgRzg9GGpjP-vY2l6kceWMY_HA"

HEADERS = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def post(table, data):
    """插入单条记录"""
    r = requests.post(f"{BASE}/{table}", headers=HEADERS, json=data)
    if r.status_code == 201:
        return r.json()
    else:
        print(f"  ERROR posting to {table}: {r.status_code} {r.text[:200]}")
        return None

# ============================================================
# 预设ID
# ============================================================
TINA_ID   = "98f14fd7-70e7-44f3-a8b0-d85a8272c575"
JENNY_ID  = "25530087-7cc2-4d40-a11c-c7380b2e784f"
SHAUN_ID  = "dce797a6-2bff-4868-b3a6-4d9e10adb0dc"
BELLA_ID  = "f12f7fd9-f72d-4260-a1b2-455a323a927d"
EMP_ID    = "772fa2d8-99e4-4c45-b437-dfb31b4383ba"

DEPT_HR   = "308c90b1-b6e4-4faf-b1a9-49a051234d55"
DEPT_TECH = "b95b92a8-a8a6-4bdc-99e3-d2562274734e"
DEPT_BIZ  = "224979c0-c2ce-4550-843d-7172c9639106"
DEPT_ADMIN= "72407e55-5450-4a81-a625-20c100e9c350"

NOW = datetime.now(ZoneInfo("Asia/Shanghai"))
TODAY = NOW.date()

# ============================================================
# 3名虚拟员工
# ============================================================
employees_data = [
    {
        "employee_no": "EMP2026001",
        "user_id": EMP_ID,
        "chinese_name": "李明",
        "english_name": "Li Ming",
        "gender": "男",
        "id_card": "310101199805120015",
        "phone": "13800001001",
        "email": "liming@china-key.com",
        "birthday": "1998-05-12",
        "household_type": "城镇",
        "household_address": "上海市浦东新区世纪大道100号",
        "highest_education": "本科",
        "graduate_school": "复旦大学",
        "major": "计算机科学与技术",
        "graduation_date": "2026-06-30",
        "employee_type": "intern",
        "department_id": DEPT_TECH,
        "position_name": "Java开发实习生",
        "grade": "L1",
        "onboard_date": str(TODAY),
        "contract_start": str(TODAY),
        "contract_end": str(TODAY + timedelta(days=365)),
        "probation_end": str(TODAY + timedelta(days=90)),
        "monthly_salary": 5000.00,
        "bank_account": "6222021001001234567",
        "bank_name": "工商银行",
        "status": "probation",
        "report_to": BELLA_ID,
        "social_insurance": True,
        "commercial_insurance": True,
        "emergency_contact_name": "李建国",
        "emergency_contact_phone": "13900001001",
        "birth_place": "上海市",
        "nation": "汉族",
        "political_status": "共青团员",
        "marital_status": "未婚",
        "children_status": "无",
        "family_info": "父:李建国 母:王秀兰",
        "first_work_date": "2026-07-01",
        "prev_employment_status": "应届毕业生",
        "archive_location": "复旦大学档案馆",
        "technical_skills": "Java, Spring Boot, MySQL, Redis",
        "work_history": "2025.07-2025.09 腾讯科技 暑期实习 Java开发",
        "living_address": "上海市杨浦区四平路1239号",
        "social_insurance_status": "新参"
    },
    {
        "employee_no": "EMP2026002",
        "user_id": None,
        "chinese_name": "张思雨",
        "english_name": "Zhang Siyu",
        "gender": "女",
        "id_card": "320501199911082026",
        "phone": "13800001002",
        "email": "zhangsiyu@china-key.com",
        "birthday": "1999-11-08",
        "household_type": "城镇",
        "household_address": "江苏省苏州市姑苏区干将西路88号",
        "highest_education": "硕士",
        "graduate_school": "上海交通大学",
        "major": "工商管理",
        "graduation_date": "2026-03-20",
        "employee_type": "full_time",
        "department_id": DEPT_BIZ,
        "position_name": "管理培训生",
        "grade": "L2",
        "onboard_date": str(TODAY + timedelta(days=7)),
        "contract_start": str(TODAY + timedelta(days=7)),
        "contract_end": str(TODAY + timedelta(days=1095)),
        "probation_end": str(TODAY + timedelta(days=187)),
        "monthly_salary": 12000.00,
        "bank_account": "6222021002002345678",
        "bank_name": "建设银行",
        "status": "internship",
        "report_to": SHAUN_ID,
        "social_insurance": True,
        "commercial_insurance": False,
        "emergency_contact_name": "张建国",
        "emergency_contact_phone": "13900001002",
        "birth_place": "江苏省苏州市",
        "nation": "汉族",
        "political_status": "中共党员",
        "marital_status": "未婚",
        "children_status": "无",
        "family_info": "父:张建国 母:李美华",
        "first_work_date": "2026-07-08",
        "prev_employment_status": "应届毕业生",
        "archive_location": "上海交通大学档案馆",
        "technical_skills": "数据分析, Python, SQL, Tableau",
        "work_history": "2025.06-2025.12 美团 数据分析实习",
        "living_address": "上海市闵行区东川路800号",
        "social_insurance_status": "新参"
    },
    {
        "employee_no": "EMP2026003",
        "user_id": None,
        "chinese_name": "王浩然",
        "english_name": "Wang Haoran",
        "gender": "男",
        "id_card": "330102200005233019",
        "phone": "13800001003",
        "email": "wanghaoran@china-key.com",
        "birthday": "2000-05-23",
        "household_type": "城镇",
        "household_address": "浙江省杭州市西湖区文三路500号",
        "highest_education": "本科",
        "graduate_school": "上海师范大学",
        "major": "人力资源管理",
        "graduation_date": "2026-06-30",
        "employee_type": "intern",
        "department_id": DEPT_HR,
        "position_name": "HR实习生",
        "grade": "L1",
        "onboard_date": str(TODAY),
        "contract_start": str(TODAY),
        "contract_end": str(TODAY + timedelta(days=180)),
        "probation_end": str(TODAY + timedelta(days=60)),
        "monthly_salary": 4000.00,
        "bank_account": "6222021003003456789",
        "bank_name": "农业银行",
        "status": "probation",
        "report_to": TINA_ID,
        "social_insurance": False,
        "commercial_insurance": True,
        "emergency_contact_name": "王大伟",
        "emergency_contact_phone": "13900001003",
        "birth_place": "浙江省杭州市",
        "nation": "汉族",
        "political_status": "共青团员",
        "marital_status": "未婚",
        "children_status": "无",
        "family_info": "父:王大伟 母:陈秀英",
        "first_work_date": "2026-07-01",
        "prev_employment_status": "应届毕业生",
        "archive_location": "上海师范大学档案馆",
        "technical_skills": "Office, SPSS, 人力资源管理系统",
        "work_history": "无",
        "living_address": "上海市徐汇区桂林路100号",
        "social_insurance_status": "新参"
    }
]

print("=" * 60)
print("HRO入职模块V2 - 测试数据生成")
print("=" * 60)

# --- Step 1: 删除旧测试数据 ---
print("\n[1/5] 清理旧测试数据...")
for table in ["employee_training_progress", "welcome_announcements", "onboarding_guide_tasks", "onboarding_documents"]:
    try:
        r = requests.delete(f"{BASE}/{table}?employee_no=like.EMP2026*", headers=HEADERS)
    except:
        pass
# 删除测试员工
for eno in ["EMP2026001","EMP2026002","EMP2026003"]:
    try:
        r = requests.delete(f"{BASE}/employees?employee_no=eq.{eno}", headers=HEADERS)
    except:
        pass
print("  完成")

# --- Step 2: 插入员工 ---
print("\n[2/5] 插入虚拟员工...")
employee_ids = []
for emp in employees_data:
    result = post("employees", emp)
    if result:
        eid = result[0]["id"] if isinstance(result, list) else result["id"]
        employee_ids.append(eid)
        print(f"  ✓ {emp['chinese_name']} ({emp['employee_no']}) - {emp['position_name']}")
    else:
        print(f"  ✗ {emp['chinese_name']} 插入失败")

if len(employee_ids) < 3:
    print("ERROR: 员工插入不足，终止")
    exit(1)

EMP1, EMP2, EMP3 = employee_ids

# --- Step 3: 插入入职文档 ---
print("\n[3/5] 插入入职文档...")
docs = [
    # 李明 - 实习生文档
    {"employee_id": EMP1, "doc_type": "intern_approval", "doc_name": "应届生实习录用表", "need_seal": True, "status": "sealed"},
    {"employee_id": EMP1, "doc_type": "internship_agreement", "doc_name": "实习协议", "need_seal": True, "status": "pending_sign"},
    {"employee_id": EMP1, "doc_type": "onboarding_guide", "doc_name": "新员工入职引导表", "need_seal": False, "status": "pending"},
    {"employee_id": EMP1, "doc_type": "employee_handbook", "doc_name": "员工手册", "need_seal": False, "status": "pending"},
    {"employee_id": EMP1, "doc_type": "employee_info_form", "doc_name": "员工信息登记表", "need_seal": False, "status": "pending"},
    # 张思雨 - 管培生文档
    {"employee_id": EMP2, "doc_type": "offer_letter", "doc_name": "录用通知书", "need_seal": True, "status": "sealed"},
    {"employee_id": EMP2, "doc_type": "recruitment_approval", "doc_name": "录用审批单(第三联)", "need_seal": True, "status": "sealed"},
    {"employee_id": EMP2, "doc_type": "labor_contract", "doc_name": "劳动合同", "need_seal": True, "status": "pending_seal"},
    {"employee_id": EMP2, "doc_type": "onboarding_guide", "doc_name": "新员工入职引导表", "need_seal": False, "status": "pending"},
    {"employee_id": EMP2, "doc_type": "employee_info_form", "doc_name": "员工信息登记表", "need_seal": False, "status": "pending"},
    {"employee_id": EMP2, "doc_type": "employee_handbook", "doc_name": "员工手册", "need_seal": False, "status": "pending"},
    # 王浩然 - HR实习生
    {"employee_id": EMP3, "doc_type": "intern_approval", "doc_name": "应届生实习录用表", "need_seal": True, "status": "pending_seal"},
    {"employee_id": EMP3, "doc_type": "internship_agreement", "doc_name": "实习协议", "need_seal": True, "status": "pending"},
    {"employee_id": EMP3, "doc_type": "onboarding_guide", "doc_name": "新员工入职引导表", "need_seal": False, "status": "pending"},
    {"employee_id": EMP3, "doc_type": "employee_handbook", "doc_name": "员工手册", "need_seal": False, "status": "pending"},
    {"employee_id": EMP3, "doc_type": "employee_info_form", "doc_name": "员工信息登记表", "need_seal": False, "status": "pending"},
]
for d in docs:
    post("onboarding_documents", d)
print(f"  ✓ 共插入 {len(docs)} 份文档")

# --- Step 4: 插入入职引导任务 ---
print("\n[4/5] 插入入职引导任务...")

# 16项引导任务模板
guide_templates = [
    ("入职通知发放", "入职前", "黄燕婷", 1),
    ("工位/设备准备", "行政准备", "行政专员", 2),
    ("门禁卡/考勤录入", "行政准备", "行政专员", 3),
    ("系统账号开通", "IT准备", "IT管理员", 4),
    ("入职资料收集", "入职前", "黄燕婷", 5),
    ("劳动合同签署", "入职当日", "黄燕婷", 6),
    ("员工手册签收", "入职当日", "黄燕婷", 7),
    ("保密协议签署", "入职当日", "黄燕婷", 8),
    ("社保/公积金登记", "入职后", "黄燕婷", 9),
    ("商业保险登记", "入职后", "黄燕婷", 10),
    ("银行卡信息收集", "入职后", "黄燕婷", 11),
    ("档案调入", "入职后", "黄燕婷", 12),
    ("新员工培训安排", "培训", "部门负责人", 13),
    ("试用期目标设定", "入职后", "部门负责人", 14),
    ("导师分配", "入职当日", "部门负责人", 15),
    ("迎新公告发布", "入职前", "黄燕婷", 16),
]

for emp_id, emp_name in [(EMP1, "李明"), (EMP2, "张思雨"), (EMP3, "王浩然")]:
    for task_name, category, executor, order in guide_templates:
        # 根据不同员工设置不同的完成状态
        if emp_name == "李明":
            status = "completed" if order <= 3 else ("in_progress" if order <= 6 else "pending")
            completed_by = TINA_ID if status == "completed" and executor == "黄燕婷" else None
        elif emp_name == "张思雨":
            status = "completed" if order <= 2 else "pending"
            completed_by = TINA_ID if status == "completed" else None
        else:
            status = "completed" if order <= 1 else "pending"
            completed_by = TINA_ID if status == "completed" else None

        data = {
            "employee_id": emp_id,
            "task_name": task_name,
            "task_category": category,
            "executor_name": executor,
            "status": status,
            "sort_order": order,
            "completed_by": completed_by,
            "completed_at": str(NOW) if status == "completed" else None,
        }
        post("onboarding_guide_tasks", data)
print(f"  ✓ 共插入 {3 * 16} 条引导任务")

# --- Step 5: 插入培训进度 & 迎新公告 ---
print("\n[5/5] 插入培训进度和迎新公告...")

training_modules = [
    ("company_intro", "公司介绍与企业文化", 1),
    ("org_structure", "组织架构与部门介绍", 2),
    ("hr_policies", "人事制度与考勤规定", 3),
    ("it_security", "IT安全与信息安全", 4),
    ("oa_system", "OA系统使用指南", 5),
    ("finance_rules", "财务报销制度", 6),
    ("code_conduct", "员工行为准则", 7),
    ("career_dev", "职业发展与晋升通道", 8),
    ("health_safety", "职业健康与安全", 9),
]

for emp_id, emp_name in [(EMP1, "李明"), (EMP2, "张思雨"), (EMP3, "王浩然")]:
    for key, name, order in training_modules:
        # 李明已完成前3个模块
        if emp_name == "李明":
            is_read = order <= 3
            read_at = str(NOW) if is_read else None
        else:
            is_read = False
            read_at = None

        post("employee_training_progress", {
            "employee_id": emp_id,
            "module_key": key,
            "module_name": name,
            "module_order": order,
            "is_read": is_read,
            "read_at": read_at,
        })

    # 迎新公告 - 只为李明发布
    if emp_name == "李明":
        post("welcome_announcements", {
            "employee_id": emp_id,
            "display_name": "李明 Li Ming",
            "department_name": "技术部",
            "position_title": "Java开发实习生",
            "onboard_date": str(TODAY),
            "self_intro": "大家好，我是李明，复旦大学计算机科学与技术专业应届毕业生。平时喜欢打篮球和研究开源项目，很高兴加入开弈大家庭！",
            "education_bg": "复旦大学 计算机科学与技术 本科",
            "status": "published",
            "reviewed_by": TINA_ID,
            "reviewed_at": str(NOW),
            "published_at": str(NOW),
        })
        print(f"  ✓ {emp_name}: 9个培训模块 + 迎新公告(已发布)")
    elif emp_name == "张思雨":
        post("welcome_announcements", {
            "employee_id": emp_id,
            "display_name": "张思雨 Zhang Siyu",
            "department_name": "业务部",
            "position_title": "管理培训生",
            "onboard_date": str(TODAY + timedelta(days=7)),
            "self_intro": "上海交通大学工商管理硕士，热爱商业分析和战略规划。期待在开弈快速成长！",
            "education_bg": "上海交通大学 工商管理 硕士",
            "status": "draft",
        })
        print(f"  ✓ {emp_name}: 9个培训模块 + 迎新公告(草稿)")
    else:
        print(f"  ✓ {emp_name}: 9个培训模块")

print("\n" + "=" * 60)
print("测试数据生成完成！")
print("=" * 60)
print(f"\n员工ID:")
print(f"  李明:    {EMP1}")
print(f"  张思雨:  {EMP2}")
print(f"  王浩然:  {EMP3}")
print("\n请刷新入职管理页面查看。")
