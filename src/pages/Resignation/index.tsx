import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Modal, Form, Input, Select, DatePicker, message,
  Typography, Card, Steps, Descriptions, Checkbox
} from 'antd';
import { PlusOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuthStore, canEdit, canApprove } from '../../stores/authStore';
import supabase from '../../utils/supabase';
import type { ResignationStatus } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusMap: Record<ResignationStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'default' },
  in_progress: { label: '处理中', color: 'processing' },
  pending_handover: { label: '待交接', color: 'warning' },
  pending_clearance: { label: '待结算', color: 'warning' },
  completed: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'default' },
};

const ResignationPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    const { data: result } = await supabase
      .from('resignations')
      .select('*')
      .order('created_at', { ascending: false });
    if (result) setData(result);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (values: any) => {
    await supabase.from('resignations').insert({
      ...values,
      apply_date: values.apply_date?.format('YYYY-MM-DD'),
      last_working_date: values.last_working_date?.format('YYYY-MM-DD'),
      status: 'pending',
    });
    message.success('离职申请已提交');
    setModalVisible(false);
    form.resetFields();
    fetchData();
  };

  const handleApprove = async (id: string, level: string) => {
    const updates: any = {};
    if (level === 'dept') { updates.dept_head_approved = true; updates.dept_head_approved_at = new Date().toISOString(); }
    else if (level === 'hr') { updates.hr_approved = true; updates.hr_approved_at = new Date().toISOString(); }
    else if (level === 'final') { updates.final_approved = true; updates.final_approved_at = new Date().toISOString(); updates.status = 'pending_handover'; }

    await supabase.from('resignations').update(updates).eq('id', id);
    message.success('审批完成');
    fetchData();
  };

  const handleComplete = async (id: string) => {
    await supabase.from('resignations').update({ status: 'completed' }).eq('id', id);
    message.success('离职流程已完成');
    fetchData();
  };

  const columns = [
    { title: '员工ID', dataIndex: 'employee_id', width: 120, ellipsis: true },
    { title: '离职类型', dataIndex: 'resignation_type', width: 120 },
    { title: '申请日期', dataIndex: 'apply_date', width: 110 },
    { title: '最后工作日', dataIndex: 'last_working_date', width: 110 },
    { title: '原因', dataIndex: 'reason', width: 180, ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: ResignationStatus) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.label}</Tag>
      ),
    },
    {
      title: '操作',
      width: 250,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />}
            onClick={() => { setSelectedRecord(record); setDetailVisible(true); }}>
            详情
          </Button>
          {record.status === 'pending' && canApprove(user.role) && (
            <>
              <Button size="small" onClick={() => handleApprove(record.id, 'dept')}>部门审批</Button>
              <Button size="small" onClick={() => handleApprove(record.id, 'hr')}>HR审批</Button>
            </>
          )}
          {record.status === 'pending' && user.role === 'super_admin' && (
            <Button size="small" type="primary" onClick={() => handleApprove(record.id, 'final')}>终审通过</Button>
          )}
          {record.status === 'pending_handover' && canEdit(user.role) && (
            <Button size="small" onClick={() => handleComplete(record.id)}>完成</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={2}>离职管理</Title>
        <Text type="secondary">管理员工离职申请、交接清单、离职结算全流程</Text>
      </div>

      <Card>
        <div className="table-toolbar">
          <Text strong>共 {data.length} 条离职记录</Text>
          {canEdit(user.role) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              form.resetFields();
              setModalVisible(true);
            }}>
              新建离职申请
            </Button>
          )}
        </div>

        <Steps
          current={-1}
          size="small"
          style={{ marginBottom: 24 }}
          items={[
            { title: '提交申请' },
            { title: '部门审批' },
            { title: 'HR审批' },
            { title: 'Jenny终审' },
            { title: '工作交接' },
            { title: '离职结算' },
          ]}
        />

        <Table columns={columns} dataSource={data} rowKey="id"
          loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="新建离职申请" open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        onOk={() => form.submit()} width={500}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="employee_id" label="员工ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="resignation_type" label="离职类型" rules={[{ required: true }]}>
            <Select options={[
              { label: '主动离职', value: '主动离职' },
              { label: '协商解除', value: '协商解除' },
              { label: '合同到期不续签', value: '合同到期不续签' },
            ]} />
          </Form.Item>
          <Form.Item name="apply_date" label="申请日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="last_working_date" label="最后工作日" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="离职原因">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="离职详情" open={detailVisible} onCancel={() => setDetailVisible(false)}
        footer={null} width={500}>
        {selectedRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="员工ID">{selectedRecord.employee_id}</Descriptions.Item>
            <Descriptions.Item label="离职类型">{selectedRecord.resignation_type}</Descriptions.Item>
            <Descriptions.Item label="申请日期">{selectedRecord.apply_date}</Descriptions.Item>
            <Descriptions.Item label="最后工作日">{selectedRecord.last_working_date}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[selectedRecord.status as ResignationStatus]?.color}>
                {statusMap[selectedRecord.status as ResignationStatus]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="原因">{selectedRecord.reason || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ResignationPage;
