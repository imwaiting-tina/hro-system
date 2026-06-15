import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Tag, Space, Modal, Form, Input, Select, DatePicker, message,
  Typography, Card, Steps, Descriptions, Badge, Row, Col, Statistic, Popconfirm,
  Tooltip
} from 'antd';
import {
  PlusOutlined, EyeOutlined, CheckCircleOutlined, DeleteOutlined,
  SearchOutlined, FilterOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useAuthStore, canEdit, canApprove } from '../../stores/authStore';
import supabase from '../../utils/supabase';
import type { OffboardingCase, OffboardingCaseStatus, OffboardingInitiatorType, OffboardingType } from '../../types';
import dayjs from 'dayjs';
import { useOffboardingContext } from './index';

const { Title, Text } = Typography;
const { TextArea } = Input;

// 状态配置
const statusConfig: Record<OffboardingCaseStatus, { label: string; color: string; badge: 'default' | 'processing' | 'success' | 'warning' | 'error' }> = {
  pending: { label: '待审批', color: '#faad14', badge: 'warning' },
  approved: { label: '已批准', color: '#1890ff', badge: 'processing' },
  handovering: { label: '交接中', color: '#722ed1', badge: 'processing' },
  settled: { label: '已结算', color: '#13c2c2', badge: 'processing' },
  closed: { label: '已关闭', color: '#52c41a', badge: 'success' },
};

// 类型配置
const typeConfig: Record<OffboardingType, string> = {
  resignation: '主动辞职',
  termination: '辞退/解雇',
  retirement: '退休',
};

const initiatorConfig: Record<OffboardingInitiatorType, string> = {
  employee: '员工发起',
  company: '公司发起',
};

// 原因代码字典
const reasonCodeMap: Record<string, string> = {
  salary: '薪酬待遇',
  career_growth: '职业发展',
  environment: '工作环境',
  management: '管理问题',
  personal: '个人原因',
  discipline: '违纪违规',
  layoff: '裁员优化',
  other: '其他',
};

const OffboardingListPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const { caseRefreshKey } = useOffboardingContext();
  const [data, setData] = useState<OffboardingCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OffboardingCase | null>(null);
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState<any[]>([]);

  // 筛选状态
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterDept, setFilterDept] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  // 统计
  const [stats, setStats] = useState({ total: 0, pending: 0, handovering: 0, closed: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('offboarding_cases')
        .select('*, employees!inner(name, employee_no, department, position), approver:users!offboarding_cases_approver_id_fkey(display_name)')
        .order('submitted_at', { ascending: false });

      const { data: result, error } = await query;

      if (!error && result) {
        let filtered = result.map((r: any) => ({
          ...r,
          employee_name: r.employees?.name || '',
          employee_department: r.employees?.department || '',
          employee_position: r.employees?.position || '',
          employee_no: r.employees?.employee_no || '',
          approver_name: r.approver?.display_name || '',
        }));

        // 前端筛选
        if (filterStatus) filtered = filtered.filter((r: OffboardingCase) => r.status === filterStatus);
        if (filterType) filtered = filtered.filter((r: OffboardingCase) => r.type === filterType);
        if (filterDept) filtered = filtered.filter((r: OffboardingCase) => r.employee_department === filterDept);
        if (searchText) {
          filtered = filtered.filter((r: OffboardingCase) =>
            r.employee_name?.toLowerCase().includes(searchText.toLowerCase()) ||
            r.reason_detail?.toLowerCase().includes(searchText.toLowerCase())
          );
        }

        setData(filtered);
        setStats({
          total: filtered.length,
          pending: filtered.filter((r: OffboardingCase) => r.status === 'pending').length,
          handovering: filtered.filter((r: OffboardingCase) => r.status === 'handovering').length,
          closed: filtered.filter((r: OffboardingCase) => r.status === 'closed').length,
        });
      } else {
        // 表不存在时使用空数据
        setData([]);
      }
    } catch {
      setData([]);
    }
    setLoading(false);
  }, [filterStatus, filterType, filterDept, searchText]);

  useEffect(() => { fetchData(); }, [fetchData, caseRefreshKey]);

  // 加载员工列表（用于创建表单选择）
  useEffect(() => {
    supabase.from('employees').select('id, name, employee_no, department').order('name')
      .then(({ data }) => { if (data) setEmployees(data); });
  }, []);

  // HR审批通过
  const handleApprove = async (record: OffboardingCase) => {
    Modal.confirm({
      title: '确认审批通过',
      content: `确定批准 ${record.employee_name} 的离职申请吗？批准后将自动生成交接清单。`,
      onOk: async () => {
        await supabase
          .from('offboarding_cases')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            approver_id: user?.id,
          })
          .eq('id', record.id);
        message.success('已批准，交接清单已自动生成');
        fetchData();
      },
    });
  };

  // 创建离职单
  const handleSubmit = async (values: any) => {
    const emp = employees.find((e) => e.id === values.employee_id);
    if (!emp) {
      message.error('请选择员工');
      return;
    }

    const insertData = {
      employee_id: values.employee_id,
      initiator_type: values.initiator_type,
      type: values.type,
      reason_code: values.reason_code,
      reason_detail: values.reason_detail,
      last_working_day: values.last_working_day?.format('YYYY-MM-DD'),
      status: 'pending',
      submitted_at: new Date().toISOString(),
      notes: values.notes,
    };

    const { error } = await supabase.from('offboarding_cases').insert(insertData);
    if (error) {
      message.error('提交失败：' + error.message);
      return;
    }
    message.success('离职申请已创建');
    setModalVisible(false);
    form.resetFields();
    fetchData();
  };

  // 删除离职单
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('offboarding_cases').delete().eq('id', id);
    if (error) {
      message.error('删除失败');
      return;
    }
    message.success('已删除');
    fetchData();
  };

  const columns = [
    {
      title: '员工',
      dataIndex: 'employee_name',
      width: 120,
      fixed: 'left' as const,
      render: (name: string, record: OffboardingCase) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.employee_department}</Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 110,
      render: (type: OffboardingType, record: OffboardingCase) => (
        <Space direction="vertical" size={0}>
          <Tag>{typeConfig[type]}</Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>{initiatorConfig[record.initiator_type]}</Text>
        </Space>
      ),
    },
    {
      title: '原因',
      dataIndex: 'reason_code',
      width: 120,
      render: (code: string) => reasonCodeMap[code] || code || '-',
    },
    {
      title: '最后工作日',
      dataIndex: 'last_working_day',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '提交时间',
      dataIndex: 'submitted_at',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('MM-DD HH:mm') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: OffboardingCaseStatus) => (
        <Badge status={statusConfig[status]?.badge} text={statusConfig[status]?.label} />
      ),
    },
    {
      title: '审批人',
      dataIndex: 'approver_name',
      width: 100,
      render: (name: string) => name || '-',
    },
    {
      title: '操作',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: OffboardingCase) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedRecord(record);
              setDetailVisible(true);
            }}
          >
            详情
          </Button>
          {record.status === 'pending' && user && canApprove(user.role) && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprove(record)}
            >
              批准
            </Button>
          )}
          {record.status === 'approved' && user && canEdit(user.role) && (
            <Button
              size="small"
              onClick={() => {
                window.open(`/hro-system/offboarding/${record.id}/handover`, '_self');
              }}
            >
              交接管理
            </Button>
          )}
          {record.status === 'handovering' && user && canEdit(user.role) && (
            <Button
              size="small"
              type="dashed"
              onClick={() => {
                window.open(`/hro-system/offboarding/${record.id}/settlement`, '_self');
              }}
            >
              结算
            </Button>
          )}
          {user && canEdit(user.role) && (
            <Popconfirm
              title="确定删除此离职单？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // 获取部门列表用于筛选
  const deptOptions = [...new Set(data.map((r) => r.employee_department).filter(Boolean))];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="总离职单" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="待审批" value={stats.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="交接中" value={stats.handovering} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="已关闭" value={stats.closed} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      {/* 流程步骤 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Steps
          current={-1}
          size="small"
          items={[
            { title: '提交申请', description: '员工/HR发起' },
            { title: 'HR审批', description: '批准后生成交接清单' },
            { title: '工作交接', description: '资产/知识/财务' },
            { title: '离职结算', description: '薪资+年假+补偿金' },
            { title: '流程关闭', description: '归档完成' },
          ]}
        />
      </Card>

      {/* 工具栏 + 表格 */}
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Space wrap>
            <Input.Search
              placeholder="搜索员工姓名/原因"
              allowClear
              style={{ width: 220 }}
              onSearch={setSearchText}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="按状态筛选"
              allowClear
              style={{ width: 130 }}
              value={filterStatus}
              onChange={setFilterStatus}
              options={Object.entries(statusConfig).map(([k, v]) => ({ label: v.label, value: k }))}
            />
            <Select
              placeholder="按类型筛选"
              allowClear
              style={{ width: 130 }}
              value={filterType}
              onChange={setFilterType}
              options={Object.entries(typeConfig).map(([k, v]) => ({ label: v, value: k }))}
            />
            <Select
              placeholder="按部门筛选"
              allowClear
              style={{ width: 160 }}
              value={filterDept}
              onChange={setFilterDept}
              options={deptOptions.map((d) => ({ label: d, value: d }))}
            />
            <Tooltip title="刷新">
              <Button icon={<ReloadOutlined />} onClick={fetchData} />
            </Tooltip>
          </Space>
          {user && canEdit(user.role) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              form.resetFields();
              setModalVisible(true);
            }}>
              新建离职单
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条离职记录`,
          }}
        />
      </Card>

      {/* 新建离职单弹窗 */}
      <Modal
        title="新建离职单"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        onOk={() => form.submit()}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="employee_id" label="选择员工" rules={[{ required: true, message: '请选择员工' }]}>
            <Select
              showSearch
              placeholder="搜索员工姓名"
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={employees.map((emp) => ({
                label: `${emp.name} (${emp.employee_no || ''}) - ${emp.department || ''}`,
                value: emp.id,
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="initiator_type" label="发起方" rules={[{ required: true }]}>
                <Select
                  options={Object.entries(initiatorConfig).map(([k, v]) => ({ label: v, value: k }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="离职类型" rules={[{ required: true }]}>
                <Select
                  options={Object.entries(typeConfig).map(([k, v]) => ({ label: v, value: k }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="reason_code" label="原因分类">
                <Select
                  options={Object.entries(reasonCodeMap).map(([k, v]) => ({ label: v, value: k }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="last_working_day"
                label="最后工作日"
                rules={[{ required: true, message: '请选择最后工作日' }]}
              >
                <DatePicker style={{ width: '100%' }}
                  disabledDate={(current) => current && current < dayjs().add(30, 'day').startOf('day')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="reason_detail" label="详细说明">
            <TextArea rows={3} placeholder="请详细描述离职原因..." />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="其他备注信息..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="离职单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={650}
        destroyOnClose
      >
        {selectedRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="员工">{selectedRecord.employee_name}</Descriptions.Item>
            <Descriptions.Item label="工号">{selectedRecord.employee_no}</Descriptions.Item>
            <Descriptions.Item label="部门">{selectedRecord.employee_department}</Descriptions.Item>
            <Descriptions.Item label="职位">{selectedRecord.employee_position}</Descriptions.Item>
            <Descriptions.Item label="离职类型">
              <Tag>{typeConfig[selectedRecord.type]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="发起方">
              <Tag color={selectedRecord.initiator_type === 'employee' ? 'blue' : 'red'}>
                {initiatorConfig[selectedRecord.initiator_type]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="原因分类">
              {reasonCodeMap[selectedRecord.reason_code] || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge
                status={statusConfig[selectedRecord.status]?.badge}
                text={statusConfig[selectedRecord.status]?.label}
              />
            </Descriptions.Item>
            <Descriptions.Item label="最后工作日">
              {selectedRecord.last_working_day ? dayjs(selectedRecord.last_working_day).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="提交时间">
              {selectedRecord.submitted_at ? dayjs(selectedRecord.submitted_at).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="审批人">{selectedRecord.approver_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="审批时间">
              {selectedRecord.approved_at ? dayjs(selectedRecord.approved_at).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="补偿金">
              {selectedRecord.compensation_amount ? `¥${selectedRecord.compensation_amount.toLocaleString()}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="详细原因" span={2}>
              {selectedRecord.reason_detail || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              {selectedRecord.notes || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default OffboardingListPage;
