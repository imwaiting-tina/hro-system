import React, { useEffect, useState } from 'react';
import {
  Card, Typography, Table, Button, Tag, Space, Steps, Descriptions, Badge,
  Modal, Form, Input, Select, message, Popconfirm, Progress, Result, Empty
} from 'antd';
import {
  PlusOutlined, CheckCircleOutlined, DeleteOutlined, ArrowLeftOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore, canEdit } from '../../stores/authStore';
import supabase from '../../utils/supabase';
import type { OffboardingCase, OffboardingHandoverItem, HandoverItemStatus } from '../../types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const itemTypeConfig: Record<string, { label: string; color: string }> = {
  asset: { label: '资产类', color: '#1890ff' },
  knowledge: { label: '知识/权限类', color: '#722ed1' },
  finance: { label: '财务类', color: '#13c2c2' },
};

const OffboardingHandoverPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [caseData, setCaseData] = useState<OffboardingCase | null>(null);
  const [items, setItems] = useState<OffboardingHandoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingItem, setEditingItem] = useState<OffboardingHandoverItem | null>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 加载离职单
      const { data: caseResult } = await supabase
        .from('offboarding_cases')
        .select('*, employees!inner(name, employee_no, department, position)')
        .eq('id', id)
        .single();

      if (caseResult) {
        setCaseData({
          ...caseResult,
          employee_name: caseResult.employees?.name || '',
          employee_department: caseResult.employees?.department || '',
          employee_position: caseResult.employees?.position || '',
          employee_no: caseResult.employees?.employee_no || '',
        });
      }

      // 加载交接项
      const { data: itemResult } = await supabase
        .from('offboarding_handover_items')
        .select('*')
        .eq('case_id', id)
        .order('sort_order');

      if (itemResult) {
        setItems(itemResult);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  // 计算进度
  const confirmedCount = items.filter((i) => i.status === 'confirmed').length;
  const progressPercent = items.length > 0 ? Math.round((confirmedCount / items.length) * 100) : 0;

  // 添加/编辑交接项
  const handleSaveItem = async (values: any) => {
    if (editingItem) {
      await supabase
        .from('offboarding_handover_items')
        .update({
          description: values.description,
          item_type: values.item_type,
          assigned_to: values.assigned_to || null,
        })
        .eq('id', editingItem.id);
      message.success('交接项已更新');
    } else {
      await supabase.from('offboarding_handover_items').insert({
        case_id: id,
        description: values.description,
        item_type: values.item_type,
        assigned_to: values.assigned_to || null,
        sort_order: items.length + 1,
      });
      message.success('交接项已添加');
    }
    setModalVisible(false);
    setEditingItem(null);
    form.resetFields();
    fetchData();
  };

  // 确认交接项
  const handleConfirm = async (item: OffboardingHandoverItem) => {
    await supabase
      .from('offboarding_handover_items')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmed_by: user?.id,
      })
      .eq('id', item.id);
    message.success(`"${item.description}" 已确认交接`);
    fetchData();
  };

  // 删除交接项
  const handleDelete = async (itemId: string) => {
    await supabase.from('offboarding_handover_items').delete().eq('id', itemId);
    message.success('已删除');
    fetchData();
  };

  // 开始交接（将状态从approved变为handovering）
  const handleStartHandover = async () => {
    await supabase
      .from('offboarding_cases')
      .update({ status: 'handovering' })
      .eq('id', id);
    message.success('已进入交接阶段');
    fetchData();
  };

  // 完成交接 → 进入结算
  const handleCompleteHandover = async () => {
    if (confirmedCount < items.length) {
      message.warning('还有未完成的交接项，请全部确认后再结算');
      return;
    }
    Modal.confirm({
      title: '确认完成交接',
      content: `所有 ${items.length} 项交接已全部确认，确定进入结算阶段？`,
      onOk: async () => {
        await supabase
          .from('offboarding_cases')
          .update({ status: 'settled' })
          .eq('id', id);
        message.success('交接完成，进入结算阶段');
        navigate(`/offboarding/${id}/settlement`);
      },
    });
  };

  const itemColumns = [
    {
      title: '序号',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '类型',
      dataIndex: 'item_type',
      width: 120,
      render: (type: string) => (
        <Tag color={itemTypeConfig[type]?.color}>{itemTypeConfig[type]?.label}</Tag>
      ),
    },
    {
      title: '交接内容',
      dataIndex: 'description',
      render: (text: string, record: OffboardingHandoverItem) => (
        <Text delete={record.status === 'confirmed'}>{text}</Text>
      ),
    },
    {
      title: '接收人',
      dataIndex: 'assigned_to',
      width: 120,
      render: (val: string) => val || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: HandoverItemStatus) => (
        status === 'confirmed'
          ? <Badge status="success" text="已确认" />
          : <Badge status="default" text="待交接" />
      ),
    },
    {
      title: '确认时间',
      dataIndex: 'confirmed_at',
      width: 160,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      width: 160,
      render: (_: any, record: OffboardingHandoverItem) => (
        <Space size="small">
          {record.status === 'pending' && user && canEdit(user.role) && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleConfirm(record)}
              >
                确认
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setEditingItem(record);
                  form.setFieldsValue(record);
                  setModalVisible(true);
                }}
              >
                编辑
              </Button>
            </>
          )}
          {user && canEdit(user.role) && (
            <Popconfirm
              title="确定删除此交接项？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (loading) return null;

  if (!caseData) {
    return (
      <Card>
        <Result
          status="404"
          title="离职单不存在"
          extra={<Button onClick={() => navigate('/offboarding/list')}>返回列表</Button>}
        />
      </Card>
    );
  }

  const currentStep = caseData.status === 'approved' ? 1
    : caseData.status === 'handovering' ? 2
    : caseData.status === 'settled' ? 3
    : caseData.status === 'closed' ? 4 : 0;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/offboarding/list')}>
          返回列表
        </Button>
      </div>

      {/* 员工信息卡片 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={4} size="small">
          <Descriptions.Item label="员工">{caseData.employee_name}</Descriptions.Item>
          <Descriptions.Item label="工号">{caseData.employee_no}</Descriptions.Item>
          <Descriptions.Item label="部门">{caseData.employee_department}</Descriptions.Item>
          <Descriptions.Item label="职位">{caseData.employee_position}</Descriptions.Item>
          <Descriptions.Item label="最后工作日">
            {caseData.last_working_day ? dayjs(caseData.last_working_day).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="离职类型">
            <Tag>{caseData.type === 'resignation' ? '主动辞职' : caseData.type === 'termination' ? '辞退/解雇' : '退休'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Badge
              status={caseData.status === 'pending' ? 'warning' : caseData.status === 'closed' ? 'success' : 'processing'}
              text={
                caseData.status === 'pending' ? '待审批' :
                caseData.status === 'approved' ? '已批准' :
                caseData.status === 'handovering' ? '交接中' :
                caseData.status === 'settled' ? '已结算' : '已关闭'
              }
            />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 流程步骤 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Steps
          current={currentStep}
          size="small"
          items={[
            { title: '提交申请' },
            { title: 'HR审批' },
            { title: '工作交接' },
            { title: '离职结算' },
            { title: '完成' },
          ]}
        />
      </Card>

      {/* 交接进度 */}
      {items.length > 0 && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Progress
              type="circle"
              percent={progressPercent}
              size={80}
              strokeColor={progressPercent === 100 ? '#52c41a' : '#1890ff'}
            />
            <div>
              <Title level={5} style={{ margin: 0 }}>交接进度</Title>
              <Text type="secondary">
                已完成 {confirmedCount}/{items.length} 项
                {progressPercent === 100 ? ' ✅ 全部完成，可进入结算' : ''}
              </Text>
            </div>
          </div>
        </Card>
      )}

      {/* 交接清单 */}
      <Card
        title="工作交接清单"
        extra={
          <Space>
            {caseData.status === 'approved' && user && canEdit(user.role) && (
              <Button type="primary" onClick={handleStartHandover}>开始交接</Button>
            )}
            {(caseData.status === 'handovering') && user && canEdit(user.role) && (
              <>
                <Button icon={<PlusOutlined />} onClick={() => {
                  setEditingItem(null);
                  form.resetFields();
                  setModalVisible(true);
                }}>
                  添加交接项
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  disabled={confirmedCount < items.length}
                  onClick={handleCompleteHandover}
                >
                  完成交接，进入结算
                </Button>
              </>
            )}
          </Space>
        }
      >
        {items.length === 0 ? (
          <Empty
            description={
              caseData.status === 'approved'
                ? '离职单已批准，点击"开始交接"自动生成默认交接清单'
                : '暂无交接项'
            }
          >
            {caseData.status === 'approved' && user && canEdit(user.role) && (
              <Button type="primary" onClick={handleStartHandover}>开始交接</Button>
            )}
          </Empty>
        ) : (
          <Table
            columns={itemColumns}
            dataSource={items}
            rowKey="id"
            pagination={false}
            size="small"
          />
        )}
      </Card>

      {/* 添加/编辑交接项弹窗 */}
      <Modal
        title={editingItem ? '编辑交接项' : '添加交接项'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingItem(null); form.resetFields(); }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSaveItem}>
          <Form.Item name="item_type" label="类型" rules={[{ required: true }]}>
            <Select
              options={Object.entries(itemTypeConfig).map(([k, v]) => ({ label: v.label, value: k }))}
            />
          </Form.Item>
          <Form.Item name="description" label="交接内容" rules={[{ required: true }]}>
            <Input placeholder="如：归还MacBook Pro / 交接Git仓库权限" />
          </Form.Item>
          <Form.Item name="assigned_to" label="接收人ID（可选）">
            <Input placeholder="接收人用户ID" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OffboardingHandoverPage;
