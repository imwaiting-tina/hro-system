import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Modal, Form, Input, Select, InputNumber,
  DatePicker, message, Typography, Card, Steps, Descriptions, Tabs, Popconfirm
} from 'antd';
import { PlusOutlined, EyeOutlined, CheckCircleOutlined, SwapOutlined } from '@ant-design/icons';
import { useAuthStore, canEdit, canApprove } from '../../stores/authStore';
import supabase from '../../utils/supabase';
import type { EvaluationStatus, RenewalStatus } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const EmploymentPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState('evaluation');

  return (
    <div>
      <div className="page-header">
        <Title level={2}>在职管理</Title>
        <Text type="secondary">试用期评估、实习生转正、续签管理、员工流动</Text>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'evaluation',
          label: '试用期/实习评估',
          children: <EvaluationTab user={user!} />,
        },
        {
          key: 'renewal',
          label: '续签管理',
          children: <RenewalTab user={user!} />,
        },
        {
          key: 'transfer',
          label: '员工流动',
          children: <TransferTab user={user!} />,
        },
        {
          key: 'employees',
          label: '员工档案',
          children: <EmployeeListTab user={user!} />,
        },
      ]} />
    </div>
  );
};

// ===== 试用期评估 Tab =====
const EvaluationTab: React.FC<{ user: any }> = ({ user }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    const { data: result } = await supabase
      .from('probation_evaluations')
      .select('*')
      .order('created_at', { ascending: false });
    if (result) setData(result);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (id: string, level: string) => {
    const updates: any = {};
    if (level === 'bu') { updates.bu_head_signed = true; updates.bu_head_signed_at = new Date().toISOString(); updates.status = 'pending_hr'; }
    else if (level === 'hr') { updates.hr_signed = true; updates.hr_signed_at = new Date().toISOString(); updates.status = 'pending_final'; }
    else if (level === 'final') { updates.final_signed = true; updates.final_signed_at = new Date().toISOString(); updates.status = 'completed'; }

    await supabase.from('probation_evaluations').update(updates).eq('id', id);
    message.success('审批完成');
    fetchData();
  };

  const columns = [
    { title: '员工ID', dataIndex: 'employee_id', width: 120, ellipsis: true },
    { title: '评估类型', dataIndex: 'evaluation_type', width: 100,
      render: (v: string) => v === 'internship' ? '实习评估' : '试用期评估' },
    { title: '员工自评', dataIndex: 'employee_signed', width: 80,
      render: (v: boolean) => v ? <Tag color="success">已完成</Tag> : <Tag>待完成</Tag> },
    { title: '部门评分', dataIndex: 'dept_supervisor_comment', width: 150, ellipsis: true },
    { title: '定岗', dataIndex: 'confirmed_position', width: 100 },
    { title: '定薪', dataIndex: 'confirmed_salary', width: 100,
      render: (v: number) => v ? `¥${v.toLocaleString()}` : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (status: EvaluationStatus) => {
        const map: Record<string, { label: string; color: string }> = {
          pending_employee: { label: '待员工自评', color: 'default' },
          pending_dept: { label: '待部门评估', color: 'processing' },
          pending_bu: { label: '待BU审批', color: 'warning' },
          pending_hr: { label: '待HR审批', color: 'warning' },
          pending_final: { label: '待终审', color: 'warning' },
          completed: { label: '已完成', color: 'success' },
        };
        return <Tag color={map[status]?.color}>{map[status]?.label}</Tag>;
      },
    },
    {
      title: '操作',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'pending_bu' && canApprove(user.role) && (
            <Button size="small" type="primary" onClick={() => handleApprove(record.id, 'bu')}>BU审批</Button>
          )}
          {record.status === 'pending_hr' && canApprove(user.role) && (
            <Button size="small" type="primary" onClick={() => handleApprove(record.id, 'hr')}>HR审批</Button>
          )}
          {record.status === 'pending_final' && user.role === 'super_admin' && (
            <Button size="small" type="primary" onClick={() => handleApprove(record.id, 'final')}>终审通过</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div className="table-toolbar">
        <Text strong>共 {data.length} 条评估记录</Text>
        {canEdit(user.role) && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true); }}>
            新建评估
          </Button>
        )}
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title="新建评估" open={modalVisible} onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()} width={500}>
        <Form form={form} layout="vertical" onFinish={async (values) => {
          await supabase.from('probation_evaluations').insert({ ...values, status: 'pending_employee' });
          message.success('创建成功');
          setModalVisible(false);
          fetchData();
        }}>
          <Form.Item name="employee_id" label="员工ID" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="evaluation_type" label="评估类型" rules={[{ required: true }]}>
            <Select options={[{ label: '试用期评估', value: 'probation' }, { label: '实习评估', value: 'internship' }]} />
          </Form.Item>
          <Form.Item name="confirmed_position" label="定岗"><Input /></Form.Item>
          <Form.Item name="confirmed_salary" label="定薪"><InputNumber min={0} prefix="¥" style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

// ===== 续签管理 Tab =====
const RenewalTab: React.FC<{ user: any }> = ({ user }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: result } = await supabase
      .from('contract_renewals')
      .select('*')
      .order('created_at', { ascending: false });
    if (result) setData(result);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (id: string, level: string) => {
    const updates: any = {};
    if (level === 'bu') { updates.bu_head_signed = true; updates.bu_head_signed_at = new Date().toISOString(); updates.status = 'pending_hr'; }
    else if (level === 'hr') { updates.hr_signed = true; updates.hr_signed_at = new Date().toISOString(); updates.status = 'pending_final'; }
    else if (level === 'final') { updates.final_signed = true; updates.final_signed_at = new Date().toISOString(); updates.status = 'approved'; }

    await supabase.from('contract_renewals').update(updates).eq('id', id);
    message.success('审批完成');
    fetchData();
  };

  const columns = [
    { title: '员工ID', dataIndex: 'employee_id', width: 120, ellipsis: true },
    { title: '续签类型', dataIndex: 'renewal_type', width: 120,
      render: (v: string) => v === 'labor_contract' ? '劳动合同续签' : '劳务协议续签' },
    { title: '原合同到期', dataIndex: 'original_contract_end', width: 110 },
    { title: '新合同开始', dataIndex: 'new_contract_start', width: 110 },
    { title: '新合同结束', dataIndex: 'new_contract_end', width: 110 },
    { title: '新薪资', dataIndex: 'new_salary', width: 100,
      render: (v: number) => v ? `¥${v.toLocaleString()}` : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: RenewalStatus) => {
        const map: Record<string, { label: string; color: string }> = {
          pending_employee: { label: '待员工确认', color: 'default' },
          pending_bu: { label: '待BU审批', color: 'warning' },
          pending_hr: { label: '待HR审批', color: 'warning' },
          pending_final: { label: '待终审', color: 'warning' },
          approved: { label: '已批准', color: 'success' },
          completed: { label: '已完成', color: 'success' },
        };
        return <Tag color={map[status]?.color}>{map[status]?.label}</Tag>;
      },
    },
    {
      title: '操作',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'pending_bu' && canApprove(user.role) && (
            <Button size="small" type="primary" onClick={() => handleApprove(record.id, 'bu')}>BU审批</Button>
          )}
          {record.status === 'pending_hr' && canApprove(user.role) && (
            <Button size="small" type="primary" onClick={() => handleApprove(record.id, 'hr')}>HR审批</Button>
          )}
          {record.status === 'pending_final' && user.role === 'super_admin' && (
            <Button size="small" type="primary" onClick={() => handleApprove(record.id, 'final')}>终审通过</Button>
          )}
          {record.status === 'approved' && canEdit(user.role) && (
            <Button size="small" onClick={() => handleApprove(record.id, 'completed')}>完成</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div className="table-toolbar">
        <Text strong>共 {data.length} 条续签记录</Text>
        {canEdit(user.role) && (
          <Button type="primary" icon={<PlusOutlined />} onClick={async () => {
            // 简单新增
            await supabase.from('contract_renewals').insert({
              employee_id: 'new',
              renewal_type: 'labor_contract',
              status: 'pending_employee',
            });
            message.success('创建成功');
            fetchData();
          }}>
            新建续签
          </Button>
        )}
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
    </Card>
  );
};

// ===== 员工流动 Tab =====
const TransferTab: React.FC<{ user: any }> = ({ user }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  const columns = [
    { title: '员工ID', dataIndex: 'employee_id', width: 120, ellipsis: true },
    { title: '变动类型', dataIndex: 'transfer_type', width: 100,
      render: (v: string) => {
        const map: Record<string, string> = { transfer: '调岗', promotion: '晋升', salary_adjust: '调薪', re_grade: '重新定级' };
        return map[v] || v;
      }},
    { title: '原部门→新部门', width: 160, render: (_: any, r: any) => `${r.from_position || '-'} → ${r.to_position || '-'}` },
    { title: '原薪资→新薪资', width: 160, render: (_: any, r: any) =>
      `${r.from_salary ? '¥' + r.from_salary : '-'} → ${r.to_salary ? '¥' + r.to_salary : '-'}` },
    { title: '生效日期', dataIndex: 'effective_date', width: 110 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: string) => v === 'completed' ? <Tag color="success">已完成</Tag> : <Tag color="warning">审批中</Tag>,
    },
    {
      title: '操作',
      width: 150,
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'pending' && canApprove(user.role) && (
            <Button size="small" type="primary" onClick={async () => {
              await supabase.from('employee_transfers').update({ status: 'completed' }).eq('id', record.id);
              message.success('已确认');
              fetchData();
            }}>确认</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div className="table-toolbar">
        <Text strong>共 {data.length} 条流动记录</Text>
        {canEdit(user.role) && (
          <Button type="primary" icon={<PlusOutlined />} onClick={async () => {
            await supabase.from('employee_transfers').insert({
              employee_id: 'new',
              transfer_type: 'transfer',
              status: 'pending',
            });
            message.success('创建成功');
            fetchData();
          }}>
            新建流动申请
          </Button>
        )}
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
    </Card>
  );
};

// ===== 员工档案 Tab =====
const EmployeeListTab: React.FC<{ user: any }> = ({ user }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: result } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    if (result) setData(result);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const columns = [
    { title: '工号', dataIndex: 'employee_no', width: 100 },
    { title: '姓名', dataIndex: 'chinese_name', width: 100 },
    { title: '英文名', dataIndex: 'english_name', width: 100 },
    { title: '类型', dataIndex: 'employee_type', width: 80,
      render: (v: string) => {
        const map: Record<string, string> = { full_time: '全日制', intern: '实习生', retired_rehire: '退休返聘', security: '保安' };
        return map[v] || v;
      }},
    { title: '部门', dataIndex: 'department_id', width: 80, ellipsis: true },
    { title: '职位', dataIndex: 'position_name', width: 120 },
    { title: '入职日期', dataIndex: 'onboard_date', width: 110 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: string) => {
        const map: Record<string, { label: string; color: string }> = {
          active: { label: '在职', color: 'success' },
          probation: { label: '试用期', color: 'processing' },
          internship: { label: '实习期', color: 'warning' },
          resigned: { label: '已离职', color: 'default' },
        };
        return <Tag color={map[v]?.color}>{map[v]?.label || v}</Tag>;
      },
    },
    { title: '合同到期', dataIndex: 'contract_end', width: 110 },
  ];

  return (
    <Card>
      <div className="table-toolbar">
        <Text strong>共 {data.length} 名员工</Text>
        {canEdit(user.role) && (
          <Button type="primary" icon={<PlusOutlined />}>新增员工</Button>
        )}
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        pagination={{ pageSize: 10 }} scroll={{ x: 1000 }} />
    </Card>
  );
};

export default EmploymentPage;
