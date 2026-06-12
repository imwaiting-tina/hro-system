"""
招聘管理模块虚拟数据填充脚本 v3
覆盖完整招聘流程：简历库 → 招聘需求 → 面试 → Offer → 审批
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

def post(table, data):
    r = requests.post(f'{URL}/rest/v1/{table}', headers=HEADERS, json=data)
    if r.status_code == 201:
        result = r.json()
        return result[0] if isinstance(result, list) else result
    else:
        print(f"  ERROR {table}: {r.status_code} {r.text[:200]}")
        return None

# ============================================================
# 1. 清空旧数据
# ============================================================
print("清空旧数据...")
h_del = {**HEADERS, 'Prefer': 'return=minimal'}
for t in ['resumes', 'interviews', 'offers', 'recruitment_requests']:
    requests.delete(f'{URL}/rest/v1/{t}?id=not.is.null', headers=h_del)
requests.delete(f'{URL}/rest/v1/approval_records?module=eq.recruitment', headers=h_del)
print("已清空")

# ============================================================
# 2. 招聘需求（3个岗位）
# ============================================================
print("\n创建招聘需求...")
reqs = [
    {"id": str(uuid.uuid4()), "request_no": "REQ-2026001", "position_name": "Java开发工程师",
     "quantity": 2, "grade": "P2-P3", "salary_range_min": 12000, "salary_range_max": 18000,
     "expected_onboard_date": "2026-07-15",
     "recruitment_reason": "HRO系统持续迭代，需要Java后端开发人员参与系统架构优化与新功能开发",
     "gender_requirement": "不限", "age_requirement": "25-35", "education_requirement": "本科及以上",
     "work_experience_requirement": "2-5年Java开发经验，熟悉Spring Boot、MyBatis，有微服务项目经验优先",
     "preferred_major": "计算机科学与技术、软件工程",
     "brief_job_description": "1. 负责HRO人事管理系统后端开发与维护\n2. 参与系统架构设计和技术方案评审\n3. 配合前端完成API接口开发\n4. 编写技术文档和单元测试",
     "status": "approved", "created_by": TINA, "dept_head_id": SHAUN, "hr_head_id": TINA,
     "final_approver_id": JENNY, "dept_approved_at": iso(-10), "hr_approved_at": iso(-9),
     "final_approved_at": iso(-8), "publish_platforms": ["boss_zhipin","other"],
     "published_at": iso(-8), "created_at": iso(-12)},
    {"id": str(uuid.uuid4()), "request_no": "REQ-2026002", "position_name": "HR实习生",
     "quantity": 1, "grade": "实习", "salary_range_min": 4000, "salary_range_max": 5000,
     "expected_onboard_date": "2026-07-01",
     "recruitment_reason": "人事部日常事务增加，需要实习生协助处理档案管理、数据录入等工作",
     "gender_requirement": "不限", "age_requirement": "20-25", "education_requirement": "本科在读",
     "work_experience_requirement": "无需工作经验，人力资源/行政管理专业优先",
     "preferred_major": "人力资源管理、工商管理、行政管理",
     "brief_job_description": "1. 协助员工档案整理与归档\n2. 协助招聘简历筛选和面试安排\n3. 员工信息数据录入与维护\n4. 日常行政事务处理",
     "status": "approved", "created_by": TINA, "dept_head_id": SHAUN, "hr_head_id": TINA,
     "final_approver_id": JENNY, "dept_approved_at": iso(-14), "hr_approved_at": iso(-13),
     "final_approved_at": iso(-12), "publish_platforms": ["boss_zhipin"],
     "published_at": iso(-12), "created_at": iso(-16)},
    {"id": str(uuid.uuid4()), "request_no": "REQ-2026003", "position_name": "前端开发工程师",
     "quantity": 1, "grade": "P2-P3", "salary_range_min": 13000, "salary_range_max": 20000,
     "expected_onboard_date": "2026-07-20",
     "recruitment_reason": "HRO系统前端功能扩展需要，需要专职前端开发人员负责React组件开发与UI优化",
     "gender_requirement": "不限", "age_requirement": "25-35", "education_requirement": "本科及以上",
     "work_experience_requirement": "2-5年前端开发经验，精通React/TypeScript，熟悉Ant Design组件库",
     "preferred_major": "计算机科学与技术、软件工程、数字媒体技术",
     "brief_job_description": "1. 负责HRO系统前端页面开发与维护\n2. 参与UI/UX设计方案评审\n3. 与后端协作完成前后端联调\n4. 前端性能优化与组件封装",
     "status": "approved", "created_by": TINA, "dept_head_id": SHAUN, "hr_head_id": TINA,
     "final_approver_id": JENNY, "dept_approved_at": iso(-5), "hr_approved_at": iso(-4),
     "final_approved_at": iso(-3), "publish_platforms": ["boss_zhipin","other"],
     "published_at": iso(-3), "created_at": iso(-7)},
]

req_ids = {}
for req in reqs:
    r = post('recruitment_requests', req)
    if r:
        req_ids[req['request_no']] = req['id']
        print(f"  {req['request_no']} {req['position_name']} - OK")
    else:
        req_ids[req['request_no']] = req['id']

# ============================================================
# 3. 简历库（10份简历）
#    source: boss_zhipin | internal_referral | email | other
#    applied_position 是 uuid，不传
# ============================================================
print("\n创建简历...")
resumes = [
    # --- Java开发 ---
    {"candidate_name": "赵一鸣", "gender": "男", "phone": "13800138001", "email": "zhaoyiming@example.com",
     "source": "boss_zhipin", "source_detail": "BOSS直聘主动投递", "highest_education": "本科",
     "school": "华东理工大学", "major": "软件工程", "graduation_year": 2021,
     "expected_salary": 16000, "available_date": "2026-07-15", "status": "screening",
     "tags": ["Spring Boot","MyBatis","微服务"],
     "notes": "3年Java开发经验，上家公司在携程，参与过订单系统开发",
     "created_by": TINA, "created_at": iso(-7)},
    {"candidate_name": "钱思远", "gender": "男", "phone": "13800138002", "email": "qiansiyuan@example.com",
     "source": "other", "source_detail": "前程无忧主动投递", "highest_education": "硕士",
     "school": "上海交通大学", "major": "计算机科学与技术", "graduation_year": 2023,
     "expected_salary": 18000, "available_date": "2026-07-20", "status": "screening",
     "tags": ["Spring Cloud","Redis","Kafka"],
     "notes": "硕士应届，有字节跳动实习经验，参与过广告投放系统开发",
     "created_by": TINA, "created_at": iso(-6)},
    {"candidate_name": "孙文博", "gender": "男", "phone": "13800138003", "email": "sunwenbo@example.com",
     "source": "other", "source_detail": "拉勾网主动投递", "highest_education": "本科",
     "school": "同济大学", "major": "计算机科学与技术", "graduation_year": 2020,
     "expected_salary": 15000, "available_date": "2026-07-10", "status": "interviewing_first",
     "tags": ["Java","Spring","MySQL"],
     "notes": "4年Java开发，目前在平安科技，期望换环境",
     "created_by": TINA, "created_at": iso(-5)},
    # --- HR实习生 ---
    {"candidate_name": "李思琪", "gender": "女", "phone": "13800138004", "email": "lisiqi@example.com",
     "source": "boss_zhipin", "source_detail": "BOSS直聘主动投递", "highest_education": "本科在读",
     "school": "上海师范大学", "major": "人力资源管理", "graduation_year": 2027,
     "expected_salary": 4500, "available_date": "2026-07-01", "status": "interviewing_first",
     "tags": ["人力资源","Excel","细心"],
     "notes": "大三在读，每周可实习4天，有社团管理经验",
     "created_by": TINA, "created_at": iso(-5)},
    {"candidate_name": "周小雅", "gender": "女", "phone": "13800138005", "email": "zhouxiaoya@example.com",
     "source": "other", "source_detail": "前程无忧主动投递", "highest_education": "本科在读",
     "school": "复旦大学", "major": "行政管理", "graduation_year": 2027,
     "expected_salary": 5000, "available_date": "2026-07-05", "status": "interviewing_second",
     "tags": ["行政","沟通能力","学生会"],
     "notes": "大三在读，学生会副主席，沟通能力强",
     "created_by": TINA, "created_at": iso(-7)},
    # --- 前端开发 ---
    {"candidate_name": "吴晨光", "gender": "男", "phone": "13800138006", "email": "wuchenguang@example.com",
     "source": "boss_zhipin", "source_detail": "BOSS直聘主动投递", "highest_education": "本科",
     "school": "华东师范大学", "major": "软件工程", "graduation_year": 2021,
     "expected_salary": 17000, "available_date": "2026-07-25", "status": "screening",
     "tags": ["React","TypeScript","Ant Design"],
     "notes": "3年前端开发经验，有完整后台管理系统开发经验",
     "created_by": TINA, "created_at": iso(-4)},
    {"candidate_name": "郑雨桐", "gender": "女", "phone": "13800138007", "email": "zhengyutong@example.com",
     "source": "other", "source_detail": "猎聘主动投递", "highest_education": "本科",
     "school": "上海大学", "major": "数字媒体技术", "graduation_year": 2022,
     "expected_salary": 15000, "available_date": "2026-07-20", "status": "interviewing_first",
     "tags": ["Vue","React","ECharts"],
     "notes": "2年前端经验，在饿了么做过商家端后台",
     "created_by": TINA, "created_at": iso(-3)},
    # --- 已完成流程 ---
    {"candidate_name": "陈明远", "gender": "男", "phone": "13800138008", "email": "chenmingyuan@example.com",
     "source": "internal_referral", "source_detail": "Jenny推荐", "highest_education": "硕士",
     "school": "浙江大学", "major": "计算机科学与技术", "graduation_year": 2022,
     "expected_salary": 20000, "available_date": "2026-06-30", "status": "offered",
     "tags": ["Java","微服务","高并发"],
     "notes": "硕士学历，阿里P6级别，因家庭原因回上海发展，已通过三轮面试",
     "created_by": TINA, "created_at": iso(-14)},
    # --- 不录取 ---
    {"candidate_name": "林小曼", "gender": "女", "phone": "13800138009", "email": "linxiaoman@example.com",
     "source": "boss_zhipin", "source_detail": "BOSS直聘主动投递", "highest_education": "本科",
     "school": "南京大学", "major": "人力资源管理", "graduation_year": 2021,
     "expected_salary": 5000, "available_date": "2026-06-20", "status": "rejected",
     "tags": ["HR","招聘"],
     "notes": "一面表现一般，对HRO系统不熟悉，面试官建议不录取",
     "created_by": TINA, "created_at": iso(-10)},
    {"candidate_name": "马骏飞", "gender": "男", "phone": "13800138010", "email": "majunfei@example.com",
     "source": "other", "source_detail": "前程无忧主动投递", "highest_education": "本科",
     "school": "合肥工业大学", "major": "计算机科学与技术", "graduation_year": 2020,
     "expected_salary": 14000, "available_date": "2026-07-01", "status": "rejected",
     "tags": ["Java","Spring"],
     "notes": "技术面未通过，Spring底层原理回答不扎实",
     "created_by": TINA, "created_at": iso(-9)},
]

resume_ids = {}
for r_data in resumes:
    rid = str(uuid.uuid4())
    r_data["id"] = rid
    r_data["updated_at"] = r_data["created_at"]
    r = post('resumes', r_data)
    if r:
        resume_ids[r_data['candidate_name']] = r['id']
        print(f"  {r_data['candidate_name']} ({r_data['status']}) - OK")
    else:
        resume_ids[r_data['candidate_name']] = rid

# ============================================================
# 4. 面试记录
# ============================================================
print("\n创建面试记录...")

def add_iv(name, round_, days, loc, ivs, result, fb):
    rid = resume_ids.get(name)
    if not rid:
        print(f"  SKIP {name} - no resume")
        return
    iv = {
        "id": str(uuid.uuid4()), "resume_id": rid, "round": round_,
        "scheduled_at": iso(days), "location": loc, "interviewers": ivs,
        "result": result, "feedback": fb, "created_by": TINA,
        "created_at": iso(days-1), "updated_at": iso(days-1),
    }
    r = post('interviews', iv)
    print(f"  {name} {round_}轮 - {'OK' if r else 'FAIL'}")

# 陈明远 - 三轮通过
add_iv("陈明远", "first", -5, "公司3楼会议室A", [TINA], "passed",
       "候选人Java基础扎实，有阿里P6背景，技术能力符合岗位要求，建议进入二面")
add_iv("陈明远", "second", -3, "公司3楼会议室B", [SHAUN], "passed",
       "系统设计能力强，对分布式系统有深入理解，沟通表达清晰，建议进入终面")
add_iv("陈明远", "final", -1, "总裁办公室", [JENNY, SHAUN], "passed",
       "综合素质优秀，价值观与公司匹配，同意录用")

# 孙文博 - 一面通过
add_iv("孙文博", "first", -1, "公司3楼会议室A", [TINA], "passed",
       "技术能力中上，Spring全家桶熟练，对HRO系统有兴趣，建议进入二面")

# 李思琪 - 一面通过
add_iv("李思琪", "first", -2, "人事部办公室", [TINA], "passed",
       "态度端正，对HR工作有热情，Excel技能熟练，建议进入二面")

# 周小雅 - 一面二面通过
add_iv("周小雅", "first", -5, "人事部办公室", [TINA], "passed",
       "复旦大学背景，沟通表达能力强，有学生会管理经验，建议进入二面")
add_iv("周小雅", "second", -2, "人事部办公室", [SHAUN], "passed",
       "逻辑清晰，学习能力强，对人事管理有基本认知，建议终面")

# 郑雨桐 - 一面待评定
add_iv("郑雨桐", "first", 1, "公司3楼会议室A", [TINA], None, "")

# 林小曼 - 一面不通过
add_iv("林小曼", "first", -7, "人事部办公室", [TINA], "failed",
       "对HRO系统认知不足，沟通表达偏弱，不符合岗位要求")

# 马骏飞 - 一面不通过
add_iv("马骏飞", "first", -6, "公司3楼会议室A", [TINA], "failed",
       "Spring底层原理回答不扎实，多线程和JVM调优经验不足")

# ============================================================
# 5. Offer（陈明远 - 需要 job_applications 表关联，先用 approval_records 表示流程）
#    offers 表需要 offer_no + application_id，目前没有 job_applications 数据
#    跳过 Offer，审批记录中体现即可
# ============================================================
print("\n跳过Offer（需要 job_applications 关联表数据）")

# ============================================================
# 6. 审批记录（3条招聘需求审批）
# ============================================================
print("\n创建审批记录...")
approvals = [
    {"id": str(uuid.uuid4()), "module": "recruitment",
     "record_id": req_ids["REQ-2026001"], "step_order": 1,
     "step_name": "招聘需求审批", "approver_id": JENNY, "approver_role": "super_admin",
     "status": "approved", "opinion": "同意，尽快推进招聘",
     "approved_at": iso(-8), "created_at": iso(-10)},
    {"id": str(uuid.uuid4()), "module": "recruitment",
     "record_id": req_ids["REQ-2026002"], "step_order": 1,
     "step_name": "招聘需求审批", "approver_id": JENNY, "approver_role": "super_admin",
     "status": "approved", "opinion": "同意，暑期实习生尽快到位",
     "approved_at": iso(-12), "created_at": iso(-14)},
    {"id": str(uuid.uuid4()), "module": "recruitment",
     "record_id": req_ids["REQ-2026003"], "step_order": 1,
     "step_name": "招聘需求审批", "approver_id": JENNY, "approver_role": "super_admin",
     "status": "approved", "opinion": "同意，系统前端需要专职人员",
     "approved_at": iso(-3), "created_at": iso(-5)},
]
for app in approvals:
    r = post('approval_records', app)
    print(f"  {app['step_name']} - {'OK' if r else 'FAIL'}")

print("\n===== 招聘管理虚拟数据填充完成 =====")
print("  招聘需求: 3个 (REQ-2026001/002/003)")
print("  简历库: 10份（screening/interviewing_first/interviewing_second/offered/rejected）")
print("  面试记录: 11条（一二三面各状态）")
print("  审批记录: 3条")
