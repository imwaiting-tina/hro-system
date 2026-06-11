import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Modal, Form, Input, Select, InputNumber,
  DatePicker, message, Typography, Steps, Card, Popconfirm, Descriptions
} from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';
import { useAuthStore, canEdit, canApprove } from '../../../stores/authStore';
import supabase from '../../../utils/supabase';
import type { RecruitmentStatus } from '../../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusMap: Record<RecruitmentStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  pending_dept: { label: '待部门确认', color: 'processing' },
  pending_hr: { label: '待人事确认', color: 'warning' },
  pending_final: { label: '待Jenny终审', color: 'warning' },
  approved: { label: '已批准', color: 'success' },
  rejected: { label: '已驳回', color: 'error' },
  published: { label: '已发布', color: 'blue' },
  closed: { label: '已关闭', color: 'default' },
};

const DemandPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [form] = Form.useForm();

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

  const handleSubmit = async (values: any) => {
    const payload = {
      ...values,
      request_no: editingRecord?.request_no || `REQ-${Date.now()}`,
      created_by: editingRecord?.created_by || user?.id,
    };

    if (editingRecord) {
      await supabase.from('recruitment_requests').update(payload).eq('id', editingRecord.id);
      message.success('更新成功');
    } else {
      await supabase.from('recruitment_requests').insert(payload);
      message.success('创建成功');
    }

    setModalVisible(false);
    form.resetFields();
    setEditingRecord(null);
    fetchData();
  };

  const handleStatusChange = async (id: string, newStatus: RecruitmentStatus) => {
    await supabase.from('recruitment_requests').update({ status: newStatus }).eq('id', id);
    message.success('状态已更新');
    fetchData();
  };

  const openEdit = (record: any) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      expected_onboard_date: record.expected_onboard_date ? dayjs(record.expected_onboard_date) : undefined,
    });
    setModalVisible(true);
  };

  const columns = [
    {
      title: '需求编号',
      dataIndex: 'request_no',
      width: 140,
    },
    {
      title: '职位名称',
      dataIndex: 'position_name',
      width: 160,
    },
    {
      title: '招聘数量',
      dataIndex: 'quantity',
      width: 80,
    },
    {
      title: '职级',
      dataIndex: 'grade',
      width: 80,
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
      width: 120,
      render: (status: RecruitmentStatus) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.label}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      width: 280,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setSelectedRecord(record); setDetailVisible(true); }}>
            详情
          </Button>
          {canEdit(user!.role) && record.status === 'draft' && (
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
              编辑
            </Button>
          )}
          {canApprove(user!.role) && record.status === 'pending_dept' && (
            <Popconfirm title="确认通过?" onConfirm={() => handleStatusChange(record.id, 'pending_hr')}>
              <Button size="small" type="primary">通过</Button>
            </Popconfirm>
          )}
          {canApprove(user!.role) && record.status === 'pending_hr' && (
            <Popconfirm title="确认通过?" onConfirm={() => handleStatusChange(record.id, 'pending_final')}>
              <Button size="small" type="primary">HR确认</Button>
            </Popconfirm>
          )}
          {user?.role === 'super_admin' && record.status === 'pending_final' && (
            <Popconfirm title="终审通过?" onConfirm={() => handleStatusChange(record.id, 'approved')}>
              <Button size="small" type="primary">终审通过</Button>
            </Popconfirm>
          )}
          {record.status === 'approved' && canEdit(user!.role) && (
            <Button size="small" icon={<SendOutlined />} onClick={() => handleStatusChange(record.id, 'published')}>
              发布
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={2}>招聘需求管理</Title>
        <Text type="secondary">发布和管理招聘需求，包含《聘用员工申请表》的审批流程</Text>
      </div>

      <Card>
        <div className="table-toolbar">
          <Text strong>共 {data.length} 条记录</Text>
          {canEdit(user!.role) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setEditingRecord(null);
              form.resetFields();
              setModalVisible(true);
            }}>
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
          scroll={{ x: 1100 }}
        />
      </Card>

      {/* 新建/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑招聘需求' : '新建招聘需求 —— 《聘用员工申请表》'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
            <Form.Item name="position_name" label="职位名称" rules={[{ required: true }]}>
              <Input placeholder="如：财务/账务助理" />
            </Form.Item>
            <Space size="large">
              <Form.Item name="quantity" label="招聘数量" rules={[{ required: true }]}>
                <InputNumber min={1} />
              </Form.Item>
              <Form.Item name="grade" label="职级">
                <Select style={{ width: 120 }} options={[
                  { label: 'V级', value: 'V' }, { label: 'P级', value: 'P' },
                  { label: 'M级', value: 'M' }, { label: 'S级', value: 'S' },
                ]} />
              </Form.Item>
              <Form.Item name="salary_range_min" label="薪酬范围-最低(月/元)">
                <InputNumber min={0} style={{ width: 180 }} prefix="¥" placeholder="最低薪资" />
              </Form.Item>
              <Form.Item name="salary_range_max" label="薪酬范围-最高(月/元)">
                <InputNumber min={0} style={{ width: 180 }} prefix="¥" placeholder="最高薪资" />
              </Form.Item>
            </Space>
            <Form.Item name="annual_budget" label="年度预算">
              <InputNumber min={0} style={{ width: 200 }} prefix="¥" />
            </Form.Item>
            <Form.Item name="expected_onboard_date" label="期望到岗时间">
              <DatePicker />
            </Form.Item>
            <Form.Item name="recruitment_reason" label="招聘原因">
              <TextArea rows={2} placeholder="如：新增编制/人员替换/业务扩展" />
            </Form.Item>
            <Form.Item name="brief_job_description" label="简要职位描述">
              <TextArea rows={3} />
            </Form.Item>
          </Card>

          <Card size="small" title="候选人画像">
            <Form.Item name="education_requirement" label="学历要求">
              <Input placeholder="如：双一流全日制本科及以上" />
            </Form.Item>
            <Form.Item name="gender_requirement" label="性别要求">
              <Select options={[{ label: '不限', value: '不限' }, { label: '男', value: '男' }, { label: '女', value: '女' }]} />
            </Form.Item>
            <Form.Item name="age_requirement" label="年龄要求">
              <Input placeholder="如：25-35岁" />
            </Form.Item>
            <Form.Item name="work_experience_requirement" label="工作经历要求">
              <TextArea rows={2} />
            </Form.Item>
            <Form.Item name="certificate_requirement" label="证书要求">
              <Input placeholder="如：注册会计师证" />
            </Form.Item>
            <Form.Item name="other_requirements" label="其他资历要求">
              <TextArea rows={2} />
            </Form.Item>
          </Card>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="招聘需求详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {selectedRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="需求编号">{selectedRecord.request_no}</Descriptions.Item>
            <Descriptions.Item label="职位名称">{selectedRecord.position_name}</Descriptions.Item>
            <Descriptions.Item label="招聘数量">{selectedRecord.quantity}</Descriptions.Item>
            <Descriptions.Item label="职级">{selectedRecord.grade || '-'}</Descriptions.Item>
            <Descriptions.Item label="薪酬范围">
              {selectedRecord.salary_range_min ? `¥${selectedRecord.salary_range_min} - ¥${selectedRecord.salary_range_max}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="期望到岗">
              {selectedRecord.expected_onboard_date ? dayjs(selectedRecord.expected_onboard_date).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[selectedRecord.status as RecruitmentStatus]?.color}>
                {statusMap[selectedRecord.status as RecruitmentStatus]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="学历要求">{selectedRecord.education_requirement || '-'}</Descriptions.Item>
            <Descriptions.Item label="招聘原因" span={2}>{selectedRecord.recruitment_reason || '-'}</Descriptions.Item>
            <Descriptions.Item label="职位描述" span={2}>{selectedRecord.brief_job_description || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default DemandPage;
