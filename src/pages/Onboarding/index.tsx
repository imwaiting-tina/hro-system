import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Modal, Form, Input, Select, DatePicker, message,
  Typography, Card, Steps, Descriptions, Checkbox, Row, Col, Upload
} from 'antd';
import {
  PlusOutlined, EyeOutlined, CheckCircleOutlined, FileTextOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useAuthStore, canEdit } from '../../stores/authStore';
import supabase from '../../utils/supabase';
import type { DocStatus, OnboardingDocType } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const docTypeMap: Record<OnboardingDocType, { label: string; needSeal: boolean }> = {
  onboarding_guide: { label: '新员工入职引导表', needSeal: false },
  offer_letter: { label: '录用通知书', needSeal: false },
  employee_info_form: { label: '员工信息登记表', needSeal: false },
  recruitment_approval: { label: '录用审批单(第三联)', needSeal: false },
  intern_approval: { label: '应届生实习录用表', needSeal: false },
  rehire_approval: { label: '劳务录用审批单', needSeal: false },
  labor_contract: { label: '劳动合同(含4个附属文件)', needSeal: true },
  internship_agreement: { label: '实习协议', needSeal: true },
  service_agreement: { label: '劳务协议', needSeal: true },
  security_contract: { label: '保安劳动合同', needSeal: true },
  employee_handbook: { label: '员工手册', needSeal: true },
  other: { label: '其他', needSeal: false },
};

const docStatusMap: Record<DocStatus, { label: string; color: string }> = {
  pending: { label: '待准备', color: 'default' },
  pending_sign: { label: '待签署', color: 'processing' },
  pending_seal: { label: '待用印', color: 'warning' },
  sealed: { label: '已用印', color: 'cyan' },
  delivered: { label: '已交付', color: 'blue' },
  archived: { label: '已归档', color: 'success' },
};

const OnboardingPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    const [{ data: docs }, { data: empList }] = await Promise.all([
      supabase.from('onboarding_documents').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('id,chinese_name,employee_no'),
    ]);
    if (docs) setData(docs);
    if (empList) setEmployees(empList);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (values: any) => {
    const docType = values.doc_type as OnboardingDocType;
    await supabase.from('onboarding_documents').insert({
      ...values,
      need_seal: docTypeMap[docType]?.needSeal || false,
      seal_count: docType === 'labor_contract' ? 4 : 1,
    });
    message.success('入职文件已创建');
    setModalVisible(false);
    form.resetFields();
    fetchData();
  };

  const handleStatusChange = async (id: string, newStatus: DocStatus) => {
    await supabase.from('onboarding_documents').update({ status: newStatus }).eq('id', id);
    message.success('状态已更新');
    fetchData();
  };

  const columns = [
    { title: '员工', dataIndex: 'employee_id', width: 100,
      render: (id: string) => employees.find((e: any) => e.id === id)?.chinese_name || '-' },
    {
      title: '文件类型',
      dataIndex: 'doc_type',
      width: 200,
      render: (type: OnboardingDocType) => (
        <Space>
          <FileTextOutlined />
          <span>{docTypeMap[type]?.label || type}</span>
          {docTypeMap[type]?.needSeal && <Tag color="orange" style={{ fontSize: 10 }}>需用印</Tag>}
        </Space>
      ),
    },
    { title: '文件编号', dataIndex: 'doc_number', width: 120 },
    {
      title: '签署状态',
      dataIndex: 'signed',
      width: 100,
      render: (v: boolean) => v ? <Tag color="success">已签署</Tag> : <Tag>未签署</Tag>,
    },
    {
      title: '用印状态',
      dataIndex: 'sealed_at',
      width: 100,
      render: (v: string) => v ? <Tag color="cyan">已用印</Tag> : <Tag>未用印</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: DocStatus) => (
        <Tag color={docStatusMap[status]?.color}>{docStatusMap[status]?.label}</Tag>
      ),
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
          {canEdit(user!.role) && record.status === 'pending' && (
            <Button size="small" onClick={() => handleStatusChange(record.id, 'pending_sign')}>
              准备签署
            </Button>
          )}
          {record.need_seal && record.status === 'pending_sign' && canEdit(user!.role) && (
            <Button size="small" type="primary" onClick={() => handleStatusChange(record.id, 'pending_seal')}>
              申请用印
            </Button>
          )}
          {record.status === 'pending_seal' && canEdit(user!.role) && (
            <Button size="small" type="primary" onClick={() => handleStatusChange(record.id, 'sealed')}>
              确认用印
            </Button>
          )}
          {record.status === 'sealed' && canEdit(user!.role) && (
            <Button size="small" onClick={() => handleStatusChange(record.id, 'archived')}>
              归档
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={2}>入职管理</Title>
        <Text type="secondary">管理新员工入职所需全部文件（11类文件）、行政准备、用印流程</Text>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>入职文件清单</Title>
        <Row gutter={[16, 8]}>
          {Object.entries(docTypeMap).map(([key, val]) => (
            <Col span={12} key={key}>
              <Text>{val.label}</Text>
              {val.needSeal && <Tag color="orange" style={{ marginLeft: 8 }}>需用印</Tag>}
            </Col>
          ))}
        </Row>
      </Card>

      <Card>
        <div className="table-toolbar">
          <Text strong>共 {data.length} 条记录</Text>
          {canEdit(user!.role) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              form.resetFields();
              setModalVisible(true);
            }}>
              新建入职文件
            </Button>
          )}
        </div>

        <Table columns={columns} dataSource={data} rowKey="id"
          loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1100 }} />
      </Card>

      <Modal
        title="新建入职文件"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        onOk={() => form.submit()}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="employee_id" label="选择员工" rules={[{ required: true }]}>
            <Select
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={employees.map((e: any) => ({ label: `${e.chinese_name} (${e.employee_no})`, value: e.id }))}
            />
          </Form.Item>
          <Form.Item name="doc_type" label="文件类型" rules={[{ required: true }]}>
            <Select options={Object.entries(docTypeMap).map(([k, v]) => ({ label: v.label, value: k }))} />
          </Form.Item>
          <Form.Item name="doc_name" label="文件名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="doc_number" label="文件编号">
            <Input />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="文件详情" open={detailVisible} onCancel={() => setDetailVisible(false)}
        footer={null} width={500}>
        {selectedRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="员工">
              {employees.find((e: any) => e.id === selectedRecord.employee_id)?.chinese_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="文件类型">
              {docTypeMap[selectedRecord.doc_type as OnboardingDocType]?.label}
            </Descriptions.Item>
            <Descriptions.Item label="文件名称">{selectedRecord.doc_name}</Descriptions.Item>
            <Descriptions.Item label="文件编号">{selectedRecord.doc_number || '-'}</Descriptions.Item>
            <Descriptions.Item label="签署状态">
              {selectedRecord.signed ? <Tag color="success">已签署</Tag> : <Tag>未签署</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="需用印">{selectedRecord.need_seal ? `是 (${selectedRecord.seal_count}处)` : '否'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={docStatusMap[selectedRecord.status as DocStatus]?.color}>
                {docStatusMap[selectedRecord.status as DocStatus]?.label}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default OnboardingPage;
