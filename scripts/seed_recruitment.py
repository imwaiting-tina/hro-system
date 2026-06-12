"""
招聘管理模块虚拟数据填充脚本 v4
覆盖所有状态/场景的完整数据：
- 招聘需求：draft/pending_dept/pending_hr/pending_final/approved/rejected/published/closed
- 简历库：new/screening/interviewing_first/interviewing_second/interviewing_final/pending_offer/offered/accepted/rejected/withdrawn
- 面试记录：pending/passed/failed/cancelled
- 求职申请表：draft/submitted/hr_reviewed/dept_reviewed/final_reviewed/rejected
- Offer：draft/pending_send/sent/delivered/accepted/rejected/expired/revoked
- 审批记录：pending/approved/rejected
"""
import requests
import uuid
from datetime import datetime, timedelta, timezone

URL = 'https://wzmobwfoalgtppglbpcg.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bW9id2ZvYWxndHBwZ2xicGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjAzMTQsImV4cCI6MjA5NjczNjMxNH0.UQtUrdDfCNyAfd2srVgRzg9GGpjP-vY2l6kceWMY_HA'
HEADERS = {'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json', 'Prefer': 'return=representation'}

# 用户ID
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
print("清空旧招聘数据...")
h_del = {**HEADERS, 'Prefer': 'return=minimal'}
for t in ['notifications', 'offers', 'job_applications', 'interviews', 'resumes', 'recruitment_requests']:
    r = requests.delete(f'{URL}/rest/v1/{t}?id=not.is.null', headers=h_del)
    print(f"  {t}: {r.status_code}")
requests.delete(f'{URL}/rest/v1/approval_records?module=eq.recruitment', headers=h_del)
print("已清空\n")

# ============================================================
# 2. 招聘需求（8条，覆盖所有状态 + 不同部门）
# ============================================================
print("=" * 60)
print("创建招聘需求（8条，全状态覆盖）...")

reqs = [
    # 1. draft - 草稿
    {"id": str(uuid.uuid4()), "request_no": "REQ-2026001", "position_name": "Python数据分析师",
     "quantity": 1, "grade": "P2-P3", "salary_range_min": 13000, "salary_range_max": 19000,
     "expected_onboard_date": date_str(30),
     "recruitment_reason": "业务部门数据报表需求增加，需要专职数据分析人员",
     "gender_requirement": "不限", "age_requirement": "25-35", "education_requirement": "本科及以上",
     "work_experience_requirement": "2年以上数据分析经验，熟悉Python、SQL，有BI工具使用经验优先",
     "preferred_major": "统计学、数据科学、计算机相关",
     "brief_job_description": "1. 负责业务数据提取与分析\n2. 搭建数据看板和报表\n3. 协助业务部门数据驱动决策",
     "status": "draft", "created_by": TINA, "created_at": iso(-1)},

    # 2. pending_dept - 待部门负责人确认
    {"id": str(uuid.uuid4()), "request_no": "REQ-2026002", "position_name": "市场推广专员",
     "quantity": 2, "grade": "P1-P2", "salary_range_min": 8000, "salary_range_max": 12000,
     "expected_onboard_date": date_str(45),
     "recruitment_reason": "新业务线拓展，需要市场推广人员支持线下活动和线上运营",
     "gender_requirement": "不限", "age_requirement": "22-30", "education_requirement": "大专及以上",
     "work_experience_requirement": "1年以上市场推广经验，有活动策划经验优先",
     "preferred_major": "市场营销、广告学、新闻传播",
     "brief_job_description": "1. 负责线下推广活动策划与执行\n2. 线上社交媒体内容运营\n3. 市场数据收集与分析",
     "status": "pending_dept", "created_by": TINA, "dept_head_id": SHAUN, "created_at": iso(-3)},

    # 3. pending_hr - 待人事负责人确认
    {"id": str(uuid.uuid4()), "request_no": "REQ-2026003", "position_name": "UI/UX设计师",
     "quantity": 1, "grade": "P2-P3", "salary_range_min": 14000, "salary_range_max": 20000,
     "expected_onboard_date": date_str(35),
     "recruitment_reason": "HRO系统界面需要专业化设计，提升用户体验",
     "gender_requirement": "不限", "age_requirement": "25-35", "education_requirement": "本科及以上",
     "work_experience_requirement": "2年以上UI/UX设计经验，精通Figma/Sketch，有B端产品设计经验优先",
     "preferred_major": "设计学、视觉传达、数字媒体",
     "brief_job_description": "1. 负责HRO系统界面设计\n2. 制定设计规范和组件库\n3. 用户体验优化与迭代",
     "status": "pending_hr", "created_by": TINA, "dept_head_id": SHAUN, "hr_head_id": TINA,
     "dept_approved_at": iso(-5), "created_at": iso(-7)},

    # 4. pending_final - 待Jenny终审
    {"id": str(uuid.uuid4()), "request_no": "REQ-2026004", "position_name": "法务专员",
     "quantity": 1, "grade": "P3-P4", "salary_range_min": 15000, "salary_range_max": 22000,
     "expected_onboard_date": date_str(25),
     "recruitment_reason": "公司业务扩展，合同审核和法律咨询需求增加，需配备专职法务人员",
     "gender_requirement": "不限", "age_requirement": "28-40", "education_requirement": "本科及以上（法学专业）",
     "work_experience_requirement": "3年以上企业法务或律所经验，熟悉劳动法、合同法",
     "preferred_major": "法学",
     "brief_job_description": "1. 合同审核与法律风险把控\n2. 劳动用工合规管理\n3. 知识产权保护与维权\n4. 法律咨询与培训",
     "status": "pending_final", "created_by": TINA, "dept_head_id": SHAUN, "hr_head_id": TINA,
     "final_approver_id": JENNY, "dept_approved_at": iso(-10), "hr_approved_at": iso(-8),
     "created_at": iso(-12)},

    # 5. approved - 已批准（待发布）
    {"id": str(uuid.uuid4()), "request_no": "REQ-2026005", "position_name": "Java开发工程师",
     "quantity": 2, "grade": "P2-P3", "salary_range_min": 12000, "salary_range_max": 18000,
     "expected_onboard_date": date_str(20),
     "recruitment_reason": "HRO系统持续迭代，需要Java后端开发人员参与系统架构优化与新功能开发",
     "gender_requirement": "不限", "age_requirement": "25-35", "education_requirement": "本科及以上",
     "work_experience_requirement": "2-5年Java开发经验，熟悉Spring Boot、MyBatis，有微服务项目经验优先",
     "preferred_major": "计算机科学与技术、软件工程",
     "brief_job_description": "1. 负责HRO人事管理系统后端开发与维护\n2. 参与系统架构设计和技术方案评审\n3. 配合前端完成API接口开发\n4. 编写技术文档和单元测试",
     "status": "approved", "created_by": TINA, "dept_head_id": SHAUN, "hr_head_id": TINA,
     "final_approver_id": JENNY, "dept_approved_at": iso(-12), "hr_approved_at": iso(-11),
     "final_approved_at": iso(-10), "created_at": iso(-14)},

    # 6. rejected - 已驳回
    {"id": str(uuid.uuid4()), "request_no": "REQ-2026006", "position_name": "行政总监",
     "quantity": 1, "grade": "M2-M3", "salary_range_min": 25000, "salary_range_max": 35000,
     "expected_onboard_date": date_str(-5),
     "recruitment_reason": "行政部管理层空缺，需要资深管理人员统筹行政工作",
     "gender_requirement": "不限", "age_requirement": "35-45", "education_requirement": "本科及以上",
     "work_experience_requirement": "8年以上行政管理经验，有团队管理经验",
     "preferred_major": "行政管理、工商管理",
     "brief_job_description": "1. 统筹行政部日常管理工作\n2. 制定行政管理制度和流程\n3. 协调跨部门行政事务",
     "status": "rejected", "created_by": TINA, "dept_head_id": SHAUN, "hr_head_id": TINA,
     "final_approver_id": JENNY, "dept_approved_at": iso(-15), "hr_approved_at": iso(-14),
     "final_approved_at": iso(-13), "created_at": iso(-17)},

    # 7. published - 已发布
    {"id": str(uuid.uuid4()), "request_no": "REQ-2026007", "position_name": "HR实习生",
     "quantity": 1, "grade": "实习", "salary_range_min": 4000, "salary_range_max": 5000,
     "expected_onboard_date": date_str(10),
     "recruitment_reason": "人事部日常事务增加，需要实习生协助处理档案管理、数据录入等工作",
     "gender_requirement": "不限", "age_requirement": "20-25", "education_requirement": "本科在读",
     "work_experience_requirement": "无需工作经验，人力资源/行政管理专业优先",
     "preferred_major": "人力资源管理、工商管理、行政管理",
     "brief_job_description": "1. 协助员工档案整理与归档\n2. 协助招聘简历筛选和面试安排\n3. 员工信息数据录入与维护\n4. 日常行政事务处理",
     "status": "published", "created_by": TINA, "dept_head_id": SHAUN, "hr_head_id": TINA,
     "final_approver_id": JENNY, "dept_approved_at": iso(-16), "hr_approved_at": iso(-15),
     "final_approved_at": iso(-14), "publish_platforms": ["boss_zhipin"],
     "published_at": iso(-14), "created_at": iso(-18)},

    # 8. closed - 已关闭
    {"id": str(uuid.uuid4()), "request_no": "REQ-2026008", "position_name": "财务助理",
     "quantity": 1, "grade": "P1-P2", "salary_range_min": 7000, "salary_range_max": 10000,
     "expected_onboard_date": date_str(-30),
     "recruitment_reason": "财务部人手不足，需要助理协助日常账务处理",
     "gender_requirement": "不限", "age_requirement": "22-30", "education_requirement": "大专及以上",
     "work_experience_requirement": "1年以上财务相关经验，有会计从业资格证",
     "preferred_major": "会计学、财务管理",
     "brief_job_description": "1. 日常费用报销审核\n2. 银行对账与资金日报\n3. 发票开具与管理\n4. 协助月结和年结工作",
     "status": "closed", "created_by": TINA, "dept_head_id": SHAUN, "hr_head_id": TINA,
     "final_approver_id": JENNY, "dept_approved_at": iso(-40), "hr_approved_at": iso(-39),
     "final_approved_at": iso(-38), "publish_platforms": ["boss_zhipin", "other"],
     "published_at": iso(-38), "created_at": iso(-42)},
]

req_ids = {}
for req in reqs:
    r = post('recruitment_requests', req)
    if r:
        req_ids[req['request_no']] = req['id']
        print(f"  {req['request_no']} [{req['status']}] {req['position_name']} - OK")
    else:
        req_ids[req['request_no']] = req['id']

# ============================================================
# 3. 简历库（20份，覆盖所有status + 不同source）
# ============================================================
print("\n" + "=" * 60)
print("创建简历库（20份，全状态+全来源覆盖）...")

resumes = [
    # --- new (新收) ---
    {"candidate_name": "赵一鸣", "gender": "男", "phone": "13800138001", "email": "zhaoyiming@example.com",
     "source": "boss_zhipin", "source_detail": "BOSS直聘主动投递", "highest_education": "硕士",
     "school": "华东理工大学", "major": "软件工程", "graduation_year": 2023,
     "expected_salary": 16000, "available_date": date_str(15), "status": "new",
     "tags": ["Spring Boot", "MyBatis", "硕士"],
     "notes": "硕士应届，研究方向为分布式系统，有阿里实习经验",
     "created_by": TINA, "created_at": iso(-1)},

    {"candidate_name": "钱思远", "gender": "男", "phone": "13800138002", "email": "qiansiyuan@example.com",
     "source": "email", "source_detail": "HR邮箱投递", "highest_education": "本科",
     "school": "上海大学", "major": "计算机科学与技术", "graduation_year": 2022,
     "expected_salary": 14000, "available_date": date_str(20), "status": "new",
     "tags": ["Java", "Spring", "Vue"],
     "notes": "2年全栈开发经验，目前在小公司做内部管理系统",
     "created_by": TINA, "created_at": iso(-1)},

    {"candidate_name": "孙文博", "gender": "男", "phone": "13800138003", "email": "sunwenbo@example.com",
     "source": "other", "source_detail": "前程无忧主动投递", "highest_education": "本科",
     "school": "同济大学", "major": "计算机科学与技术", "graduation_year": 2020,
     "expected_salary": 15000, "available_date": date_str(10), "status": "new",
     "tags": ["Java", "Spring Cloud", "Docker"],
     "notes": "4年Java开发，目前在平安科技，期望换环境",
     "created_by": TINA, "created_at": iso(0)},

    # --- screening (筛选中) ---
    {"candidate_name": "李思琪", "gender": "女", "phone": "13800138004", "email": "lisiqi@example.com",
     "source": "boss_zhipin", "source_detail": "BOSS直聘主动投递", "highest_education": "本科在读",
     "school": "上海师范大学", "major": "人力资源管理", "graduation_year": 2027,
     "expected_salary": 4500, "available_date": date_str(5), "status": "screening",
     "tags": ["人力资源", "Excel", "细心"],
     "notes": "大三在读，每周可实习4天，有社团管理经验，简历已通过初筛",
     "created_by": TINA, "created_at": iso(-3)},

    {"candidate_name": "周小雅", "gender": "女", "phone": "13800138005", "email": "zhouxiaoya@example.com",
     "source": "other", "source_detail": "实习僧投递", "highest_education": "本科在读",
     "school": "复旦大学", "major": "行政管理", "graduation_year": 2027,
     "expected_salary": 5000, "available_date": date_str(8), "status": "screening",
     "tags": ["行政", "沟通能力", "学生会"],
     "notes": "大三在读，学生会副主席，沟通能力强，简历正在HR评估中",
     "created_by": TINA, "created_at": iso(-4)},

    {"candidate_name": "吴晨光", "gender": "男", "phone": "13800138006", "email": "wuchenguang@example.com",
     "source": "internal_referral", "source_detail": "王妤扬推荐", "highest_education": "本科",
     "school": "华东师范大学", "major": "软件工程", "graduation_year": 2021,
     "expected_salary": 17000, "available_date": date_str(18), "status": "screening",
     "tags": ["React", "TypeScript", "Ant Design"],
     "notes": "3年前端开发经验，内推候选人，有完整后台管理系统开发经验",
     "created_by": TINA, "created_at": iso(-2)},

    # --- interviewing_first (一面中) ---
    {"candidate_name": "郑雨桐", "gender": "女", "phone": "13800138007", "email": "zhengyutong@example.com",
     "source": "boss_zhipin", "source_detail": "BOSS直聘主动投递", "highest_education": "本科",
     "school": "上海大学", "major": "数字媒体技术", "graduation_year": 2022,
     "expected_salary": 15000, "available_date": date_str(12), "status": "interviewing_first",
     "tags": ["Vue", "React", "ECharts"],
     "notes": "2年前端经验，在饿了么做过商家端后台，一面已安排",
     "created_by": TINA, "created_at": iso(-5)},

    {"candidate_name": "王浩然", "gender": "男", "phone": "13800138008", "email": "wanghaoran@example.com",
     "source": "boss_zhipin", "source_detail": "BOSS直聘主动投递", "highest_education": "硕士",
     "school": "上海交通大学", "major": "计算机科学与技术", "graduation_year": 2023,
     "expected_salary": 18000, "available_date": date_str(22), "status": "interviewing_first",
     "tags": ["Java", "Kafka", "微服务", "硕士"],
     "notes": "硕士应届，有字节跳动实习经验，参与过广告投放系统开发，一面已安排",
     "created_by": TINA, "created_at": iso(-6)},

    # --- interviewing_second (二面中) ---
    {"candidate_name": "陈明远", "gender": "男", "phone": "13800138009", "email": "chenmingyuan@example.com",
     "source": "internal_referral", "source_detail": "Jenny推荐", "highest_education": "硕士",
     "school": "浙江大学", "major": "计算机科学与技术", "graduation_year": 2022,
     "expected_salary": 20000, "available_date": date_str(3), "status": "interviewing_second",
     "tags": ["Java", "微服务", "高并发", "阿里背景"],
     "notes": "硕士学历，阿里P6级别，因家庭原因回上海发展，一面已通过",
     "created_by": TINA, "created_at": iso(-10)},

    {"candidate_name": "刘思雨", "gender": "女", "phone": "13800138010", "email": "liushiyu@example.com",
     "source": "boss_zhipin", "source_detail": "BOSS直聘主动投递", "highest_education": "本科",
     "school": "南京大学", "major": "人力资源管理", "graduation_year": 2021,
     "expected_salary": 5000, "available_date": date_str(7), "status": "interviewing_second",
     "tags": ["HR", "招聘", "培训"],
     "notes": "3年HR经验，有招聘和培训模块实操经验，一面表现优秀",
     "created_by": TINA, "created_at": iso(-8)},

    # --- interviewing_final (终面中) ---
    {"candidate_name": "张一凡", "gender": "男", "phone": "13800138011", "email": "zhangyifan@example.com",
     "source": "boss_zhipin", "source_detail": "BOSS直聘主动投递", "highest_education": "本科",
     "school": "复旦大学", "major": "软件工程", "graduation_year": 2020,
     "expected_salary": 19000, "available_date": date_str(5), "status": "interviewing_final",
     "tags": ["React", "TypeScript", "Next.js", "大厂背景"],
     "notes": "4年前端经验，曾在美团工作，一二面均获好评，终面已安排",
     "created_by": TINA, "created_at": iso(-12)},

    {"candidate_name": "黄佳琳", "gender": "女", "phone": "13800138012", "email": "huangjialin@example.com",
     "source": "internal_referral", "source_detail": "HR部门同事推荐", "highest_education": "硕士",
     "school": "华东师范大学", "major": "人力资源管理", "graduation_year": 2022,
     "expected_salary": 13000, "available_date": date_str(10), "status": "interviewing_final",
     "tags": ["HRBP", "组织发展", "硕士"],
     "notes": "硕士学历，2年HRBP经验，有组织发展和人才盘点经验",
     "created_by": TINA, "created_at": iso(-14)},

    # --- pending_offer (待发Offer) ---
    {"candidate_name": "杨瑞峰", "gender": "男", "phone": "13800138013", "email": "yangruifeng@example.com",
     "source": "boss_zhipin", "source_detail": "BOSS直聘主动投递", "highest_education": "本科",
     "school": "华中科技大学", "major": "计算机科学与技术", "graduation_year": 2021,
     "expected_salary": 16000, "available_date": date_str(3), "status": "pending_offer",
     "tags": ["Java", "Python", "数据分析"],
     "notes": "三轮面试全部通过，技术能力强，薪资在预算范围内，等待发起Offer审批",
     "created_by": TINA, "created_at": iso(-16)},

    # --- offered (已发Offer) ---
    {"candidate_name": "林小曼", "gender": "女", "phone": "13800138014", "email": "linxiaoman@example.com",
     "source": "boss_zhipin", "source_detail": "BOSS直聘主动投递", "highest_education": "本科",
     "school": "南京大学", "major": "人力资源管理", "graduation_year": 2021,
     "expected_salary": 4500, "available_date": date_str(-2), "status": "offered",
     "tags": ["HR", "招聘", "细心"],
     "notes": "HR实习生岗位，已发Offer，等待候选人回复",
     "created_by": TINA, "created_at": iso(-20)},

    # --- accepted (已接受) ---
    {"candidate_name": "马骏飞", "gender": "男", "phone": "13800138015", "email": "majunfei@example.com",
     "source": "other", "source_detail": "前程无忧主动投递", "highest_education": "本科",
     "school": "合肥工业大学", "major": "计算机科学与技术", "graduation_year": 2020,
     "expected_salary": 14000, "available_date": date_str(-5), "status": "accepted",
     "tags": ["Java", "Spring", "MyBatis"],
     "notes": "已接受Offer，预计下周入职，需要安排入职准备工作",
     "created_by": TINA, "created_at": iso(-25)},

    # --- rejected (不录取) ---
    {"candidate_name": "赵小云", "gender": "女", "phone": "13800138016", "email": "zhaoxiaoyun@example.com",
     "source": "boss_zhipin", "source_detail": "BOSS直聘主动投递", "highest_education": "大专",
     "school": "上海出版印刷高等专科学校", "major": "数字出版", "graduation_year": 2022,
     "expected_salary": 6000, "available_date": date_str(-10), "status": "rejected",
     "tags": ["设计", "排版"],
     "notes": "学历和技能不匹配UI/UX岗位要求，简历筛选阶段淘汰",
     "created_by": TINA, "created_at": iso(-30)},

    {"candidate_name": "陈刚", "gender": "男", "phone": "13800138017", "email": "chengang@example.com",
     "source": "boss_zhipin", "source_detail": "BOSS直聘主动投递", "highest_education": "本科",
     "school": "西安电子科技大学", "major": "通信工程", "graduation_year": 2019,
     "expected_salary": 12000, "available_date": date_str(-8), "status": "rejected",
     "tags": ["Java", "通信"],
     "notes": "一面技术面未通过，Java基础和框架理解不扎实",
     "created_by": TINA, "created_at": iso(-22)},

    # --- withdrawn (候选人放弃) ---
    {"candidate_name": "张伟", "gender": "男", "phone": "13800138018", "email": "zhangwei@example.com",
     "source": "boss_zhipin", "source_detail": "BOSS直聘主动投递", "highest_education": "本科",
     "school": "东南大学", "major": "软件工程", "graduation_year": 2020,
     "expected_salary": 18000, "available_date": date_str(-15), "status": "withdrawn",
     "tags": ["前端", "React"],
     "notes": "二面通过后，候选人因个人原因放弃，已接受其他公司Offer",
     "created_by": TINA, "created_at": iso(-28)},

    {"candidate_name": "王芳", "gender": "女", "phone": "13800138019", "email": "wangfang@example.com",
     "source": "other", "source_detail": "猎聘主动投递", "highest_education": "硕士",
     "school": "武汉大学", "major": "法学", "graduation_year": 2020,
     "expected_salary": 18000, "available_date": date_str(-12), "status": "withdrawn",
     "tags": ["法务", "合同", "硕士"],
     "notes": "一面安排后候选人主动放弃，已在原公司获得晋升机会",
     "created_by": TINA, "created_at": iso(-20)},
]

resume_ids = {}
for r_data in resumes:
    rid = str(uuid.uuid4())
    r_data["id"] = rid
    r_data["updated_at"] = r_data["created_at"]
    r = post('resumes', r_data)
    if r:
        resume_ids[r_data['candidate_name']] = r['id']
        print(f"  [{r_data['status']}] {r_data['candidate_name']} ({r_data['source']}) - OK")
    else:
        resume_ids[r_data['candidate_name']] = rid

# ============================================================
# 4. 面试记录（覆盖所有轮次和结果）
# ============================================================
print("\n" + "=" * 60)
print("创建面试记录...")

def add_iv(name, round_, days, loc, ivs, result, fb):
    rid = resume_ids.get(name)
    if not rid:
        print(f"  SKIP {name} - no resume_id")
        return None
    iv = {
        "id": str(uuid.uuid4()), "resume_id": rid, "round": round_,
        "scheduled_at": iso(days), "location": loc, "interviewers": ivs,
        "result": result, "feedback": fb, "created_by": TINA,
        "created_at": iso(days-1), "updated_at": iso(days-1),
    }
    r = post('interviews', iv)
    status = 'OK' if r else 'FAIL'
    print(f"  {name} {round_}轮 [{result}] - {status}")
    return r

# --- 郑雨桐: 一面待面试 ---
add_iv("郑雨桐", "first", 2, "公司3楼会议室A", [TINA], "pending", "")

# --- 王浩然: 一面待面试 ---
add_iv("王浩然", "first", 3, "公司3楼会议室B", [TINA], "pending", "")

# --- 陈明远: 一面通过 → 二面待面试 ---
add_iv("陈明远", "first", -4, "公司3楼会议室A", [TINA], "passed",
       "候选人Java基础扎实，有阿里P6背景，技术能力符合岗位要求，建议进入二面")

# --- 刘思雨: 一面通过 → 二面待面试 ---
add_iv("刘思雨", "first", -3, "人事部办公室", [TINA], "passed",
       "HR专业背景扎实，沟通表达清晰，对招聘流程熟悉，建议进入二面")

# --- 张一凡: 一面通过 → 二面通过 → 终面待面试 ---
add_iv("张一凡", "first", -8, "公司3楼会议室A", [TINA], "passed",
       "前端技术能力突出，React生态熟悉，有美团工作经验，建议进入二面")
add_iv("张一凡", "second", -5, "公司3楼会议室B", [SHAUN], "passed",
       "架构设计能力强，组件封装规范，对前端性能优化有深入理解，建议终面")

# --- 黄佳琳: 一面通过 → 二面通过 → 终面待面试 ---
add_iv("黄佳琳", "first", -10, "人事部办公室", [TINA], "passed",
       "HRBP经验丰富，硕士学历，对组织发展有见解，建议进入二面")
add_iv("黄佳琳", "second", -7, "人事部办公室", [SHAUN], "passed",
       "人才盘点方法论扎实，有过从0到1搭建体系的经验，建议终面")

# --- 杨瑞峰: 一面通过 → 二面通过 → 三面通过（待发Offer） ---
add_iv("杨瑞峰", "first", -12, "公司3楼会议室A", [TINA], "passed",
       "技术全面，Java和Python双栈，有数据分析项目经验，建议进入二面")
add_iv("杨瑞峰", "second", -9, "公司3楼会议室B", [SHAUN], "passed",
       "系统设计思路清晰，对微服务架构理解深刻，沟通能力优秀，建议终面")
add_iv("杨瑞峰", "final", -6, "总裁办公室", [JENNY, SHAUN], "passed",
       "综合素质优秀，价值观与公司匹配，同意录用，建议发放Offer")

# --- 林小曼: 一面通过 → 二面通过 → 终面通过 ---
add_iv("林小曼", "first", -18, "人事部办公室", [TINA], "passed",
       "态度端正，对HR工作有热情，Excel技能熟练，建议进入二面")
add_iv("林小曼", "second", -15, "人事部办公室", [SHAUN], "passed",
       "学习能力强，沟通表达清晰，对人事管理有基本认知，建议终面")
add_iv("林小曼", "final", -12, "总裁办公室", [JENNY], "passed",
       "实习生岗位匹配度高，综合素质良好，同意录用")

# --- 马骏飞: 一面通过 → 二面通过 → 终面通过 ---
add_iv("马骏飞", "first", -22, "公司3楼会议室A", [TINA], "passed",
       "Java基础扎实，Spring全家桶熟练，对HRO系统有兴趣，建议进入二面")
add_iv("马骏飞", "second", -19, "公司3楼会议室B", [SHAUN], "passed",
       "项目经验丰富，有独立负责模块开发的能力，建议终面")
add_iv("马骏飞", "final", -16, "总裁办公室", [JENNY, SHAUN], "passed",
       "技术能力达标，薪资预期合理，同意录用")

# --- 赵小云: 未面试直接淘汰 ---
# (status=rejected 在简历筛选阶段)

# --- 陈刚: 一面未通过 ---
add_iv("陈刚", "first", -18, "公司3楼会议室A", [TINA], "failed",
       "Java基础不够扎实，Spring底层原理回答模糊，多线程和JVM调优经验不足")

# --- 张伟: 一面通过 → 二面通过 → 候选人放弃 ---
add_iv("张伟", "first", -24, "公司3楼会议室A", [TINA], "passed",
       "前端基础扎实，React和TypeScript熟练，有中大型项目经验，建议进入二面")
add_iv("张伟", "second", -21, "公司3楼会议室B", [SHAUN], "passed",
       "架构思维好，组件设计规范，沟通能力优秀，建议终面")

# --- 王芳: 一面取消（候选人主动放弃） ---
add_iv("王芳", "first", -16, "公司3楼会议室A", [TINA], "cancelled",
       "候选人面试前通知已在原公司获得晋升机会，主动放弃面试")

# ============================================================
# 5. 求职申请表 (job_applications)
# ============================================================
print("\n" + "=" * 60)
print("创建求职申请表（覆盖各审批状态）...")

apps = [
    # draft - 草稿（候选人正在填写）
    {"id": str(uuid.uuid4()), "application_no": "APP-2026001",
     "resume_id": resume_ids.get("张一凡"), "status": "draft",
     "created_at": iso(-7)},

    # submitted - 已提交
    {"id": str(uuid.uuid4()), "application_no": "APP-2026002",
     "resume_id": resume_ids.get("黄佳琳"), "status": "submitted",
     "created_at": iso(-6)},

    # hr_reviewed - HR已审核
    {"id": str(uuid.uuid4()), "application_no": "APP-2026003",
     "resume_id": resume_ids.get("杨瑞峰"), "status": "hr_reviewed",
     "bu_head_id": SHAUN, "created_at": iso(-5)},

    # dept_reviewed - 部门已审核
    {"id": str(uuid.uuid4()), "application_no": "APP-2026004",
     "resume_id": resume_ids.get("林小曼"), "status": "dept_reviewed",
     "bu_head_id": SHAUN, "bu_head_approved": True, "bu_head_approved_at": iso(-13),
     "hr_approved": True, "hr_approver_id": TINA, "hr_approved_at": iso(-12),
     "created_at": iso(-15)},

    # final_reviewed - 终审通过
    {"id": str(uuid.uuid4()), "application_no": "APP-2026005",
     "resume_id": resume_ids.get("马骏飞"), "status": "final_reviewed",
     "bu_head_id": SHAUN, "bu_head_approved": True, "bu_head_approved_at": iso(-17),
     "hr_approved": True, "hr_approver_id": TINA, "hr_approved_at": iso(-16),
     "final_approved": True, "final_approver_id": JENNY, "final_approved_at": iso(-15),
     "created_at": iso(-19)},

    # rejected - 已拒绝
    {"id": str(uuid.uuid4()), "application_no": "APP-2026006",
     "resume_id": resume_ids.get("陈刚"), "status": "rejected",
     "bu_head_id": SHAUN, "created_at": iso(-20)},
]

app_ids = {}
for app in apps:
    r = post('job_applications', app)
    if r:
        app_ids[app['application_no']] = r['id']
        print(f"  {app['application_no']} [{app['status']}] - OK")
    else:
        app_ids[app['application_no']] = app['id']

# ============================================================
# 6. Offer管理（覆盖所有status）
# ============================================================
print("\n" + "=" * 60)
print("创建Offer记录（全状态覆盖）...")

offers = [
    # draft - 草稿
    {"id": str(uuid.uuid4()), "offer_no": "OF-2026001",
     "application_id": app_ids.get("APP-2026003"),
     "candidate_name": "杨瑞峰", "candidate_email": "yangruifeng@example.com",
     "position_name": "Java开发工程师", "grade": "P2", "report_to": "王妤扬",
     "monthly_salary": 16000, "start_date": date_str(14), "probation_period": "6个月",
     "report_time": "9:00", "report_location": "上海市普陀区XX路XX号3楼",
     "status": "draft", "created_by": TINA, "created_at": iso(-3)},

    # pending_send - 待发送
    {"id": str(uuid.uuid4()), "offer_no": "OF-2026002",
     "application_id": app_ids.get("APP-2026004"),
     "candidate_name": "林小曼", "candidate_email": "linxiaoman@example.com",
     "position_name": "HR实习生", "grade": "实习", "report_to": "黄一萧",
     "monthly_salary": 4500, "start_date": date_str(5), "probation_period": "无（实习期3个月）",
     "report_time": "9:00", "report_location": "上海市普陀区XX路XX号3楼",
     "status": "pending_send", "created_by": TINA, "created_at": iso(-10)},

    # sent - 已发送
    {"id": str(uuid.uuid4()), "offer_no": "OF-2026003",
     "application_id": app_ids.get("APP-2026005"),
     "candidate_name": "马骏飞", "candidate_email": "majunfei@example.com",
     "position_name": "Java开发工程师", "grade": "P2", "report_to": "王妤扬",
     "monthly_salary": 14000, "start_date": date_str(-3), "probation_period": "6个月",
     "report_time": "9:00", "report_location": "上海市普陀区XX路XX号3楼",
     "status": "sent", "created_by": TINA,
     "sent_at": iso(-14), "reply_deadline": iso(-7), "created_at": iso(-16)},

    # delivered - 已送达
    {"id": str(uuid.uuid4()), "offer_no": "OF-2026004",
     "application_id": app_ids.get("APP-2026004"),
     "candidate_name": "林小曼(旧)", "candidate_email": "linxiaoman_old@example.com",
     "position_name": "HR实习生", "grade": "实习",
     "monthly_salary": 4000, "start_date": date_str(-20),
     "status": "delivered", "created_by": TINA,
     "sent_at": iso(-22), "reply_deadline": iso(-15), "created_at": iso(-24)},

    # accepted - 已接受
    {"id": str(uuid.uuid4()), "offer_no": "OF-2026005",
     "application_id": app_ids.get("APP-2026005"),
     "candidate_name": "马骏飞(已接受)", "candidate_email": "majunfei@example.com",
     "position_name": "Java开发工程师", "grade": "P2",
     "monthly_salary": 14000, "start_date": date_str(-5),
     "status": "accepted", "created_by": TINA,
     "sent_at": iso(-20), "reply_deadline": iso(-13), "replied_at": iso(-18),
     "onboarding_confirmed": True, "confirmed_by": TINA, "confirmed_at": iso(-18),
     "created_at": iso(-22)},

    # rejected - 已拒绝
    {"id": str(uuid.uuid4()), "offer_no": "OF-2026006",
     "application_id": app_ids.get("APP-2026005"),
     "candidate_name": "张三(示例)", "candidate_email": "zhangsan@example.com",
     "position_name": "前端开发工程师", "grade": "P2",
     "monthly_salary": 15000, "start_date": date_str(-30),
     "status": "rejected", "created_by": TINA,
     "sent_at": iso(-32), "reply_deadline": iso(-25), "replied_at": iso(-30),
     "reply_content": "薪资未达预期，已接受其他公司Offer，感谢贵司的认可",
     "created_at": iso(-34)},

    # expired - 已过期
    {"id": str(uuid.uuid4()), "offer_no": "OF-2026007",
     "application_id": app_ids.get("APP-2026004"),
     "candidate_name": "李四(过期)", "candidate_email": "lisi@example.com",
     "position_name": "行政专员", "grade": "P1",
     "monthly_salary": 8000, "start_date": date_str(-45),
     "status": "expired", "created_by": TINA,
     "sent_at": iso(-50), "reply_deadline": iso(-43), "created_at": iso(-52)},

    # revoked - 已撤回
    {"id": str(uuid.uuid4()), "offer_no": "OF-2026008",
     "application_id": app_ids.get("APP-2026005"),
     "candidate_name": "王五(撤回)", "candidate_email": "wangwu@example.com",
     "position_name": "Java开发工程师", "grade": "P2",
     "monthly_salary": 13000, "start_date": date_str(-40),
     "status": "revoked", "created_by": TINA,
     "sent_at": iso(-42), "reply_deadline": iso(-35), "created_at": iso(-44)},
]

for offer in offers:
    r = post('offers', offer)
    print(f"  {offer['offer_no']} [{offer['status']}] {offer['candidate_name']} - {'OK' if r else 'FAIL'}")

# ============================================================
# 7. 审批记录（覆盖pending/approved/rejected）
# ============================================================
print("\n" + "=" * 60)
print("创建审批记录（全状态覆盖）...")

approvals = [
    # 招聘需求审批 - approved
    {"id": str(uuid.uuid4()), "module": "recruitment",
     "record_id": req_ids["REQ-2026005"], "step_order": 1,
     "step_name": "招聘需求审批", "approver_id": JENNY, "approver_role": "super_admin",
     "status": "approved", "opinion": "同意，尽快推进招聘",
     "approved_at": iso(-10), "created_at": iso(-12)},

    # 招聘需求审批 - rejected
    {"id": str(uuid.uuid4()), "module": "recruitment",
     "record_id": req_ids["REQ-2026006"], "step_order": 1,
     "step_name": "招聘需求审批", "approver_id": JENNY, "approver_role": "super_admin",
     "status": "rejected", "opinion": "行政总监岗位暂不需要，当前行政部编制已满，请重新评估",
     "approved_at": iso(-13), "created_at": iso(-15)},

    # 招聘需求审批 - pending（法务专员在终审中）
    {"id": str(uuid.uuid4()), "module": "recruitment",
     "record_id": req_ids["REQ-2026004"], "step_order": 1,
     "step_name": "招聘需求审批", "approver_id": JENNY, "approver_role": "super_admin",
     "status": "pending", "created_at": iso(-8)},

    # 已发布需求的审批
    {"id": str(uuid.uuid4()), "module": "recruitment",
     "record_id": req_ids["REQ-2026007"], "step_order": 1,
     "step_name": "招聘需求审批", "approver_id": JENNY, "approver_role": "super_admin",
     "status": "approved", "opinion": "同意，暑期实习生尽快到位",
     "approved_at": iso(-14), "created_at": iso(-16)},

    # 已关闭需求的审批
    {"id": str(uuid.uuid4()), "module": "recruitment",
     "record_id": req_ids["REQ-2026008"], "step_order": 1,
     "step_name": "招聘需求审批", "approver_id": JENNY, "approver_role": "super_admin",
     "status": "approved", "opinion": "同意，财务部确实需要增援",
     "approved_at": iso(-38), "created_at": iso(-40)},

    # Offer审批 - approved
    {"id": str(uuid.uuid4()), "module": "recruitment",
     "record_id": app_ids.get("APP-2026005"), "step_order": 1,
     "step_name": "Offer审批", "approver_id": JENNY, "approver_role": "super_admin",
     "status": "approved", "opinion": "薪资在预算范围内，同意发放Offer",
     "approved_at": iso(-15), "created_at": iso(-17)},

    # Offer审批 - pending
    {"id": str(uuid.uuid4()), "module": "recruitment",
     "record_id": app_ids.get("APP-2026003"), "step_order": 1,
     "step_name": "Offer审批", "approver_id": JENNY, "approver_role": "super_admin",
     "status": "pending", "created_at": iso(-5)},

    # Offer审批 - rejected（示例）
    {"id": str(uuid.uuid4()), "module": "recruitment",
     "record_id": app_ids.get("APP-2026006"), "step_order": 1,
     "step_name": "Offer审批", "approver_id": JENNY, "approver_role": "super_admin",
     "status": "rejected", "opinion": "候选人技术面未通过，不予录用",
     "approved_at": iso(-18), "created_at": iso(-20)},
]

for app in approvals:
    r = post('approval_records', app)
    print(f"  [{app['status']}] {app['step_name']} - {'OK' if r else 'FAIL'}")

# ============================================================
# 汇总
# ============================================================
print("\n" + "=" * 60)
print("招聘管理虚拟数据填充完成！")
print("=" * 60)
print(f"  招聘需求:    8条  (draft/pending_dept/pending_hr/pending_final/approved/rejected/published/closed)")
print(f"  简历库:     20份  (new:3 / screening:3 / iv_first:2 / iv_second:2 / iv_final:2 / pending_offer:1 / offered:1 / accepted:1 / rejected:2 / withdrawn:2)")
print(f"  面试记录:   20+条 (pending/passed/failed/cancelled 全覆盖)")
print(f"  求职申请表:   6条  (draft/submitted/hr_reviewed/dept_reviewed/final_reviewed/rejected)")
print(f"  Offer:       8条  (draft/pending_send/sent/delivered/accepted/rejected/expired/revoked)")
print(f"  审批记录:     8条  (pending/approved/rejected)")
print(f"\n  来源覆盖: boss_zhipin / internal_referral / email / other")
print(f"  学历覆盖: 大专 / 本科 / 硕士 / 本科在读")
