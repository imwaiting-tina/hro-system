import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Typography, Card, Modal, Form,
  Select, Input, InputNumber, DatePicker, Divider, Descriptions,
  Steps, message, Badge, Row, Col, Alert,
} from 'antd';
import {
  PlusOutlined, SwapOutlined, UserOutlined,
  CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore, canEdit, canApprove } from '../../stores/authStore';
import supabase from '../../utils/supabase';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// ─── 流动原因枚举 ───────────────────────────────────────────────
const TRANSFER_REASONS = [
  { value: 'salary_adjust', label: '薪酬调整' },
  { value: 're_grade', label: '重新定级' },
  { value: 'promotion', label: '晋升' },
  { value: 'dev_transfer', label: '开发流动' },
  { value: 'market_adjust', label: '市场调整' },
  { value: 'transfer', label: '调动' },
  { value: 'other', label: '其他（需补充）' },
];

const GRADE_OPTIONS = ['I', 'II', 'III', 'IV', 'V'];

// ─── 审批步骤配置 ───────────────────────────────────────────────
const APPROVAL_STEPS = [
  { title: '流出部门负责人', description: '审批变动申请' },
  { title: '流入部门负责人', description: '确认接收' },
  { title: '人事负责人', description: '人事审批' },
  { title: 'Jenny', description: '终审确认' },
];

// ─── 状态映射 ───────────────────────────────────────────────────
const statusMap: Record<string, { color: string; label: string; step: number }> = {
  pending:          { color: 'processing', label: '流出部门审批中', step: 0 },
  approved_dept_out:{ color: 'processing', label: '流入部门审批中', step: 1 },
  approved_dept_in: { color: 'processing', label: '人事审批中',     step: 2 },
  approved_hr:      { color: 'processing', label: 'Jenny终审中',    step: 3 },
  completed:        { color: 'success',    label: '已完成',          step: 4 },
  rejected:         { color: 'error',      label: '已拒绝',          step: -1 },
};

const reasonLabel = (v: string) =>
  TRANSFER_REASONS.find((r) => r.value === v)?.label || v;

// ─── 主组件 ─────────────────────────────────────────────────────
const TransferPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    const { data: result } = await supabase
      .from('employee_transfers')
      .select('*')
      .order('created_at', { ascending: false });
    if (result) setData(result);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // ── 新建提交 ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        employee_id:         values.employee_name,
        transfer_type:       values.reason,
        from_position:       values.from_position,
        to_position:         values.to_position,
        from_department:     values.from_department,
        to_department:       values.to_department,
        from_manager:        values.from_manager,
        to_manager:          values.to_manager,
        from_grade:          values.from_grade,
        to_grade:            values.to_grade,
        from_area:           values.from_area,
        to_area:             values.to_area,
        from_salary:         values.from_salary,
        to_salary:           values.to_salary,
        effective_date:      values.effective_date?.format('YYYY-MM-DD'),
        transfer_reason:     values.transfer_reason,
        key_actions:         values.key_actions,
        status:              'pending',
        created_by:          user?.display_name,
      };
      const { error } = await supabase.from('employee_transfers').insert(payload);
      if (error) throw error;
      message.success('流动申请已发起，等待流出部门负责人审批');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (e: any) {
      if (e?.errorFields) return; // 表单校验失败
      message.error('提交失败：' + (e.message || '未知错误'));
    }
  };

  // ── 审批操作 ──────────────────────────────────────────────────
  const nextStatus: Record<string, string> = {
    pending:           'approved_dept_out',
    approved_dept_out: 'approved_dept_in',
    approved_dept_in:  'approved_hr',
    approved_hr:       'completed',
  };

  const handleApprove = async (record: any) => {
    const next = nextStatus[record.status];
    if (!next) return;
    await supabase.from('employee_transfers').update({ status: next }).eq('id', record.id);
    message.success('审批通过');
    fetchData();
    if (detailRecord?.id === record.id) setDetailRecord({ ...detailRecord, status: next });
  };

  const handleReject = async (record: any) => {
    await supabase.from('employee_transfers').update({ status: 'rejected' }).eq('id', record.id);
    message.warning('已拒绝');
    fetchData();
    if (detailRecord?.id === record.id) setDetailRecord({ ...detailRecord, status: 'rejected' });
  };

  // ── 表格列 ────────────────────────────────────────────────────
  const columns = [
    { title: '员工', dataIndex: 'employee_id', width: 100, ellipsis: true },
    {
      title: '流动原因',
      dataIndex: 'transfer_type',
      width: 110,
      render: (v: string) => reasonLabel(v),
    },
    {
      title: '原职位 → 新职位',
      width: 180,
      render: (_: any, r: any) =>
        <Text><Text type="secondary">{r.from_position || '-'}</Text> → <Text strong>{r.to_position || '-'}</Text></Text>,
    },
    {
      title: '薪酬变动',
      width: 150,
      render: (_: any, r: any) =>
        r.from_salary || r.to_salary
          ? <Text>{r.from_salary ? `¥${r.from_salary}` : '-'} → {r.to_salary ? `¥${r.to_salary}` : '-'}</Text>
          : <Text type="secondary">-</Text>,
    },
    { title: '生效日期', dataIndex: 'effective_date', width: 110 },
    {
      title: '审批状态',
      dataIndex: 'status',
      width: 130,
      render: (v: string) => {
        const s = statusMap[v] || { color: 'default', label: v, step: 0 };
        return <Badge status={s.color as any} text={s.label} />;
      },
    },
    {
      title: '操作',
      width: 160,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" onClick={() => setDetailRecord(record)}>详情</Button>
          {record.status !== 'completed' && record.status !== 'rejected' && user && canApprove(user.role) && (
            <>
              <Button size="small" type="primary" onClick={() => handleApprove(record)}>通过</Button>
              <Button size="small" danger onClick={() => handleReject(record)}>拒绝</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  // ── 当前审批步骤 ──────────────────────────────────────────────
  const currentStep = detailRecord ? (statusMap[detailRecord.status]?.step ?? 0) : 0;

  return (
    <div>
      {/* ── 页头 ── */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>员工流动</Title>
          <Text type="secondary">管理员工调岗、调薪、晋升、重新定级等变动，由人事专员发起，四级审批流转</Text>
        </div>
        {user && canEdit(user.role) && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            新建流动申请
          </Button>
        )}
      </div>

      {/* ── 审批流程说明 ── */}
      <Card size="small" style={{ marginBottom: 16, background: '#f0f5ff', border: '1px solid #adc6ff' }}>
        <Row align="middle" gutter={8}>
          <Col flex="none"><SwapOutlined style={{ color: '#1890ff', fontSize: 16 }} /></Col>
          <Col flex="auto">
            <Text strong style={{ marginRight: 8 }}>审批流程：</Text>
            {APPROVAL_STEPS.map((s, i) => (
              <span key={i}>
                <Tag color={i === APPROVAL_STEPS.length - 1 ? 'red' : 'blue'}>{s.title}</Tag>
                {i < APPROVAL_STEPS.length - 1 && <Text type="secondary" style={{ marginRight: 4 }}>→</Text>}
              </span>
            ))}
          </Col>
        </Row>
      </Card>

      {/* ── 数据表格 ── */}
      <Card>
        <div className="table-toolbar" style={{ marginBottom: 12 }}>
          <Text strong>共 {data.length} 条流动记录</Text>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {/* ── 新建表单 Modal ── */}
      <Modal
        title={<Space><SwapOutlined /><span>新建员工流动申请</span></Space>}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        okText="提交申请"
        cancelText="取消"
        width={760}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          message="由人事专员填写后发起，系统自动推送至流出部门负责人审批"
          style={{ marginBottom: 16 }}
        />
        <Form form={form} layout="vertical" requiredMark="optional">
          <Divider orientation="left" orientationMargin={0}><Text strong>基本信息（必填）</Text></Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="employee_name" label="员工姓名" rules={[{ required: true, message: '请输入员工姓名' }]}>
                <Input prefix={<UserOutlined />} placeholder="请输入员工姓名（花名册选择）" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reason" label="员工流动原因" rules={[{ required: true, message: '请选择流动原因' }]}>
                <Select placeholder="请选择">
                  {TRANSFER_REASONS.map((r) => <Option key={r.value} value={r.value}>{r.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="from_manager" label="主管经理" rules={[{ required: true, message: '请输入主管经理' }]}>
                <Input placeholder="花名册选择" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="to_manager" label="新主管" rules={[{ required: true, message: '请输入新主管' }]}>
                <Input placeholder="花名册选择" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="from_position" label="目前职位" rules={[{ required: true }]}>
                <Input placeholder="当前职位名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="to_position" label="新职位" rules={[{ required: true }]}>
                <Input placeholder="变动后职位名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="from_department" label="目前部门" rules={[{ required: true }]}>
                <Input placeholder="部门选择" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="to_department" label="新部门" rules={[{ required: true }]}>
                <Input placeholder="部门选择" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="from_grade" label="目前级别">
                <Select placeholder="I–V 级">
                  {GRADE_OPTIONS.map((g) => <Option key={g} value={g}>{g} 级</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="to_grade" label="新级别">
                <Select placeholder="I–V 级">
                  {GRADE_OPTIONS.map((g) => <Option key={g} value={g}>{g} 级</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" orientationMargin={0}><Text type="secondary">补充信息（选填）</Text></Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="from_area" label="目前区域">
                <Input placeholder="如：上海" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="to_area" label="新区域">
                <Input placeholder="如：香港" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="from_salary" label="目前薪酬（元/月）">
                <InputNumber style={{ width: '100%' }} placeholder="数字" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="to_salary" label="新薪酬（元/月）">
                <InputNumber style={{ width: '100%' }} placeholder="数字" min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="effective_date" label="变动生效日期">
                <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="transfer_reason" label="建议流动的原因">
            <Input.TextArea rows={2} placeholder="简要说明" />
          </Form.Item>
          <Form.Item name="key_actions" label="执行变动的关键行动">
            <Input.TextArea rows={2} placeholder="关键行动或注意事项" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── 详情 Drawer ── */}
      <Modal
        title={<Space><CheckCircleOutlined /><span>流动申请详情</span></Space>}
        open={!!detailRecord}
        onCancel={() => setDetailRecord(null)}
        footer={
          detailRecord && detailRecord.status !== 'completed' && detailRecord.status !== 'rejected' && user && canApprove(user.role)
            ? [
                <Button key="reject" danger onClick={() => handleReject(detailRecord)}>拒绝</Button>,
                <Button key="approve" type="primary" onClick={() => handleApprove(detailRecord)}>
                  {detailRecord.status === 'approved_hr' ? 'Jenny 终审通过' : '审批通过'}
                </Button>,
              ]
            : [<Button key="close" onClick={() => setDetailRecord(null)}>关闭</Button>]
        }
        width={680}
        destroyOnClose
      >
        {detailRecord && (
          <>
            {/* 审批进度 */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Steps
                size="small"
                current={currentStep}
                status={detailRecord.status === 'rejected' ? 'error' : currentStep >= 4 ? 'finish' : 'process'}
                items={APPROVAL_STEPS.map((s) => ({
                  title: s.title,
                  description: s.description,
                  icon: currentStep > APPROVAL_STEPS.indexOf(s)
                    ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    : <ClockCircleOutlined />,
                }))}
              />
            </Card>

            {/* 字段信息 */}
            <Descriptions bordered size="small" column={2} labelStyle={{ width: 120 }}>
              <Descriptions.Item label="员工姓名" span={1}>{detailRecord.employee_id}</Descriptions.Item>
              <Descriptions.Item label="流动原因" span={1}>
                <Tag color="blue">{reasonLabel(detailRecord.transfer_type)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="目前职位">{detailRecord.from_position || '-'}</Descriptions.Item>
              <Descriptions.Item label="新职位"><Text strong>{detailRecord.to_position || '-'}</Text></Descriptions.Item>
              <Descriptions.Item label="目前部门">{detailRecord.from_department || '-'}</Descriptions.Item>
              <Descriptions.Item label="新部门">{detailRecord.to_department || '-'}</Descriptions.Item>
              <Descriptions.Item label="主管经理">{detailRecord.from_manager || '-'}</Descriptions.Item>
              <Descriptions.Item label="新主管">{detailRecord.to_manager || '-'}</Descriptions.Item>
              <Descriptions.Item label="目前级别">{detailRecord.from_grade ? `${detailRecord.from_grade} 级` : '-'}</Descriptions.Item>
              <Descriptions.Item label="新级别">{detailRecord.to_grade ? `${detailRecord.to_grade} 级` : '-'}</Descriptions.Item>
              <Descriptions.Item label="目前区域">{detailRecord.from_area || '-'}</Descriptions.Item>
              <Descriptions.Item label="新区域">{detailRecord.to_area || '-'}</Descriptions.Item>
              <Descriptions.Item label="目前薪酬">{detailRecord.from_salary ? `¥${detailRecord.from_salary}/月` : '-'}</Descriptions.Item>
              <Descriptions.Item label="新薪酬">{detailRecord.to_salary ? `¥${detailRecord.to_salary}/月` : '-'}</Descriptions.Item>
              <Descriptions.Item label="生效日期" span={2}>{detailRecord.effective_date || '-'}</Descriptions.Item>
              {detailRecord.transfer_reason && (
                <Descriptions.Item label="流动原因说明" span={2}>{detailRecord.transfer_reason}</Descriptions.Item>
              )}
              {detailRecord.key_actions && (
                <Descriptions.Item label="关键行动" span={2}>{detailRecord.key_actions}</Descriptions.Item>
              )}
              <Descriptions.Item label="发起人">{detailRecord.created_by || '-'}</Descriptions.Item>
              <Descriptions.Item label="发起时间">
                {detailRecord.created_at ? dayjs(detailRecord.created_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* 角色权限说明 */}
            <Divider orientation="left" style={{ marginTop: 20 }}>角色权限</Divider>
            <Table
              size="small"
              pagination={false}
              dataSource={[
                { role: '人事专员', perm: '填写并发起表单；可保存草稿；选择审批线（系统自动匹配流出/流入部门负责人）' },
                { role: '部门负责人', perm: '仅查看自己部门的流动信息，并审批' },
                { role: '人事负责人', perm: '可查看所有流动信息，并进行人事审批' },
                { role: 'Jenny', perm: '可查看所有流动信息，并进行最终审批' },
              ]}
              columns={[
                { title: '角色', dataIndex: 'role', width: 120,
                  render: (v: string) => <Tag color={v === 'Jenny' ? 'red' : v === '人事专员' ? 'blue' : v === '人事负责人' ? 'orange' : 'green'}>{v}</Tag> },
                { title: '操作权限', dataIndex: 'perm' },
              ]}
              rowKey="role"
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default TransferPage;
