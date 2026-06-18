import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Modal, Form, Input, Select, InputNumber,
  DatePicker, message, Typography, Card, Popconfirm, Descriptions, Radio,
  Steps, Timeline
} from 'antd';
import {
  PlusOutlined, EyeOutlined, EditOutlined, SendOutlined,
  CheckOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import { useAuthStore, canEdit, canApprove } from '../../../stores/authStore';
import RecruitmentNav from '../../../components/RecruitmentNav';
import supabase from '../../../utils/supabase';
import type { RecruitmentStatus } from '../../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusMap: Record<RecruitmentStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  pending_dept: { label: '待部门负责人审批', color: 'processing' },
  pending_hr: { label: '待人事负责人审批', color: 'warning' },
  pending_final: { label: '待Jenny终审', color: 'warning' },
  approved: { label: '已批准', color: 'success' },
  rejected: { label: '已驳回', color: 'error' },
  published: { label: '已发布', color: 'blue' },
  closed: { label: '已关闭', color: 'default' },
};

// 学历可选项
const educationOptions = [
  { label: '博士', value: '博士' },
  { label: '硕士', value: '硕士' },
  { label: '本科', value: '本科' },
  { label: '大专', value: '大专' },
  { label: '不限', value: '不限' },
];

// 性别可选项
const genderOptions = [
  { label: '男', value: '男' },
  { label: '女', value: '女' },
  { label: '不限', value: '不限' },
];

// 招聘原因可选项
const recruitmentReasonOptions = [
  { label: '业务扩大', value: '业务扩大' },
  { label: '员工离职', value: '员工离职' },
  { label: '新设职位', value: '新设职位' },
  { label: '其他', value: '其他' },
];

// 工作经历可选项
const workExperienceOptions = [
  { label: '一年', value: '一年' },
  { label: '两年', value: '两年' },
  { label: '三年', value: '三年' },
  { label: '五年', value: '五年' },
  { label: '十年', value: '十年' },
  { label: '其他', value: '其他' },
];

// 户籍可选项
const hukouOptions = [
  { label: '上海', value: '上海' },
  { label: '非上海人', value: '非上海人' },
  { label: '不限', value: '不限' },
];

// 部门可选项
const departmentOptions = [
  { label: '上海总部', value: '上海总部' },
  { label: '香港办公室', value: '香港办公室' },
  { label: '财务部', value: '财务部' },
  { label: '行政部', value: '行政部' },
  { label: '技术部', value: '技术部' },
  { label: '保安组', value: '保安组' },
  { label: '保洁组', value: '保洁组' },
];

const DemandPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [form] = Form.useForm();

  // 驳回弹窗
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectRecord, setRejectRecord] = useState<any>(null);
  const [rejectForm] = Form.useForm();

  // 跟踪招聘原因和工作经历是否选了"其他"
  const [reasonOther, setReasonOther] = useState(false);
  const [experienceOther, setExperienceOther] = useState(false);
  // 跟踪性别选择，用于显示年龄范围
  const [genderValue, setGenderValue] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const { data: result, error } = await supabase
      .from('recruitment_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && result) {
      setData(result);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // ============ 审批流程操作 ============

  // 提交审批：草稿 → 待部门负责人审批
  const handleSubmitApproval = async (record: any) => {
    await supabase
      .from('recruitment_requests')
      .update({
        status: 'pending_dept',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', record.id);
    message.success('已提交审批，等待部门负责人审批');
    fetchData();
  };

  // 批准：推进到下一级
  const handleApprove = async (record: any) => {
    const currentStatus = record.status;
    let nextStatus: RecruitmentStatus;
    let approverField = '';

    if (currentStatus === 'pending_dept') {
      nextStatus = 'pending_hr';
      approverField = 'dept_approved_at';
    } else if (currentStatus === 'pending_hr') {
      nextStatus = 'pending_final';
      approverField = 'hr_approved_at';
    } else if (currentStatus === 'pending_final') {
      nextStatus = 'approved';
      approverField = 'final_approved_at';
    } else {
      return;
    }

    const updateData: any = {
      status: nextStatus,
      [approverField]: new Date().toISOString(),
    };

    // 终审通过时，同步至人事端
    if (currentStatus === 'pending_final') {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = user?.id;
    }

    await supabase
      .from('recruitment_requests')
      .update(updateData)
      .eq('id', record.id);

    if (currentStatus === 'pending_final') {
      message.success('终审通过！需求已生效，已同步至人事端');
    } else {
      message.success('审批通过，已进入下一级审批');
    }
    fetchData();
  };

  // 打开驳回弹窗
  const openRejectModal = (record: any) => {
    setRejectRecord(record);
    rejectForm.resetFields();
    setRejectModalVisible(true);
  };

  // 确认驳回：退回申请人
  const handleRejectConfirm = async () => {
    try {
      const values = await rejectForm.validateFields();
      const rejectReason = values.reject_reason;

      await supabase
        .from('recruitment_requests')
        .update({
          status: 'rejected',
          reject_reason: rejectReason,
          rejected_at: new Date().toISOString(),
          rejected_by: user?.id,
        })
        .eq('id', rejectRecord.id);

      message.success(`已驳回，已退回申请人（原因：${rejectReason}）`);
      setRejectModalVisible(false);
      setRejectRecord(null);
      fetchData();
    } catch {
      // 验证失败，不关闭弹窗
    }
  };

  // 发布：已批准 → 已发布
  const handlePublish = async (record: any) => {
    await supabase
      .from('recruitment_requests')
      .update({ status: 'published' })
      .eq('id', record.id);
    message.success('需求已发布');
    fetchData();
  };

  // ============ 表单操作 ============

  const handleSubmit = async (values: any) => {
    // 处理性别要求 - 多选存储为逗号分隔字符串
    const genderArr = values.gender_requirement || [];
    const genderStr = Array.isArray(genderArr) ? genderArr.join('、') : genderArr;

    // 处理学历要求 - 多选存储为逗号分隔字符串
    const eduArr = values.education_requirement || [];
    const eduStr = Array.isArray(eduArr) ? eduArr.join('、') : eduArr;

    // 构建薪酬范围
    const salaryRange = values.salary_range_min && values.salary_range_max
      ? `${values.salary_range_min}-${values.salary_range_max}`
      : values.salary_range_min || values.salary_range_max || '';

    const payload = {
      department: values.department || null,
      position_name: values.position_name,
      quantity: values.quantity,
      grade: values.grade || null,
      salary_range: salaryRange,
      salary_range_min: values.salary_range_min || null,
      salary_range_max: values.salary_range_max || null,
      annual_budget: values.annual_budget || null,
      expected_onboard_date: values.expected_onboard_date ? values.expected_onboard_date.format('YYYY-MM-DD') : null,
      recruitment_reason: values.recruitment_reason || null,
      recruitment_reason_other: values.recruitment_reason_other || null,
      gender_requirement: genderStr,
      gender_age_range: values.gender_age_range || null,
      education_requirement: eduStr,
      work_experience: values.work_experience || null,
      work_experience_other: values.work_experience_other || null,
      hukou_requirement: values.hukou_requirement || null,
      preferred_major: values.preferred_major || null,
      certificate_requirement: values.certificate_requirement || null,
      other_requirements: values.other_requirements || null,
      brief_job_description: values.brief_job_description || null,
      request_no: editingRecord?.request_no || `REQ-${Date.now()}`,
      created_by: editingRecord?.created_by || user?.id,
      status: editingRecord?.status || 'draft',
    };

    if (editingRecord) {
      await supabase.from('recruitment_requests').update(payload).eq('id', editingRecord.id);
      message.success('更新成功');
    } else {
      await supabase.from('recruitment_requests').insert(payload);
      message.success('创建成功，填写完成后提交发布，进入审批流程');
    }

    setModalVisible(false);
    form.resetFields();
    setEditingRecord(null);
    setReasonOther(false);
    setExperienceOther(false);
    setGenderValue([]);
    fetchData();
  };

  const openEdit = (record: any) => {
    setEditingRecord(record);
    // 反解析多选字段
    const genderArr = record.gender_requirement ? record.gender_requirement.split('、') : [];
    const eduArr = record.education_requirement ? record.education_requirement.split('、') : [];
    setGenderValue(genderArr);
    setReasonOther(record.recruitment_reason === '其他');
    setExperienceOther(record.work_experience === '其他');

    form.setFieldsValue({
      ...record,
      gender_requirement: genderArr,
      education_requirement: eduArr,
      expected_onboard_date: record.expected_onboard_date ? dayjs(record.expected_onboard_date) : undefined,
      annual_budget: record.annual_budget,
    });
    setModalVisible(true);
  };

  const openCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    // 自动带出当前部门
    if (user?.department) {
      form.setFieldValue('department', user.department);
    }
    setReasonOther(false);
    setExperienceOther(false);
    setGenderValue([]);
    setModalVisible(true);
  };

  // 性别选择变化时处理
  const onGenderChange = (val: string[]) => {
    setGenderValue(val || []);
  };

  // ============ 审批流程 Steps 计算 ============

  // 计算审批流程当前步骤
  const getApprovalStep = (status: string): number => {
    const stepMap: Record<string, number> = {
      draft: -1,
      pending_dept: 0,
      pending_hr: 1,
      pending_final: 2,
      approved: 3,
      rejected: -1,
      published: 3,
      closed: 3,
    };
    return stepMap[status] ?? -1;
  };

  // 构建审批流程时间线
  const getApprovalTimeline = (record: any) => {
    const items: any[] = [];

    items.push({
      label: '提交审批',
      status: 'done' as const,
      time: record.submitted_at,
      desc: '申请人提交招聘需求审批',
    });

    // 第一级：部门负责人审批
    if (record.status === 'pending_dept') {
      items.push({ label: '部门负责人审批', status: 'process' as const, time: null, desc: '等待部门负责人审批' });
    } else if (record.status === 'rejected' && !record.hr_approved_at) {
      items.push({ label: '部门负责人审批', status: 'error' as const, time: record.rejected_at, desc: `驳回：${record.reject_reason || '-'}` });
    } else {
      items.push({ label: '部门负责人审批', status: 'done' as const, time: record.dept_approved_at, desc: '批准，进入下一级' });
    }

    // 第二级：人事负责人审批
    if (record.status === 'pending_hr') {
      items.push({ label: '人事负责人审批', status: 'process' as const, time: null, desc: '等待人事负责人审批' });
    } else if (['pending_final', 'approved', 'published'].includes(record.status)) {
      items.push({ label: '人事负责人审批', status: 'done' as const, time: record.hr_approved_at, desc: '批准，进入下一级' });
    } else if (record.status === 'rejected' && record.dept_approved_at && !record.hr_approved_at) {
      items.push({ label: '人事负责人审批', status: 'error' as const, time: record.rejected_at, desc: `驳回：${record.reject_reason || '-'}` });
    }

    // 第三级：最高负责人 Jenny 审批
    if (record.status === 'pending_final') {
      items.push({ label: 'Jenny终审', status: 'process' as const, time: null, desc: '等待Jenny最终审批' });
    } else if (['approved', 'published'].includes(record.status)) {
      items.push({ label: 'Jenny终审', status: 'done' as const, time: record.final_approved_at, desc: '终审通过，需求生效' });
    } else if (record.status === 'rejected' && record.hr_approved_at && !record.final_approved_at) {
      items.push({ label: 'Jenny终审', status: 'error' as const, time: record.rejected_at, desc: `驳回：${record.reject_reason || '-'}` });
    }

    return items;
  };

  // ============ 表格列定义 ============

  const columns = [
    {
      title: '需求编号',
      dataIndex: 'request_no',
      width: 140,
    },
    {
      title: '申请部门',
      dataIndex: 'department',
      width: 100,
    },
    {
      title: '招聘职位',
      dataIndex: 'position_name',
      width: 160,
    },
    {
      title: '招聘人数',
      dataIndex: 'quantity',
      width: 80,
    },
    {
      title: '建议职级',
      dataIndex: 'grade',
      width: 80,
    },
    {
      title: '薪酬范围',
      dataIndex: 'salary_range',
      width: 140,
      render: (v: string) => v || '-',
    },
    {
      title: '期望到岗',
      dataIndex: 'expected_onboard_date',
      width: 110,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 140,
      render: (status: RecruitmentStatus) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.label}</Tag>
      ),
    },
    {
      title: '操作',
      width: 340,
      render: (_: any, record: any) => (
        <Space size="small" wrap>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setSelectedRecord(record); setDetailVisible(true); }}>
            详情
          </Button>

          {/* 草稿状态：编辑 + 提交审批 */}
          {canEdit(user!.role) && record.status === 'draft' && (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
                编辑
              </Button>
              <Popconfirm title="确认提交审批？" description="提交后将进入三级审批流程" onConfirm={() => handleSubmitApproval(record)}>
                <Button size="small" type="primary" icon={<SendOutlined />}>
                  提交审批
                </Button>
              </Popconfirm>
            </>
          )}

          {/* 第一级：部门负责人审批 */}
          {canApprove(user!.role) && record.status === 'pending_dept' && (
            <>
              <Popconfirm title="确认批准？" description="批准后将进入人事负责人审批" onConfirm={() => handleApprove(record)}>
                <Button size="small" type="primary" icon={<CheckOutlined />}>
                  批准
                </Button>
              </Popconfirm>
              <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => openRejectModal(record)}>
                驳回
              </Button>
            </>
          )}

          {/* 第二级：人事负责人审批 */}
          {canApprove(user!.role) && record.status === 'pending_hr' && (
            <>
              <Popconfirm title="确认批准？" description="批准后将进入Jenny终审" onConfirm={() => handleApprove(record)}>
                <Button size="small" type="primary" icon={<CheckOutlined />}>
                  批准
                </Button>
              </Popconfirm>
              <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => openRejectModal(record)}>
                驳回
              </Button>
            </>
          )}

          {/* 第三级：最高负责人 Jenny 终审 */}
          {user?.role === 'super_admin' && record.status === 'pending_final' && (
            <>
              <Popconfirm title="确认终审通过？" description="终审通过后需求生效，同步至人事端" onConfirm={() => handleApprove(record)}>
                <Button size="small" type="primary" icon={<CheckOutlined />}>
                  终审通过
                </Button>
              </Popconfirm>
              <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => openRejectModal(record)}>
                驳回
              </Button>
            </>
          )}

          {/* 已批准：发布 */}
          {record.status === 'approved' && canEdit(user!.role) && (
            <Button size="small" icon={<SendOutlined />} onClick={() => handlePublish(record)}>
              发布
            </Button>
          )}

          {/* 已驳回：可重新编辑提交 */}
          {canEdit(user!.role) && record.status === 'rejected' && (
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
              修改重新提交
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // ============ 详情弹窗渲染辅助 ============

  const renderReason = (record: any) => {
    if (!record.recruitment_reason) return '-';
    if (record.recruitment_reason === '其他' && record.recruitment_reason_other) {
      return `其他：${record.recruitment_reason_other}`;
    }
    return record.recruitment_reason;
  };

  const renderExperience = (record: any) => {
    if (!record.work_experience) return '-';
    if (record.work_experience === '其他' && record.work_experience_other) {
      return `其他：${record.work_experience_other}`;
    }
    return record.work_experience;
  };

  const renderGender = (record: any) => {
    if (!record.gender_requirement) return '-';
    let text = record.gender_requirement;
    if (record.gender_age_range) {
      text += `（年龄范围：${record.gender_age_range}）`;
    }
    return text;
  };

  const fmtTime = (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : null;

  return (
    <div>
      <RecruitmentNav />
      <div className="page-header">
        <Title level={2}>招聘需求管理</Title>
        <Text type="secondary">发布和管理招聘需求，包含《聘用员工申请表》的三级审批流程</Text>
      </div>

      <Card>
        <div className="table-toolbar">
          <Text strong>共 {data.length} 条记录</Text>
          {canEdit(user!.role) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新建招聘需求
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300 }}
        />
      </Card>

      {/* 新建/编辑弹窗 — 《聘用员工申请表》 */}
      <Modal
        title={editingRecord ? '编辑招聘需求' : '新建招聘需求 —— 《聘用员工申请表》'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); setEditingRecord(null); setReasonOther(false); setExperienceOther(false); setGenderValue([]); }}
        onOk={() => form.submit()}
        width={900}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>

          {/* ==================== 表2-1 基础信息字段 ==================== */}
          <Card size="small" title="表2-1  基础信息" style={{ marginBottom: 16 }}>
            <Space size="large" wrap>
              {/* 申请部门 — 下拉选择，自动带出当前部门 */}
              <Form.Item name="department" label="申请部门" tooltip="自动带出当前部门">
                <Select
                  style={{ width: 180 }}
                  options={departmentOptions}
                  placeholder="选择部门"
                />
              </Form.Item>

              {/* 招聘职位 — 文本输入 */}
              <Form.Item name="position_name" label="招聘职位" rules={[{ required: true, message: '请填写岗位名称' }]} tooltip="填写具体岗位名称">
                <Input style={{ width: 200 }} placeholder="如：财务/账务助理" />
              </Form.Item>

              {/* 招聘人数 — 数字输入 */}
              <Form.Item name="quantity" label="招聘人数" rules={[{ required: true, message: '请填写招聘人数' }]} tooltip="该岗位计划招聘人数">
                <InputNumber min={1} style={{ width: 120 }} />
              </Form.Item>

              {/* 建议职级 — 文本输入 */}
              <Form.Item name="grade" label="建议职级" tooltip="期望的职级范围">
                <Input style={{ width: 160 }} placeholder="如：P级 / M级" />
              </Form.Item>
            </Space>

            <Space size="large" wrap>
              {/* 薪酬范围 — 数字格式，税前月薪范围 */}
              <Form.Item name="salary_range_min" label="薪酬范围（最低）" tooltip="税前月薪范围">
                <InputNumber min={0} style={{ width: 160 }} prefix="¥" placeholder="最低月薪" />
              </Form.Item>
              <Form.Item label="薪酬范围（最高）">
                <InputNumber min={0} style={{ width: 160 }} prefix="¥" placeholder="最高月薪" name="salary_range_max" />
              </Form.Item>

              {/* 年度预算内 — 单选 */}
              <Form.Item name="annual_budget" label="年度预算内" tooltip="是否在年度预算范围内">
                <Radio.Group>
                  <Radio value="yes">是</Radio>
                  <Radio value="no">否</Radio>
                </Radio.Group>
              </Form.Item>

              {/* 期望到岗时间 — 日期选择 */}
              <Form.Item name="expected_onboard_date" label="期望到岗时间" tooltip="期望新人入职日期">
                <DatePicker style={{ width: 180 }} />
              </Form.Item>
            </Space>
          </Card>

          {/* ==================== 表2-2 招聘条件字段 ==================== */}
          <Card size="small" title="表2-2  招聘条件" style={{ marginBottom: 16 }}>
            {/* 招聘原因 — 单选 */}
            <Form.Item name="recruitment_reason" label="招聘原因">
              <Select
                style={{ width: 300 }}
                options={recruitmentReasonOptions}
                placeholder="请选择招聘原因"
                onChange={(val) => setReasonOther(val === '其他')}
              />
            </Form.Item>
            {reasonOther && (
              <Form.Item name="recruitment_reason_other" label="招聘原因补充说明" rules={[{ required: true, message: '请补充说明招聘原因' }]}>
                <TextArea rows={2} placeholder="请补充说明招聘原因" style={{ width: 400 }} />
              </Form.Item>
            )}

            {/* 性别要求 — 多选，选男/女需填写年龄范围 */}
            <Form.Item name="gender_requirement" label="性别要求" tooltip="选择男/女需填写年龄范围">
              <Select
                mode="multiple"
                style={{ width: 300 }}
                options={genderOptions}
                placeholder="请选择性别要求（可多选）"
                onChange={onGenderChange}
              />
            </Form.Item>
            {(genderValue.includes('男') || genderValue.includes('女')) && (
              <Form.Item name="gender_age_range" label="年龄范围（男/女）" tooltip="填写年龄范围，如：25-35岁">
                <Input style={{ width: 300 }} placeholder="如：男 25-35岁，女 25-30岁" />
              </Form.Item>
            )}

            {/* 学历要求 — 多选 */}
            <Form.Item name="education_requirement" label="学历要求">
              <Select
                mode="multiple"
                style={{ width: 300 }}
                options={educationOptions}
                placeholder="请选择学历要求（可多选）"
              />
            </Form.Item>

            {/* 工作经历 — 单选 */}
            <Form.Item name="work_experience" label="工作经历">
              <Select
                style={{ width: 200 }}
                options={workExperienceOptions}
                placeholder="请选择工作经历要求"
                onChange={(val) => setExperienceOther(val === '其他')}
              />
            </Form.Item>
            {experienceOther && (
              <Form.Item name="work_experience_other" label="工作经历补充说明" rules={[{ required: true, message: '请补充说明工作经历要求' }]}>
                <Input style={{ width: 400 }} placeholder="请补充说明工作经历要求" />
              </Form.Item>
            )}

            {/* 户籍要求 — 单选 */}
            <Form.Item name="hukou_requirement" label="户籍要求">
              <Select
                style={{ width: 200 }}
                options={hukouOptions}
                placeholder="请选择户籍要求"
              />
            </Form.Item>

            {/* 优先专业 — 富文本 */}
            <Form.Item name="preferred_major" label="优先专业" tooltip="可填写多个优先专业">
              <TextArea rows={2} placeholder="如：财务管理、会计学、审计学等" style={{ width: 400 }} />
            </Form.Item>

            {/* 证书要求 — 富文本 */}
            <Form.Item name="certificate_requirement" label="证书要求" tooltip="岗位所需资格证书">
              <TextArea rows={2} placeholder="如：注册会计师证、中级会计职称等" style={{ width: 400 }} />
            </Form.Item>

            {/* 其他要求 — 富文本 */}
            <Form.Item name="other_requirements" label="其他要求" tooltip="补充招聘条件">
              <TextArea rows={2} placeholder="其他补充要求" style={{ width: 400 }} />
            </Form.Item>

            {/* 职位描述 — 富文本 */}
            <Form.Item name="brief_job_description" label="职位描述" tooltip="岗位职责与工作内容简述">
              <TextArea rows={3} placeholder="岗位职责与工作内容简述" style={{ width: 500 }} />
            </Form.Item>
          </Card>

          <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
            填写完成后，提交发布，进入审批流程。
          </Text>
        </Form>
      </Modal>

      {/* 驳回弹窗 */}
      <Modal
        title="驳回招聘需求"
        open={rejectModalVisible}
        onCancel={() => { setRejectModalVisible(false); setRejectRecord(null); }}
        onOk={handleRejectConfirm}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
        width={500}
      >
        {rejectRecord && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="需求编号">{rejectRecord.request_no}</Descriptions.Item>
                <Descriptions.Item label="招聘职位">{rejectRecord.position_name}</Descriptions.Item>
                <Descriptions.Item label="当前审批级">
                  {rejectRecord.status === 'pending_dept' && '部门负责人审批'}
                  {rejectRecord.status === 'pending_hr' && '人事负责人审批'}
                  {rejectRecord.status === 'pending_final' && 'Jenny终审'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
            <Form form={rejectForm} layout="vertical">
              <Form.Item
                name="reject_reason"
                label="驳回原因"
                rules={[{ required: true, message: '请填写驳回原因' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="请填写驳回原因，将退回申请人"
                  showCount
                  maxLength={200}
                />
              </Form.Item>
            </Form>
            <Text type="secondary">驳回后需求将退回申请人，申请人可修改后重新提交。</Text>
          </div>
        )}
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="招聘需求详情 —— 《聘用员工申请表》"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={850}
      >
        {selectedRecord && (
          <>
            {/* 基础信息卡片 */}
            <Card size="small" title="基础信息" style={{ marginBottom: 12 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="需求编号">{selectedRecord.request_no}</Descriptions.Item>
                <Descriptions.Item label="申请部门">{selectedRecord.department || '-'}</Descriptions.Item>
                <Descriptions.Item label="招聘职位">{selectedRecord.position_name}</Descriptions.Item>
                <Descriptions.Item label="招聘人数">{selectedRecord.quantity}</Descriptions.Item>
                <Descriptions.Item label="建议职级">{selectedRecord.grade || '-'}</Descriptions.Item>
                <Descriptions.Item label="薪酬范围">{selectedRecord.salary_range || '-'}</Descriptions.Item>
                <Descriptions.Item label="年度预算内">
                  {selectedRecord.annual_budget === 'yes' ? '是' : selectedRecord.annual_budget === 'no' ? '否' : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="期望到岗时间">
                  {selectedRecord.expected_onboard_date ? dayjs(selectedRecord.expected_onboard_date).format('YYYY-MM-DD') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="状态" span={2}>
                  <Tag color={statusMap[selectedRecord.status as RecruitmentStatus]?.color}>
                    {statusMap[selectedRecord.status as RecruitmentStatus]?.label}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 招聘条件卡片 */}
            <Card size="small" title="招聘条件" style={{ marginBottom: 12 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="招聘原因" span={2}>{renderReason(selectedRecord)}</Descriptions.Item>
                <Descriptions.Item label="性别要求" span={2}>{renderGender(selectedRecord)}</Descriptions.Item>
                <Descriptions.Item label="学历要求" span={2}>{selectedRecord.education_requirement || '-'}</Descriptions.Item>
                <Descriptions.Item label="工作经历" span={2}>{renderExperience(selectedRecord)}</Descriptions.Item>
                <Descriptions.Item label="户籍要求">{selectedRecord.hukou_requirement || '-'}</Descriptions.Item>
                <Descriptions.Item label="优先专业">{selectedRecord.preferred_major || '-'}</Descriptions.Item>
                <Descriptions.Item label="证书要求" span={2}>{selectedRecord.certificate_requirement || '-'}</Descriptions.Item>
                <Descriptions.Item label="其他要求" span={2}>{selectedRecord.other_requirements || '-'}</Descriptions.Item>
                <Descriptions.Item label="职位描述" span={2}>{selectedRecord.brief_job_description || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 审批流程卡片 */}
            <Card
              size="small"
              title={
                <Space>
                  <span>审批流程</span>
                  {selectedRecord.status === 'rejected' && (
                    <Tag color="error">已驳回</Tag>
                  )}
                  {selectedRecord.status === 'approved' && (
                    <Tag color="success">已批准</Tag>
                  )}
                  {selectedRecord.status === 'published' && (
                    <Tag color="blue">已发布</Tag>
                  )}
                </Space>
              }
            >
              <Steps
                current={getApprovalStep(selectedRecord.status)}
                status={selectedRecord.status === 'rejected' ? 'error' : 'process'}
                direction="vertical"
                size="small"
                items={[
                  {
                    title: '部门负责人审批',
                    description: selectedRecord.dept_approved_at
                      ? `已批准 · ${fmtTime(selectedRecord.dept_approved_at)}`
                      : selectedRecord.status === 'pending_dept'
                        ? '待审批中...'
                        : '等待中',
                  },
                  {
                    title: '人事负责人审批',
                    description: selectedRecord.hr_approved_at
                      ? `已批准 · ${fmtTime(selectedRecord.hr_approved_at)}`
                      : selectedRecord.status === 'pending_hr'
                        ? '待审批中...'
                        : '等待中',
                  },
                  {
                    title: 'Jenny终审',
                    description: selectedRecord.final_approved_at
                      ? `终审通过 · ${fmtTime(selectedRecord.final_approved_at)}`
                      : selectedRecord.status === 'pending_final'
                        ? '待终审中...'
                        : '等待中',
                  },
                ]}
              />

              {/* 驳回信息 */}
              {selectedRecord.status === 'rejected' && (
                <div style={{ marginTop: 16, padding: 12, background: '#fff2f0', borderRadius: 6, border: '1px solid #ffccc7' }}>
                  <Text strong style={{ color: '#ff4d4f' }}>
                    <CloseCircleOutlined /> 驳回原因
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Text>{selectedRecord.reject_reason || '未填写'}</Text>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      驳回时间：{fmtTime(selectedRecord.rejected_at) || '-'}
                    </Text>
                  </div>
                </div>
              )}

              {/* 终审通过信息 */}
              {selectedRecord.status === 'approved' && (
                <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
                  <Text strong style={{ color: '#52c41a' }}>
                    <CheckOutlined /> 需求已生效
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      批准时间：{fmtTime(selectedRecord.approved_at) || '-'} · 已同步至人事端
                    </Text>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}
      </Modal>
    </div>
  );
};

export default DemandPage;
