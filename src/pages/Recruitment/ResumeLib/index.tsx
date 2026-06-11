import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Modal, Form, Input, Select, message,
  Typography, Card, Upload, Descriptions
} from 'antd';
import {
  PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  UploadOutlined, SearchOutlined
} from '@ant-design/icons';
import { useAuthStore, canEdit } from '../../../stores/authStore';
import supabase from '../../../utils/supabase';
import type { ResumeStatus } from '../../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusMap: Record<ResumeStatus, { label: string; color: string }> = {
  new:                { label: '新收',       color: 'blue' },
  screening:          { label: '筛选中',     color: 'processing' },
  interviewing_first:  { label: '一面中',     color: 'orange' },
  interviewing_second: { label: '二面中',     color: 'orange' },
  interviewing_final:   { label: '终面中',     color: 'volcano' },
  pending_offer:       { label: '待发Offer',  color: 'purple' },
  offered:            { label: '已发Offer',   color: 'geekblue' },
  accepted:           { label: '已接受',     color: 'success' },
  rejected:           { label: '不录取',     color: 'error' },
  withdrawn:          { label: '候选人放弃', color: 'default' },
};

const ResumeLibPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from('resumes').select('*').order('created_at', { ascending: false });
    if (searchText) {
      query = query.or(`candidate_name.ilike.%${searchText}%,phone.ilike.%${searchText}%,email.ilike.%${searchText}%`);
    }
    const { data: result, error } = await query;
    if (!error && result) setData(result);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [searchText]);

  const handleSubmit = async (values: any) => {
    const payload = { ...values, created_by: editingRecord?.created_by || user?.id };
    if (editingRecord) {
      await supabase.from('resumes').update(payload).eq('id', editingRecord.id);
      message.success('更新成功');
    } else {
      await supabase.from('resumes').insert({ ...payload, status: 'new' });
      message.success('录入成功');
    }
    setModalVisible(false);
    form.resetFields();
    setEditingRecord(null);
    fetchData();
  };

  const handleStatusChange = async (id: string, newStatus: ResumeStatus) => {
    await supabase.from('resumes').update({ status: newStatus }).eq('id', id);
    message.success('状态已更新');
    fetchData();
  };

  const columns = [
    { title: '候选人', dataIndex: 'candidate_name', width: 100 },
    { title: '性别', dataIndex: 'gender', width: 60 },
    { title: '电话', dataIndex: 'phone', width: 130 },
    { title: '邮箱', dataIndex: 'email', width: 180, ellipsis: true },
    { title: '学历', dataIndex: 'highest_education', width: 80 },
    { title: '毕业院校', dataIndex: 'school', width: 140, ellipsis: true },
    { title: '专业', dataIndex: 'major', width: 120, ellipsis: true },
    {
      title: '来源',
      dataIndex: 'source',
      width: 100,
      render: (v: string) => v === 'boss_zhipin' ? 'Boss直聘' : v,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: ResumeStatus) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.label}</Tag>
      ),
    },
    {
      title: '日期',
      dataIndex: 'created_at',
      width: 110,
      render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      width: 260,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />}
            onClick={() => { setSelectedRecord(record); setDetailVisible(true); }}>
            详情
          </Button>
          {canEdit(user!.role) && (
            <Button size="small" icon={<EditOutlined />}
              onClick={() => { setEditingRecord(record); form.setFieldsValue(record); setModalVisible(true); }}>
              编辑
            </Button>
          )}
      {record.status === 'new' && canEdit(user!.role) && (
            <Button size="small" type="primary"
              onClick={() => handleStatusChange(record.id, 'screening')}>
              推送筛选
            </Button>
          )}
          {record.status === 'screening' && canEdit(user!.role) && (
            <Button size="small" type="primary"
              onClick={() => handleStatusChange(record.id, 'interviewing_first')}>
              进入一面
            </Button>
          )}
          {record.status === 'pending_offer' && canEdit(user!.role) && (
            <Button size="small" type="primary" style={{ background: '#722ed1', borderColor: '#722ed1' }}
              onClick={() => {
                setDetailVisible(false);
                // 触发跳转到Offer页面（通过全局事件或路由）
                window.location.href = '/hro-system/recruitment/offer';
              }}>
              发送Offer
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={2}>简历库</Title>
        <Text type="secondary">管理所有候选人简历，来源包括Boss直聘、内推、邮件等渠道</Text>
      </div>

      <Card>
        <div className="table-toolbar">
          <Input.Search
            placeholder="搜索候选人姓名/电话/邮箱"
            style={{ width: 300 }}
            onSearch={setSearchText}
            allowClear
          />
          {canEdit(user!.role) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setEditingRecord(null);
              form.resetFields();
              setModalVisible(true);
            }}>
              录入简历
            </Button>
          )}
        </div>

        <Table columns={columns} dataSource={data} rowKey="id"
          loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1300 }} />
      </Card>

      <Modal
        title={editingRecord ? '编辑简历' : '录入简历'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="candidate_name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space size="large">
            <Form.Item name="gender" label="性别">
              <Select options={[{ label: '男', value: '男' }, { label: '女', value: '女' }]} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="phone" label="电话" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="邮箱">
              <Input />
            </Form.Item>
          </Space>
          <Space size="large">
            <Form.Item name="highest_education" label="最高学历">
              <Select options={[
                { label: '博士', value: '博士' }, { label: '硕士', value: '硕士' },
                { label: '本科', value: '本科' }, { label: '大专', value: '大专' },
              ]} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="school" label="毕业院校">
              <Input style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="major" label="专业">
              <Input style={{ width: 200 }} />
            </Form.Item>
          </Space>
          <Form.Item name="source" label="简历来源">
            <Select options={[
              { label: 'Boss直聘', value: 'boss_zhipin' },
              { label: '内部推荐', value: 'internal_referral' },
              { label: '邮件投递', value: 'email' },
              { label: '其他', value: 'other' },
            ]} />
          </Form.Item>
          <Form.Item name="expected_salary" label="期望薪资">
            <Input prefix="¥" type="number" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="简历详情" open={detailVisible} onCancel={() => setDetailVisible(false)}
        footer={null} width={600}>
        {selectedRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="姓名">{selectedRecord.candidate_name}</Descriptions.Item>
            <Descriptions.Item label="性别">{selectedRecord.gender || '-'}</Descriptions.Item>
            <Descriptions.Item label="电话">{selectedRecord.phone}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{selectedRecord.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="学历">{selectedRecord.highest_education || '-'}</Descriptions.Item>
            <Descriptions.Item label="毕业院校">{selectedRecord.school || '-'}</Descriptions.Item>
            <Descriptions.Item label="专业">{selectedRecord.major || '-'}</Descriptions.Item>
            <Descriptions.Item label="来源">{selectedRecord.source}</Descriptions.Item>
            <Descriptions.Item label="期望薪资">{selectedRecord.expected_salary ? `¥${selectedRecord.expected_salary}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[selectedRecord.status as ResumeStatus]?.color}>
                {statusMap[selectedRecord.status as ResumeStatus]?.label}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ResumeLibPage;
