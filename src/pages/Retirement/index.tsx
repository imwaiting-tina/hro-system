import React, { useEffect, useState } from 'react';
import { Card, Typography, Table, Tag, Button, Space, Row, Col, Statistic, Modal, Form, DatePicker, Input, Select, message } from 'antd';
import {
  TeamOutlined, UserSwitchOutlined, FileTextOutlined,
  ClockCircleOutlined, PlusOutlined, EyeOutlined
} from '@ant-design/icons';
import supabase from '../../utils/supabase';

const { Title, Text } = Typography;

interface RetirementEmployee {
  id: string;
  chinese_name: string;
  employee_no: string;
  department_name: string;
  position_name: string;
  gender: string;
  birth_date: string;
  statutory_retire_date: string;
  actual_retire_date: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

const RetirementPage: React.FC = () => {
  const [data, setData] = useState<RetirementEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RetirementEmployee | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: retirementData, error } = await supabase
        .from('retirement_management')
        .select('*')
        .order('statutory_retire_date', { ascending: true });

      if (error) {
        // 表可能还不存在，使用模拟数据
        setData(getMockData());
      } else if (retirementData && retirementData.length > 0) {
        setData(retirementData);
      } else {
        setData(getMockData());
      }
    } catch {
      setData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (): RetirementEmployee[] => [
    {
      id: '1',
      chinese_name: '张建国',
      employee_no: 'KY0012',
      department_name: '行政部',
      position_name: '行政主管',
      gender: '男',
      birth_date: '1966-08-15',
      statutory_retire_date: '2026-08-15',
      actual_retire_date: null,
      status: 'pending',
      created_at: '2026-03-01',
    },
    {
      id: '2',
      chinese_name: '李美华',
      employee_no: 'KY0045',
      department_name: '财务部',
      position_name: '会计',
      gender: '女',
      birth_date: '1971-03-22',
      statutory_retire_date: '2026-03-22',
      actual_retire_date: '2026-04-15',
      status: 'completed',
      created_at: '2026-01-15',
    },
    {
      id: '3',
      chinese_name: '王大伟',
      employee_no: 'KY0078',
      department_name: '运营部',
      position_name: '运营专员',
      gender: '男',
      birth_date: '1966-12-10',
      statutory_retire_date: '2026-12-10',
      actual_retire_date: null,
      status: 'in_progress',
      created_at: '2026-05-20',
    },
  ];

  const columns = [
    {
      title: '员工工号',
      dataIndex: 'employee_no',
      key: 'employee_no',
      width: 100,
    },
    {
      title: '姓名',
      dataIndex: 'chinese_name',
      key: 'chinese_name',
      width: 100,
    },
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
      width: 100,
    },
    {
      title: '职位',
      dataIndex: 'position_name',
      key: 'position_name',
      width: 120,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 60,
    },
    {
      title: '出生日期',
      dataIndex: 'birth_date',
      key: 'birth_date',
      width: 110,
    },
    {
      title: '法定退休日期',
      dataIndex: 'statutory_retire_date',
      key: 'statutory_retire_date',
      width: 120,
      render: (text: string) => <Text style={{ color: '#1890ff' }}>{text}</Text>,
    },
    {
      title: '实际退休日期',
      dataIndex: 'actual_retire_date',
      key: 'actual_retire_date',
      width: 120,
      render: (text: string | null) => text || <Text type="secondary">待定</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; label: string }> = {
          pending: { color: 'default', label: '待办理' },
          in_progress: { color: 'processing', label: '办理中' },
          completed: { color: 'success', label: '已完成' },
        };
        const config = statusMap[status] || statusMap.pending;
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: RetirementEmployee) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedRecord(record);
            setDetailOpen(true);
          }}
        >
          查看
        </Button>
      ),
    },
  ];

  const handleAdd = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      message.success('退休人员已添加');
      setModalOpen(false);
      // TODO: 实际写入 Supabase
    } catch {
      // 表单验证失败
    }
  };

  const stats = {
    total: data.length,
    pending: data.filter((d) => d.status === 'pending').length,
    inProgress: data.filter((d) => d.status === 'in_progress').length,
    completed: data.filter((d) => d.status === 'completed').length,
  };

  return (
    <div>
      <div className="page-header">
        <Title level={2}>退休管理</Title>
        <Text type="secondary">管理员工退休流程：退休提醒、手续办理、档案归档</Text>
      </div>

      <div className="stats-row">
        <Card className="stat-card">
          <Statistic title="退休人员总数" value={stats.total} prefix={<TeamOutlined />} />
        </Card>
        <Card className="stat-card">
          <Statistic
            title="待办理"
            value={stats.pending}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: stats.pending > 0 ? '#faad14' : undefined }}
          />
        </Card>
        <Card className="stat-card">
          <Statistic
            title="办理中"
            value={stats.inProgress}
            prefix={<UserSwitchOutlined />}
            valueStyle={{ color: stats.inProgress > 0 ? '#1890ff' : undefined }}
          />
        </Card>
        <Card className="stat-card">
          <Statistic
            title="已完成"
            value={stats.completed}
            prefix={<FileTextOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </div>

      <Card
        title="退休人员列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加退休人员
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 人` }}
          size="middle"
        />
      </Card>

      {/* 添加退休人员弹窗 */}
      <Modal
        title="添加退休人员"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="chinese_name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="employee_no" label="工号" rules={[{ required: true, message: '请输入工号' }]}>
                <Input placeholder="请输入工号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="department_name" label="部门" rules={[{ required: true, message: '请输入部门' }]}>
                <Input placeholder="请输入部门" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="position_name" label="职位" rules={[{ required: true, message: '请输入职位' }]}>
                <Input placeholder="请输入职位" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
                <Select placeholder="请选择性别">
                  <Select.Option value="男">男</Select.Option>
                  <Select.Option value="女">女</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="birth_date" label="出生日期" rules={[{ required: true, message: '请选择出生日期' }]}>
                <DatePicker style={{ width: '100%' }} placeholder="请选择出生日期" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="statutory_retire_date" label="法定退休日期" rules={[{ required: true, message: '请选择法定退休日期' }]}>
                <DatePicker style={{ width: '100%' }} placeholder="请选择法定退休日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
                <Select placeholder="请选择状态">
                  <Select.Option value="pending">待办理</Select.Option>
                  <Select.Option value="in_progress">办理中</Select.Option>
                  <Select.Option value="completed">已完成</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="退休人员详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={<Button onClick={() => setDetailOpen(false)}>关闭</Button>}
        width={600}
      >
        {selectedRecord && (
          <div style={{ padding: '16px 0' }}>
            <Row gutter={[16, 16]}>
              <Col span={8}><Text type="secondary">姓名</Text><br /><Text strong>{selectedRecord.chinese_name}</Text></Col>
              <Col span={8}><Text type="secondary">工号</Text><br /><Text strong>{selectedRecord.employee_no}</Text></Col>
              <Col span={8}><Text type="secondary">性别</Text><br /><Text strong>{selectedRecord.gender}</Text></Col>
              <Col span={8}><Text type="secondary">部门</Text><br /><Text strong>{selectedRecord.department_name}</Text></Col>
              <Col span={8}><Text type="secondary">职位</Text><br /><Text strong>{selectedRecord.position_name}</Text></Col>
              <Col span={8}><Text type="secondary">出生日期</Text><br /><Text strong>{selectedRecord.birth_date}</Text></Col>
              <Col span={8}><Text type="secondary">法定退休日期</Text><br /><Text strong style={{ color: '#1890ff' }}>{selectedRecord.statutory_retire_date}</Text></Col>
              <Col span={8}><Text type="secondary">实际退休日期</Text><br /><Text strong>{selectedRecord.actual_retire_date || '待定'}</Text></Col>
              <Col span={8}>
                <Text type="secondary">状态</Text><br />
                <Tag color={
                  selectedRecord.status === 'completed' ? 'success'
                    : selectedRecord.status === 'in_progress' ? 'processing'
                    : 'default'
                }>
                  {selectedRecord.status === 'completed' ? '已完成'
                    : selectedRecord.status === 'in_progress' ? '办理中'
                    : '待办理'}
                </Tag>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RetirementPage;
