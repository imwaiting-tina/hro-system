import React, { useEffect, useState, useMemo } from 'react';
import {
  Card, Typography, Table, Tag, Button, Space, Row, Col, Statistic, Modal, Form,
  Input, Select, DatePicker, InputNumber, message, Popconfirm, Descriptions, Tooltip
} from 'antd';
import {
  SafetyOutlined, TeamOutlined, PlusOutlined, EyeOutlined, EditOutlined,
  DeleteOutlined, UserOutlined, DollarOutlined, CalendarOutlined,
  BankOutlined, FileTextOutlined, IdcardOutlined, PhoneOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAuthStore, canEdit } from '../../stores/authStore';
import supabase from '../../utils/supabase';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface InsuranceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_no: string;
  department_name: string;
  insurance_type: string;        // 友邦团体综合险 / 友邦意外险 / 平安致优白金计划
  insurance_provider: string;    // 友邦保险 / 平安保险
  policy_number: string;
  insured_name: string;          // 被保人姓名
  relation: string;              // 本人 / 家属
  relation_detail: string;       // 家属关系说明（配偶/子女等）
  coverage_start: string;
  coverage_end: string;
  monthly_premium: number;
  coverage_amount: number;
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  remarks: string;
  created_at: string;
  updated_at: string;
}

const INSURANCE_TYPES = [
  '友邦团体综合险',
  '友邦意外险',
  '平安致优白金计划',
];

const INSURANCE_PROVIDERS = [
  '友邦保险',
  '平安保险',
];

const InsurancePage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdminUser = user ? canEdit(user.role) : false;

  const [data, setData] = useState<InsuranceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InsuranceRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<InsuranceRecord | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: insuranceData, error } = await supabase
        .from('insurance_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setData(getMockData());
      } else if (insuranceData && insuranceData.length > 0) {
        setData(insuranceData);
      } else {
        setData(getMockData());
      }
    } catch {
      setData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (): InsuranceRecord[] => [
    {
      id: '1', employee_id: 'emp-001', employee_name: '张三', employee_no: 'KY0001',
      department_name: '技术部', insurance_type: '友邦团体综合险', insurance_provider: '友邦保险',
      policy_number: 'AIA-GRP-2026-001', insured_name: '张三', relation: '本人',
      relation_detail: '', coverage_start: '2026-01-01', coverage_end: '2026-12-31',
      monthly_premium: 180, coverage_amount: 500000, status: 'active',
      remarks: '团体综合险-标准计划', created_at: '2026-01-01', updated_at: '2026-01-01',
    },
    {
      id: '2', employee_id: 'emp-001', employee_name: '张三', employee_no: 'KY0001',
      department_name: '技术部', insurance_type: '友邦团体综合险', insurance_provider: '友邦保险',
      policy_number: 'AIA-GRP-2026-002', insured_name: '李芳', relation: '家属',
      relation_detail: '配偶', coverage_start: '2026-01-01', coverage_end: '2026-12-31',
      monthly_premium: 150, coverage_amount: 300000, status: 'active',
      remarks: '团体综合险-家属计划', created_at: '2026-01-01', updated_at: '2026-01-01',
    },
    {
      id: '3', employee_id: 'emp-002', employee_name: '李四', employee_no: 'KY0002',
      department_name: '财务部', insurance_type: '友邦意外险', insurance_provider: '友邦保险',
      policy_number: 'AIA-ACC-2026-003', insured_name: '李四', relation: '本人',
      relation_detail: '', coverage_start: '2026-03-01', coverage_end: '2027-02-28',
      monthly_premium: 85, coverage_amount: 1000000, status: 'active',
      remarks: '意外险-高保额', created_at: '2026-03-01', updated_at: '2026-03-01',
    },
    {
      id: '4', employee_id: 'emp-003', employee_name: '王五', employee_no: 'KY0003',
      department_name: '行政部', insurance_type: '平安致优白金计划', insurance_provider: '平安保险',
      policy_number: 'PA-ZY-2026-004', insured_name: '王五', relation: '本人',
      relation_detail: '', coverage_start: '2026-01-01', coverage_end: '2026-12-31',
      monthly_premium: 320, coverage_amount: 800000, status: 'active',
      remarks: '白金计划-含门诊', created_at: '2026-01-01', updated_at: '2026-01-01',
    },
    {
      id: '5', employee_id: 'emp-004', employee_name: '赵六', employee_no: 'KY0004',
      department_name: '运营部', insurance_type: '友邦团体综合险', insurance_provider: '友邦保险',
      policy_number: 'AIA-GRP-2025-005', insured_name: '赵六', relation: '本人',
      relation_detail: '', coverage_start: '2025-06-01', coverage_end: '2026-05-31',
      monthly_premium: 180, coverage_amount: 500000, status: 'expired',
      remarks: '已到期需续保', created_at: '2025-06-01', updated_at: '2025-06-01',
    },
    {
      id: '6', employee_id: 'emp-005', employee_name: '钱七', employee_no: 'KY0005',
      department_name: '人事部', insurance_type: '友邦团体综合险', insurance_provider: '友邦保险',
      policy_number: 'AIA-GRP-2026-006', insured_name: '钱七', relation: '本人',
      relation_detail: '', coverage_start: '2026-06-01', coverage_end: '2026-12-31',
      monthly_premium: 180, coverage_amount: 500000, status: 'pending',
      remarks: '新入职待生效', created_at: '2026-06-01', updated_at: '2026-06-01',
    },
    {
      id: '7', employee_id: 'emp-005', employee_name: '钱七', employee_no: 'KY0005',
      department_name: '人事部', insurance_type: '友邦团体综合险', insurance_provider: '友邦保险',
      policy_number: 'AIA-GRP-2026-007', insured_name: '钱小明', relation: '家属',
      relation_detail: '子女', coverage_start: '2026-06-01', coverage_end: '2026-12-31',
      monthly_premium: 120, coverage_amount: 200000, status: 'pending',
      remarks: '家属-子女计划', created_at: '2026-06-01', updated_at: '2026-06-01',
    },
    {
      id: '8', employee_id: 'emp-006', employee_name: '孙八', employee_no: 'KY0006',
      department_name: '市场部', insurance_type: '友邦意外险', insurance_provider: '友邦保险',
      policy_number: 'AIA-ACC-2026-008', insured_name: '孙八', relation: '本人',
      relation_detail: '', coverage_start: '2026-01-01', coverage_end: '2026-12-31',
      monthly_premium: 65, coverage_amount: 500000, status: 'active',
      remarks: '', created_at: '2026-01-01', updated_at: '2026-01-01',
    },
  ];

  // 根据角色过滤数据
  const filteredData = useMemo(() => {
    if (isAdminUser) {
      return data;
    }
    // 普通员工只看到自己的保险
    return data.filter((item) => item.employee_name === user?.display_name);
  }, [data, isAdminUser, user]);

  // 统计数据
  const stats = useMemo(() => {
    const active = filteredData.filter((d) => d.status === 'active');
    const totalPremium = active.reduce((sum, d) => sum + d.monthly_premium, 0);
    const employeeCount = new Set(filteredData.map((d) => d.employee_id)).size;
    const totalInsured = filteredData.filter((d) => d.status === 'active').length;
    return {
      totalInsured,
      employeeCount,
      totalPremium,
      activeCount: active.length,
      expiredCount: filteredData.filter((d) => d.status === 'expired').length,
      pendingCount: filteredData.filter((d) => d.status === 'pending').length,
    };
  }, [filteredData]);

  const columns = [
    {
      title: '员工工号',
      dataIndex: 'employee_no',
      key: 'employee_no',
      width: 100,
    },
    {
      title: '员工姓名',
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 90,
    },
    ...(isAdminUser ? [{
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
      width: 90,
    }] : []),
    {
      title: '被保人',
      dataIndex: 'insured_name',
      key: 'insured_name',
      width: 90,
    },
    {
      title: '关系',
      dataIndex: 'relation',
      key: 'relation',
      width: 70,
      render: (text: string, record: InsuranceRecord) => (
        <Tag color={text === '本人' ? 'blue' : 'orange'}>
          {text === '家属' ? `${text}（${record.relation_detail}）` : text}
        </Tag>
      ),
    },
    {
      title: '保险类型',
      dataIndex: 'insurance_type',
      key: 'insurance_type',
      width: 150,
      ellipsis: true,
    },
    {
      title: '保险公司',
      dataIndex: 'insurance_provider',
      key: 'insurance_provider',
      width: 90,
      render: (text: string) => (
        <Tag color={text === '友邦保险' ? 'green' : 'purple'}>{text}</Tag>
      ),
    },
    {
      title: '保单号',
      dataIndex: 'policy_number',
      key: 'policy_number',
      width: 160,
      ellipsis: true,
    },
    {
      title: '保障期限',
      key: 'coverage_period',
      width: 180,
      render: (_: any, record: InsuranceRecord) => (
        <span style={{ fontSize: 12 }}>
          {record.coverage_start} ~ {record.coverage_end}
        </span>
      ),
    },
    {
      title: '月保费',
      dataIndex: 'monthly_premium',
      key: 'monthly_premium',
      width: 90,
      align: 'right' as const,
      render: (val: number) => (
        <Text style={{ color: '#1890ff' }}>¥{val.toLocaleString()}</Text>
      ),
    },
    {
      title: '保额',
      dataIndex: 'coverage_amount',
      key: 'coverage_amount',
      width: 100,
      align: 'right' as const,
      render: (val: number) => {
        const wan = val / 10000;
        return <Text>{wan}万</Text>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const map: Record<string, { color: string; label: string }> = {
          active: { color: 'success', label: '生效中' },
          expired: { color: 'error', label: '已到期' },
          pending: { color: 'processing', label: '待生效' },
          cancelled: { color: 'default', label: '已取消' },
        };
        const config = map[status] || map.active;
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: isAdminUser ? 140 : 80,
      fixed: 'right' as const,
      render: (_: any, record: InsuranceRecord) => (
        <Space size="small">
          <Button
            type="link" size="small"
            icon={<EyeOutlined />}
            onClick={() => { setSelectedRecord(record); setDetailOpen(true); }}
          >
            查看
          </Button>
          {isAdminUser && (
            <>
              <Button
                type="link" size="small"
                icon={<EditOutlined />}
                onClick={() => { setEditingRecord(record); form.setFieldsValue({ ...record, coverage_start: undefined, coverage_end: undefined }); setModalOpen(true); }}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定删除该保险记录？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定" cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    setData((prev) => prev.filter((item) => item.id !== id));
    message.success('已删除');
    // TODO: 同步删除 Supabase
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const newRecord: InsuranceRecord = {
        id: editingRecord?.id || `ins-${Date.now()}`,
        employee_id: values.employee_id || `emp-${Date.now()}`,
        employee_name: values.employee_name,
        employee_no: values.employee_no,
        department_name: values.department_name || '',
        insurance_type: values.insurance_type,
        insurance_provider: values.insurance_provider,
        policy_number: values.policy_number,
        insured_name: values.insured_name,
        relation: values.relation,
        relation_detail: values.relation === '家属' ? values.relation_detail : '',
        coverage_start: values.coverage_start?.format?.('YYYY-MM-DD') || values.coverage_start,
        coverage_end: values.coverage_end?.format?.('YYYY-MM-DD') || values.coverage_end,
        monthly_premium: values.monthly_premium,
        coverage_amount: values.coverage_amount,
        status: values.status,
        remarks: values.remarks || '',
        created_at: editingRecord?.created_at || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      if (editingRecord) {
        setData((prev) => prev.map((item) => (item.id === editingRecord.id ? newRecord : item)));
        message.success('保险记录已更新');
      } else {
        setData((prev) => [newRecord, ...prev]);
        message.success('保险记录已添加');
      }
      setModalOpen(false);
      // TODO: 同步写入 Supabase
    } catch {
      // 表单验证失败
    }
  };

  return (
    <div>
      <div className="page-header">
        <Title level={2}>
          <SafetyOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          保险模块
        </Title>
        <Text type="secondary">
          友邦商保团险 · 在保信息管理
          {!isAdminUser && <Tag color="blue" style={{ marginLeft: 8 }}>仅查看本人</Tag>}
          {isAdminUser && <Tag color="gold" style={{ marginLeft: 8 }}>管理员视图</Tag>}
        </Text>
      </div>

      {/* 统计卡片 */}
      <div className="stats-row">
        <Card className="stat-card">
          <Statistic title="在保人数" value={stats.totalInsured} prefix={<TeamOutlined />} />
          <Text type="secondary" style={{ fontSize: 12 }}>涉及 {stats.employeeCount} 名员工</Text>
        </Card>
        <Card className="stat-card">
          <Statistic title="月保费合计" value={stats.totalPremium} prefix={<DollarOutlined />} suffix="元" valueStyle={{ color: '#1890ff' }} />
        </Card>
        <Card className="stat-card">
          <Statistic title="生效中" value={stats.activeCount} prefix={<SafetyOutlined />} valueStyle={{ color: '#52c41a' }} />
        </Card>
        <Card className="stat-card">
          <Statistic title="待生效" value={stats.pendingCount} prefix={<CalendarOutlined />} valueStyle={{ color: stats.pendingCount > 0 ? '#faad14' : undefined }} />
        </Card>
        <Card className="stat-card">
          <Statistic title="已到期" value={stats.expiredCount} prefix={<FileTextOutlined />} valueStyle={{ color: stats.expiredCount > 0 ? '#ff4d4f' : undefined }} />
        </Card>
      </div>

      {/* 保险列表 */}
      <Card
        title={
          <Space>
            <SafetyOutlined />
            <span>在保信息列表</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
            {isAdminUser && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加保险记录
              </Button>
            )}
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条记录` }}
          size="middle"
          scroll={{ x: isAdminUser ? 1360 : 1200 }}
        />
      </Card>

      {/* 添加/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑保险记录' : '添加保险记录'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="employee_name" label="员工姓名" rules={[{ required: true, message: '请输入' }]}>
                <Input placeholder="请输入员工姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="employee_no" label="员工工号" rules={[{ required: true, message: '请输入' }]}>
                <Input placeholder="请输入工号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="department_name" label="部门">
                <Input placeholder="请输入部门" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="insured_name" label="被保人姓名" rules={[{ required: true, message: '请输入' }]}>
                <Input placeholder="请输入被保人姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="relation" label="与员工关系" rules={[{ required: true, message: '请选择' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="本人">本人</Select.Option>
                  <Select.Option value="家属">家属</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                noStyle
                shouldUpdate={(prev, cur) => prev.relation !== cur.relation}
              >
                {({ getFieldValue }) =>
                  getFieldValue('relation') === '家属' ? (
                    <Form.Item name="relation_detail" label="家属关系" rules={[{ required: true, message: '请输入' }]}>
                      <Select placeholder="请选择家属关系">
                        <Select.Option value="配偶">配偶</Select.Option>
                        <Select.Option value="子女">子女</Select.Option>
                        <Select.Option value="父母">父母</Select.Option>
                        <Select.Option value="其他">其他</Select.Option>
                      </Select>
                    </Form.Item>
                  ) : null
                }
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="insurance_type" label="保险类型" rules={[{ required: true, message: '请选择' }]}>
                <Select placeholder="请选择保险类型">
                  {INSURANCE_TYPES.map((t) => (
                    <Select.Option key={t} value={t}>{t}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="insurance_provider" label="保险公司" rules={[{ required: true, message: '请选择' }]}>
                <Select placeholder="请选择保险公司">
                  {INSURANCE_PROVIDERS.map((p) => (
                    <Select.Option key={p} value={p}>{p}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="policy_number" label="保单号" rules={[{ required: true, message: '请输入' }]}>
                <Input placeholder="请输入保单号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="coverage_start" label="保障起始日" rules={[{ required: true, message: '请选择' }]}>
                <DatePicker style={{ width: '100%' }} placeholder="请选择起始日期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="coverage_end" label="保障截止日" rules={[{ required: true, message: '请选择' }]}>
                <DatePicker style={{ width: '100%' }} placeholder="请选择截止日期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择' }]}>
                <Select placeholder="请选择状态">
                  <Select.Option value="active">生效中</Select.Option>
                  <Select.Option value="pending">待生效</Select.Option>
                  <Select.Option value="expired">已到期</Select.Option>
                  <Select.Option value="cancelled">已取消</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="monthly_premium" label="月保费（元）" rules={[{ required: true, message: '请输入' }]}>
                <InputNumber min={0} step={1} style={{ width: '100%' }} placeholder="请输入月保费" prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="coverage_amount" label="保额（元）" rules={[{ required: true, message: '请输入' }]}>
                <InputNumber min={0} step={10000} style={{ width: '100%' }} placeholder="请输入保额" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="employee_id" hidden>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="remarks" label="备注">
                <TextArea rows={2} placeholder="可选备注信息" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="保险记录详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={<Button onClick={() => setDetailOpen(false)}>关闭</Button>}
        width={640}
      >
        {selectedRecord && (
          <Descriptions bordered column={2} size="small" style={{ marginTop: 16 }}>
            <Descriptions.Item label="员工姓名">{selectedRecord.employee_name}</Descriptions.Item>
            <Descriptions.Item label="员工工号">{selectedRecord.employee_no}</Descriptions.Item>
            <Descriptions.Item label="部门">{selectedRecord.department_name}</Descriptions.Item>
            <Descriptions.Item label="被保人">{selectedRecord.insured_name}</Descriptions.Item>
            <Descriptions.Item label="与员工关系">
              <Tag color={selectedRecord.relation === '本人' ? 'blue' : 'orange'}>
                {selectedRecord.relation === '家属'
                  ? `家属（${selectedRecord.relation_detail}）`
                  : selectedRecord.relation}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="保险类型" span={2}>{selectedRecord.insurance_type}</Descriptions.Item>
            <Descriptions.Item label="保险公司">
              <Tag color={selectedRecord.insurance_provider === '友邦保险' ? 'green' : 'purple'}>
                {selectedRecord.insurance_provider}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="保单号">{selectedRecord.policy_number}</Descriptions.Item>
            <Descriptions.Item label="保障期限">
              {selectedRecord.coverage_start} ~ {selectedRecord.coverage_end}
            </Descriptions.Item>
            <Descriptions.Item label="月保费">¥{selectedRecord.monthly_premium.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="保额">{(selectedRecord.coverage_amount / 10000).toFixed(0)}万元</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={
                selectedRecord.status === 'active' ? 'success'
                  : selectedRecord.status === 'pending' ? 'processing'
                  : selectedRecord.status === 'expired' ? 'error'
                  : 'default'
              }>
                {selectedRecord.status === 'active' ? '生效中'
                  : selectedRecord.status === 'pending' ? '待生效'
                  : selectedRecord.status === 'expired' ? '已到期'
                  : '已取消'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{selectedRecord.remarks || '无'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default InsurancePage;
