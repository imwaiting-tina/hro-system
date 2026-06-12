import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Modal, Form, Input, Select, InputNumber,
  DatePicker, message, Typography, Card,
} from 'antd';
import { PlusOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuthStore, canEdit, canApprove } from '../../stores/authStore';
import supabase from '../../utils/supabase';
import type { EvaluationStatus } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const EvaluationPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
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
    { title: '员工', dataIndex: 'employee_id', width: 120, ellipsis: true },
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
          {record.status === 'pending_bu' && user && canApprove(user.role) && (
            <Button size="small" type="primary" onClick={() => handleApprove(record.id, 'bu')}>BU审批</Button>
          )}
          {record.status === 'pending_hr' && user && canApprove(user.role) && (
            <Button size="small" type="primary" onClick={() => handleApprove(record.id, 'hr')}>HR审批</Button>
          )}
          {record.status === 'pending_final' && user && user.role === 'super_admin' && (
            <Button size="small" type="primary" onClick={() => handleApprove(record.id, 'final')}>终审通过</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={2}>试用期/实习评估</Title>
        <Text type="secondary">管理试用期员工和实习生的评估流程</Text>
      </div>
      <Card>
        <div className="table-toolbar">
          <Text strong>共 {data.length} 条评估记录</Text>
          {user && canEdit(user.role) && (
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
    </div>
  );
};

export default EvaluationPage;
