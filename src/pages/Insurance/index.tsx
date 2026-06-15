import React, { useEffect, useState, useMemo } from 'react';
import {
  Card, Typography, Table, Tag, Button, Space, Row, Col, Statistic, Modal, Form,
  Input, Select, DatePicker, InputNumber, message, Popconfirm, Descriptions, Tooltip,
  Tabs, Collapse, List, Divider
} from 'antd';
import {
  SafetyOutlined, TeamOutlined, PlusOutlined, EyeOutlined, EditOutlined,
  DeleteOutlined, UserOutlined, DollarOutlined, CalendarOutlined,
  BankOutlined, FileTextOutlined, IdcardOutlined, PhoneOutlined,
  ReloadOutlined, FileProtectOutlined, AuditOutlined
} from '@ant-design/icons';
import { useAuthStore, canEdit } from '../../stores/authStore';
import supabase from '../../utils/supabase';
import { REAL_INSURANCE_DATA } from './realData';
import type { InsuranceRecord } from './realData';
import { ALL_POLICIES } from './policyData';
import type { PolicyInfo, PolicyPlan } from './policyData';

const { Title, Text } = Typography;
const { TextArea } = Input;

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
  const [activeTab, setActiveTab] = useState<string>('personnel');

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

      if (error || !insuranceData || insuranceData.length === 0) {
        setData(REAL_INSURANCE_DATA);
      } else {
        setData(insuranceData);
      }
    } catch {
      setData(REAL_INSURANCE_DATA);
    } finally {
      setLoading(false);
    }
  };

  // 根据角色过滤数据
  const filteredData = useMemo(() => {
    if (isAdminUser) {
      return data;
    }
    // 普通员工只看到自己的保险
    return data.filter((item) => item.employee_name === user?.display_name);
  }, [data, isAdminUser, user]);

  // 根据角色过滤保单数据
  const filteredPolicies = useMemo(() => {
    if (isAdminUser) {
      return ALL_POLICIES;
    }
    // 普通员工只看到自己关联的保单
    return ALL_POLICIES.filter((policy) =>
      policy.insured_employees.includes(user?.display_name || '')
    );
  }, [isAdminUser, user]);

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

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'personnel',
            label: (
              <span><TeamOutlined />在保人员</span>
            ),
            children: (
              <>
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
          pagination={{ pageSize: 20, showTotal: (total) => `共 ${total} 条记录`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
          size="middle"
          scroll={{ x: isAdminUser ? 1360 : 1200 }}
        />
      </Card>
              </>
            ),
          },
          {
            key: 'policies',
            label: (
              <span><FileProtectOutlined />保单查阅</span>
            ),
            children: (
              <PolicyView policies={filteredPolicies} />
            ),
          },
        ]}
      />

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

// ============================================================
// 保单查阅子组件
// ============================================================
const PolicyView: React.FC<{ policies: PolicyInfo[] }> = ({ policies }) => {
  const { user } = useAuthStore();
  const isAdminUser = user ? canEdit(user.role) : false;

  if (policies.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          <FileProtectOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>暂无关联保单</div>
        </div>
      </Card>
    );
  }

  const formatCurrency = (val: number) => `¥${val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div>
      {policies.map((policy) => (
        <Card
          key={policy.id}
          style={{ marginBottom: 24 }}
          title={
            <Space>
              <FileProtectOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontWeight: 600 }}>{policy.policy_name}</span>
              <Tag color="blue">{policy.policy_number}</Tag>
            </Space>
          }
          extra={
            <Space>
              <Tag color={policy.insurance_provider === '友邦保险' ? 'green' : 'purple'}>
                {policy.insurance_provider}
              </Tag>
            </Space>
          }
        >
          {/* 保单基本信息 */}
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="保险类型">
              <Tag color="blue">{policy.insurance_type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="合同期间">{policy.contract_period}</Descriptions.Item>
            <Descriptions.Item label="缴费方式">{policy.payment_method}</Descriptions.Item>
            <Descriptions.Item label="总被保人数">{policy.total_insured}人</Descriptions.Item>
            <Descriptions.Item label="年保费">
              <Text strong style={{ color: '#1890ff' }}>{formatCurrency(policy.annual_premium)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="保障概要">{policy.coverage_summary}</Descriptions.Item>
          </Descriptions>

          {/* 保障计划明细 */}
          <Divider orientation="left" plain>
            <AuditOutlined style={{ marginRight: 6 }} />
            保障计划明细
          </Divider>

          <Collapse
            size="small"
            items={policy.plans.map((plan: PolicyPlan, idx: number) => ({
              key: `${policy.id}-plan-${idx}`,
              label: (
                <Space>
                  <span style={{ fontWeight: 500 }}>{plan.plan_name}</span>
                  {plan.department && <Tag color="geekblue">{plan.department}</Tag>}
                  <Tag color="gold">{formatCurrency(plan.monthly_premium)}/月</Tag>
                </Space>
              ),
              children: (
                <Table
                  dataSource={plan.coverage_items.map((item, i) => ({ ...item, key: i }))}
                  columns={[
                    { title: '保障项目', dataIndex: 'item_name', key: 'item_name', width: 200 },
                    { title: '保额/保障内容', dataIndex: 'coverage_amount', key: 'coverage_amount' },
                  ]}
                  pagination={false}
                  size="small"
                  bordered
                />
              ),
            }))}
          />

          {/* 特别约定 */}
          {policy.special_terms.length > 0 && (
            <>
              <Divider orientation="left" plain style={{ marginTop: 24 }}>
                特别约定
              </Divider>
              <List
                size="small"
                dataSource={policy.special_terms}
                renderItem={(item: string) => (
                  <List.Item style={{ paddingLeft: 8 }}>
                    <Text type="secondary">• {item}</Text>
                  </List.Item>
                )}
              />
            </>
          )}

          {/* 关联信息 */}
          <Divider orientation="left" plain style={{ marginTop: 24 }}>
            关联信息
          </Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Text type="secondary">关联分支机构：</Text>
              {policy.insured_branches.map((b) => (
                <Tag key={b} style={{ marginBottom: 4 }}>{b}</Tag>
              ))}
            </Col>
            <Col span={12}>
              <Text type="secondary">
                {isAdminUser
                  ? `关联员工：${policy.insured_employees.length}人`
                  : '关联员工：本人'}
              </Text>
              {isAdminUser && (
                <div style={{ marginTop: 4 }}>
                  {policy.insured_employees.map((name) => (
                    <Tag key={name} color="default" style={{ marginBottom: 4 }}>{name}</Tag>
                  ))}
                </div>
              )}
            </Col>
          </Row>
        </Card>
      ))}
    </div>
  );
};

export default InsurancePage;
