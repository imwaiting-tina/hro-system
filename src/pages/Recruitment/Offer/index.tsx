import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Modal, Form, Input, Select, InputNumber,
  DatePicker, message, Typography, Card, Steps, Descriptions, Popconfirm,
} from 'antd';
import {
  PlusOutlined, EyeOutlined, SendOutlined, CheckCircleOutlined,
  CloseCircleOutlined, MailOutlined, UserSwitchOutlined,
} from '@ant-design/icons';
import { useAuthStore, canEdit } from '../../../stores/authStore';
import RecruitmentNav from '../../../components/RecruitmentNav';
import supabase from '../../../utils/supabase';
import type { OfferStatus } from '../../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusMap: Record<OfferStatus, { label: string; color: string }> = {
  draft:        { label: '草稿',     color: 'default' },
  pending_send:  { label: '待发送',   color: 'processing' },
  sent:         { label: '已发送',   color: 'blue' },
  delivered:    { label: '已送达',   color: 'cyan' },
  accepted:     { label: '已接受',   color: 'success' },
  rejected:     { label: '已拒绝',   color: 'error' },
  expired:      { label: '已过期',   color: 'warning' },
  revoked:      { label: '已撤回',   color: 'default' },
};

const OfferPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any[]>([]);
  const [pendingResumes, setPendingResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [creatingFromResume, setCreatingFromResume] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    const [{ data: offers }, { data: resumes }] = await Promise.all([
      supabase.from('offers').select('*').order('created_at', { ascending: false }),
      supabase.from('resumes').select('id,candidate_name').eq('status', 'pending_offer'),
    ]);
    if (offers) setData(offers);
    if (resumes) setPendingResumes(resumes);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (values: any) => {
    const payload = {
      ...values,
      offer_no: `OFFER-${Date.now()}`,
      start_date: values.start_date?.format('YYYY-MM-DD'),
      report_time: values.report_time?.format('YYYY-MM-DD HH:mm'),
      created_by: user?.id,
      status: 'draft' as OfferStatus,
    };
    await supabase.from('offers').insert(payload);
    message.success('Offer创建成功');
    setModalVisible(false);
    setCreatingFromResume(null);
    form.resetFields();
    fetchData();
  };

  const handleStatusChange = async (id: string, newStatus: OfferStatus) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'sent')        updates.sent_at    = new Date().toISOString();
    if (newStatus === 'accepted')    updates.replied_at = new Date().toISOString();
    if (newStatus === 'rejected')    updates.replied_at = new Date().toISOString();

    await supabase.from('offers').update(updates).eq('id', id);
    message.success('状态已更新');

    if (newStatus === 'accepted') {
      await supabase.from('offers').update({
        onboarding_confirmed: true,
        confirmed_by: user?.id,
        confirmed_at: new Date().toISOString(),
      }).eq('id', id);
      message.success('已确认入职，请进入入职管理模块');
    }
    fetchData();
  };

  const openCreateFromResume = (resume: any) => {
    setCreatingFromResume(resume);
    form.resetFields();
    form.setFieldsValue({
      candidate_name:  resume.candidate_name,
      candidate_email: resume.email || '',
    });
    setModalVisible(true);
  };

  const columns = [
    { title: 'Offer编号', dataIndex: 'offer_no', width: 140 },
    { title: '候选人',  dataIndex: 'candidate_name', width: 100 },
    { title: '邮箱',    dataIndex: 'candidate_email', width: 180, ellipsis: true },
    { title: '职位',    dataIndex: 'position_name',  width: 140 },
    { title: '入职公司', dataIndex: 'onboard_company', width: 140, ellipsis: true },
    {
      title: '月薪',
      dataIndex: 'monthly_salary',
      width: 100,
      render: (v: number) => v ? `¥${v.toLocaleString()}` : '-',
    },
    { title: '入职日期', dataIndex: 'start_date', width: 110, render: (v: string) => v || '-' },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (status: OfferStatus) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.label}</Tag>
      ),
    },
    {
      title: '操作', width: 320,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />}
            onClick={() => { setSelectedRecord(record); setDetailVisible(true); }}>
            详情
          </Button>
          {record.status === 'draft' && canEdit(user!.role) && (
            <Button size="small" type="primary" icon={<SendOutlined />}
              onClick={() => handleStatusChange(record.id, 'sent')}>
              发送Offer
            </Button>
          )}
          {record.status === 'sent' && canEdit(user!.role) && (
            <>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />}
                onClick={() => handleStatusChange(record.id, 'accepted')}>
                已接受
              </Button>
              <Button size="small" danger icon={<CloseCircleOutlined />}
                onClick={() => handleStatusChange(record.id, 'rejected')}>
                已拒绝
              </Button>
            </>
          )}
          {record.status === 'accepted' && !record.onboarding_confirmed && (
            <Popconfirm title="确认该候选人已入职?" onConfirm={() => handleStatusChange(record.id, 'accepted')}>
              <Button size="small" type="primary">确认入职</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <RecruitmentNav />
      <div className="page-header">
        <Title level={2}>Offer管理</Title>
        <Text type="secondary">
          管理Offer全生命周期：创建 → 发送 → 追踪回复 → 确认入职
        </Text>
      </div>

      <Card>
        <div className="table-toolbar">
          <Text strong>共 {data.length} 条Offer</Text>
          {canEdit(user!.role) && (
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                setCreatingFromResume(null);
                form.resetFields();
                setModalVisible(true);
              }}>
                创建Offer
              </Button>
              {pendingResumes.length > 0 && (
                <Popconfirm
                  title={`有 ${pendingResumes.length} 位候选人待发Offer，是否批量创建？`}
                  onConfirm={() => {
                    message.info('请逐个为待发Offer候选人创建Offer');
                  }}>
                  <Button icon={<UserSwitchOutlined />} style={{ background: '#722ed1', borderColor: '#722ed1', color: '#fff' }}>
                    待发Offer（{pendingResumes.length}）
                  </Button>
                </Popconfirm>
              )}
            </Space>
          )}
        </div>

        {/* Offer流程 */}
        <Steps current={-1} size="small" style={{ marginBottom: 24 }} items={[
          { title: '创建Offer', description: '填写录用信息' },
          { title: '发送邮件', description: '公司邮箱自动发送' },
          { title: '等待回复', description: '追踪回复状态' },
          { title: '确认入职', description: '进入入职管理流程' },
        ]} />

        {/* 待发Offer候选人列表 */}
        {pendingResumes.length > 0 && (
          <Card size="small" title="📋 待发Offer候选人" style={{ marginBottom: 16, borderColor: '#722ed1' }}>
            <Space wrap>
              {pendingResumes.map((r: any) => (
                <Button key={r.id} size="small" style={{ borderColor: '#722ed1', color: '#722ed1' }}
                  icon={<MailOutlined />}
                  onClick={() => openCreateFromResume(r)}>
                  {r.candidate_name} — 发Offer
                </Button>
              ))}
            </Space>
          </Card>
        )}

        <Table columns={columns} dataSource={data} rowKey="id"
          loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1200 }} />
      </Card>

      {/* 创建/编辑Offer弹窗 */}
      <Modal
        title={creatingFromResume ? `创建Offer —— ${creatingFromResume.candidate_name}` : '创建Offer —— 录用通知书'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setCreatingFromResume(null); form.resetFields(); }}
        onOk={() => form.submit()}
        width={750}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Card size="small" title="候选人信息" style={{ marginBottom: 16 }}>
            <Space size="large">
              <Form.Item name="candidate_name" label="姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="candidate_email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
                <Input />
              </Form.Item>
            </Space>
          </Card>

          <Card size="small" title="职务与级别" style={{ marginBottom: 16 }}>
            <Form.Item name="onboard_company" label="入职公司" rules={[{ required: true }]}>
              <Input placeholder="上海弈工分信息科技有限公司" />
            </Form.Item>
            <Space size="large">
              <Form.Item name="position_name" label="职位" rules={[{ required: true }]}>
                <Input style={{ width: 200 }} />
              </Form.Item>
              <Form.Item name="grade" label="级别">
                <Select style={{ width: 100 }} options={[
                  { label: 'V级', value: 'V' }, { label: 'P级', value: 'P' },
                  { label: 'M级', value: 'M' }, { label: 'S级', value: 'S' },
                ]} />
              </Form.Item>
            </Space>
            <Form.Item name="report_to" label="直接汇报上级">
              <Input />
            </Form.Item>
          </Card>

          <Card size="small" title="薪资与入职信息" style={{ marginBottom: 16 }}>
            <Form.Item name="monthly_salary" label="月税前收入(元)" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: 200 }} prefix="¥" />
            </Form.Item>
            <Space size="large">
              <Form.Item name="start_date" label="开始工作日期" rules={[{ required: true }]}>
                <DatePicker />
              </Form.Item>
              <Form.Item name="probation_period" label="试用期时长">
                <Select style={{ width: 120 }} options={[
                  { label: '1个月', value: '1个月' },
                  { label: '2个月', value: '2个月' },
                  { label: '3个月', value: '3个月' },
                  { label: '6个月', value: '6个月' },
                ]} />
              </Form.Item>
            </Space>
            <Space size="large">
              <Form.Item name="report_time" label="报到时间">
                <DatePicker showTime />
              </Form.Item>
              <Form.Item name="report_location" label="报到地点">
                <Input />
              </Form.Item>
            </Space>
          </Card>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal title="Offer详情" open={detailVisible} onCancel={() => setDetailVisible(false)}
        footer={null} width={600}>
        {selectedRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Offer编号">{selectedRecord.offer_no}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[selectedRecord.status as OfferStatus]?.color}>
                {statusMap[selectedRecord.status as OfferStatus]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="候选人">{selectedRecord.candidate_name}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{selectedRecord.candidate_email}</Descriptions.Item>
            <Descriptions.Item label="入职公司">{selectedRecord.onboard_company || '-'}</Descriptions.Item>
            <Descriptions.Item label="职位">{selectedRecord.position_name}</Descriptions.Item>
            <Descriptions.Item label="级别">{selectedRecord.grade || '-'}</Descriptions.Item>
            <Descriptions.Item label="汇报上级">{selectedRecord.report_to || '-'}</Descriptions.Item>
            <Descriptions.Item label="月税前收入">
              {selectedRecord.monthly_salary ? `¥${selectedRecord.monthly_salary.toLocaleString()}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="开始工作日期">{selectedRecord.start_date || '-'}</Descriptions.Item>
            <Descriptions.Item label="试用期">{selectedRecord.probation_period || '-'}</Descriptions.Item>
            <Descriptions.Item label="报到时间">{selectedRecord.report_time || '-'}</Descriptions.Item>
            <Descriptions.Item label="报到地点">{selectedRecord.report_location || '-'}</Descriptions.Item>
            <Descriptions.Item label="发送时间" span={2}>
              {selectedRecord.sent_at ? dayjs(selectedRecord.sent_at).format('YYYY-MM-DD HH:mm') : '未发送'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default OfferPage;
