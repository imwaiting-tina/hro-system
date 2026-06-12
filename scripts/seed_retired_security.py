"""新增退休返聘 + 保安 虚拟员工及入职数据"""
import requests, uuid, json, sys
from datetime import date, datetime, timezone

SUPABASE_URL = "https://wzmobwfoalgtppglbpcg.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bW9id2ZvYWxndHBwZ2xicGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjAzMTQsImV4cCI6MjA5NjczNjMxNH0.UQtUrdDfCNyAfd2srVgRzg9GGpjP-vY2l6kceWMY_HA"
HEADERS = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}", "Content-Type": "application/json", "Prefer": "return=representation"}
TINA_ID = "98f14fd7-70e7-44f3-a8b0-d85a8272c575"

now = datetime.now(timezone.utc).isoformat()

def post(table, payload):
    r = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", json=payload, headers=HEADERS)
    if r.status_code >= 300:
        print(f"  FAIL [{table}]: {r.status_code} {r.text[:200]}")
        return None
    data = r.json()
    print(f"  OK [{table}]: id={data[0].get('id','?') if isinstance(data,list) else data.get('id','?')}")
    return data[0] if isinstance(data, list) else data

# ============================================================
# 员工1: 赵建国 - 退休返聘，签署劳务协议
# ============================================================
emp4 = {
    "employee_no": "EMP2026004",
    "chinese_name": "赵建国",
    "english_name": "Zhao Jianguo",
    "employee_type": "retired_rehire",
    "status": "probation",
    "gender": "男",
    "id_card": "310101196501011234",
    "phone": "13812345678",
    "email": "zhaojianguo@china-key.com",
    "onboard_date": "2026-06-15",
    "position_name": "财务顾问",
    "department_id": None,
    "birthday": "1965-01-01",
    "highest_education": "本科",
    "nation": "汉族",
    "political_status": "群众",
    "marital_status": "已婚",
    "birth_place": "上海市",
    "first_work_date": "1988-07-01",
    "social_insurance": True,
    "bank_account": "6222021001234567890",
    "bank_name": "工商银行",
    "monthly_salary": 15000.00,
    "contract_start": "2026-06-15",
    "contract_end": "2027-06-14",
    "info_form_completed": False,
    "created_at": now,
    "updated_at": now,
}
e4 = post("employees", emp4)
if not e4:
    print("Failed to create 赵建国, aborting")
    sys.exit(1)
emp4_id = e4["id"]

# ============================================================
# 员工2: 陈志强 - 保安，签署保安劳动合同
# ============================================================
emp5 = {
    "employee_no": "EMP2026005",
    "chinese_name": "陈志强",
    "english_name": "Chen Zhiqiang",
    "employee_type": "security",
    "status": "probation",
    "gender": "男",
    "id_card": "320501198803151234",
    "phone": "13987654321",
    "email": "chenzhiqiang@china-key.com",
    "onboard_date": "2026-06-18",
    "position_name": "保安员",
    "department_id": None,
    "birthday": "1988-03-15",
    "highest_education": "高中",
    "nation": "汉族",
    "political_status": "群众",
    "marital_status": "已婚",
    "birth_place": "江苏省",
    "first_work_date": "2008-05-01",
    "social_insurance": True,
    "bank_account": "6217001234567890123",
    "bank_name": "建设银行",
    "monthly_salary": 5500.00,
    "contract_start": "2026-06-18",
    "contract_end": "2028-06-17",
    "info_form_completed": False,
    "created_at": now,
    "updated_at": now,
}
e5 = post("employees", emp5)
if not e5:
    print("Failed to create 陈志强, aborting")
    sys.exit(1)
emp5_id = e5["id"]

print("\n--- 入职文档 ---")

# 赵建国（退休返聘）的文档
docs_4 = [
    {"employee_id": emp4_id, "doc_type": "service_agreement", "doc_name": "劳务协议", "need_seal": True, "status": "pending_sign"},
    {"employee_id": emp4_id, "doc_type": "onboarding_guide", "doc_name": "新员工入职引导表", "need_seal": False, "status": "pending"},
    {"employee_id": emp4_id, "doc_type": "employee_info_form", "doc_name": "员工信息登记表", "need_seal": False, "status": "pending"},
    {"employee_id": emp4_id, "doc_type": "employee_handbook", "doc_name": "员工手册", "need_seal": False, "status": "pending"},
]
for d in docs_4:
    post("onboarding_documents", d)

# 陈志强（保安）的文档
docs_5 = [
    {"employee_id": emp5_id, "doc_type": "security_contract", "doc_name": "保安劳动合同", "need_seal": True, "status": "pending_sign"},
    {"employee_id": emp5_id, "doc_type": "onboarding_guide", "doc_name": "新员工入职引导表", "need_seal": False, "status": "pending"},
    {"employee_id": emp5_id, "doc_type": "employee_info_form", "doc_name": "员工信息登记表", "need_seal": False, "status": "pending"},
    {"employee_id": emp5_id, "doc_type": "employee_handbook", "doc_name": "员工手册", "need_seal": False, "status": "pending"},
]
for d in docs_5:
    post("onboarding_documents", d)

print("\n--- 引导任务 ---")

guide_tasks_4 = [
    (emp4_id, '入职通知发放', '入职前', '黄燕婷', 'completed', 1, TINA_ID),
    (emp4_id, '工位/设备准备', '行政准备', '行政专员', 'completed', 2, TINA_ID),
    (emp4_id, '门禁卡/考勤录入', '行政准备', '行政专员', 'in_progress', 3, None),
    (emp4_id, '系统账号开通', 'IT准备', 'IT管理员', 'pending', 4, None),
    (emp4_id, '入职资料收集', '入职前', '黄燕婷', 'pending', 5, None),
    (emp4_id, '劳务协议签署', '入职当日', '黄燕婷', 'pending', 6, None),
    (emp4_id, '员工手册签收', '入职当日', '黄燕婷', 'pending', 7, None),
    (emp4_id, '银行卡信息收集', '入职后', '黄燕婷', 'pending', 8, None),
    (emp4_id, '商业保险登记', '入职后', '黄燕婷', 'pending', 9, None),
    (emp4_id, '新员工培训安排', '培训', '部门负责人', 'pending', 10, None),
    (emp4_id, '试用期目标设定', '入职后', '部门负责人', 'pending', 11, None),
    (emp4_id, '导师分配', '入职当日', '部门负责人', 'pending', 12, None),
    (emp4_id, '迎新公告发布', '入职前', '黄燕婷', 'pending', 13, None),
]
for eid, tn, tc, ex, st, so, cb in guide_tasks_4:
    p = {"employee_id": eid, "task_name": tn, "task_category": tc, "executor_name": ex, "status": st, "sort_order": so}
    if cb:
        p["completed_by"] = cb
        p["completed_at"] = now
    post("onboarding_guide_tasks", p)

guide_tasks_5 = [
    (emp5_id, '入职通知发放', '入职前', '黄燕婷', 'completed', 1, TINA_ID),
    (emp5_id, '工位/设备准备', '行政准备', '行政专员', 'completed', 2, TINA_ID),
    (emp5_id, '门禁卡/考勤录入', '行政准备', '行政专员', 'in_progress', 3, None),
    (emp5_id, '系统账号开通', 'IT准备', 'IT管理员', 'pending', 4, None),
    (emp5_id, '入职资料收集', '入职前', '黄燕婷', 'pending', 5, None),
    (emp5_id, '保安劳动合同签署', '入职当日', '黄燕婷', 'pending', 6, None),
    (emp5_id, '员工手册签收', '入职当日', '黄燕婷', 'pending', 7, None),
    (emp5_id, '社保/公积金登记', '入职后', '黄燕婷', 'pending', 8, None),
    (emp5_id, '银行卡信息收集', '入职后', '黄燕婷', 'pending', 9, None),
    (emp5_id, '保安岗位培训', '培训', '部门负责人', 'pending', 10, None),
    (emp5_id, '试用期目标设定', '入职后', '部门负责人', 'pending', 11, None),
    (emp5_id, '迎新公告发布', '入职前', '黄燕婷', 'pending', 12, None),
]
for eid, tn, tc, ex, st, so, cb in guide_tasks_5:
    p = {"employee_id": eid, "task_name": tn, "task_category": tc, "executor_name": ex, "status": st, "sort_order": so}
    if cb:
        p["completed_by"] = cb
        p["completed_at"] = now
    post("onboarding_guide_tasks", p)

print("\n--- 培训进度 ---")

training_modules = [
    ('company_intro', '公司介绍与企业文化', 1),
    ('org_structure', '组织架构与部门介绍', 2),
    ('hr_policies', '人事制度与考勤规定', 3),
    ('it_security', 'IT安全与信息安全', 4),
    ('oa_system', 'OA系统使用指南', 5),
    ('finance_rules', '财务报销制度', 6),
    ('code_conduct', '员工行为准则', 7),
    ('career_dev', '职业发展与晋升通道', 8),
    ('health_safety', '职业健康与安全', 9),
]
for emp_id in [emp4_id, emp5_id]:
    for mk, mn, mo in training_modules:
        post("employee_training_progress", {
            "employee_id": emp_id,
            "module_key": mk,
            "module_name": mn,
            "module_order": mo,
            "is_read": False,
        })

print("\n--- 迎新公告 ---")
post("welcome_announcements", {
    "employee_id": emp4_id,
    "display_name": "赵建国 Zhao Jianguo",
    "department_name": "财务部",
    "position_title": "财务顾问",
    "onboard_date": "2026-06-15",
    "self_intro": "大家好，我是赵建国，原国企财务总监，退休后继续发挥余热。擅长财务审计和税务筹划，很高兴加入开弈！",
    "education_bg": "上海财经大学 会计学 本科",
    "status": "draft",
})
post("welcome_announcements", {
    "employee_id": emp5_id,
    "display_name": "陈志强 Chen Zhiqiang",
    "department_name": "行政部",
    "position_title": "保安员",
    "onboard_date": "2026-06-18",
    "self_intro": "大家好，我是陈志强，有8年安保工作经验。责任心强，守护公司安全是我的使命！",
    "education_bg": "苏州市第三中学 高中",
    "status": "draft",
})

print("\n========== DONE ==========")
print(f"退休返聘: 赵建国 (id={emp4_id})")
print(f"保安:     陈志强 (id={emp5_id})")
