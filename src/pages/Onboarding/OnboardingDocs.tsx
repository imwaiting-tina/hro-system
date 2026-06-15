import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, Select, message, Typography, Card, Row, Col, Tooltip, Popconfirm, Steps } from 'antd';
import {
  PlusOutlined, EyeOutlined, FileTextOutlined, CheckCircleOutlined,
  SafetyCertificateOutlined, SendOutlined, TeamOutlined,
  ContainerOutlined, HistoryOutlined,
} from '@ant-design/icons';
import { useAuthStore, canEdit } from '../../stores/authStore';
import supabase from '../../utils/supabase';
import type { DocStatus, OnboardingDocType } from '../../types';

const { Title, Text } = Typography;

const docTypeMap: Record<OnboardingDocType, { label: string; needSeal: boolean; employeeTypes: string[]; needDuplicate: boolean }> = {
  onboarding_guide: { label: '新员工入职引导表', needSeal: false, employeeTypes: ['full_time', 'intern'], needDuplicate: false },
  offer_letter: { label: '录用通知书', needSeal: false, employeeTypes: ['full_time', 'intern'], needDuplicate: false },
  employee_info_form: { label: '员工信息登记表', needSeal: false, employeeTypes: ['full_time', 'intern', 'retired_rehire', 'security'], needDuplicate: false },
  recruitment_approval: { label: '录用审批单', needSeal: false, employeeTypes: ['full_time'], needDuplicate: false },
  intern_approval: { label: '应届生实习录用表', needSeal: false, employeeTypes: ['intern'], needDuplicate: false },
  rehire_approval: { label: '劳务录用审批单', needSeal: false, employeeTypes: ['retired_rehire'], needDuplicate: false },
  labor_contract: { label: '劳动合同(含4个附属文件)', needSeal: true, employeeTypes: ['full_time'], needDuplicate: true },
  internship_agreement: { label: '实习协议', needSeal: true, employeeTypes: ['intern'], needDuplicate: true },
  service_agreement: { label: '劳务协议', needSeal: true, employeeTypes: ['retired_rehire'], needDuplicate: true },
  security_contract: { label: '保安劳动合同', needSeal: true, employeeTypes: ['security'], needDuplicate: true },
  employee_handbook: { label: '员工手册', needSeal: true, employeeTypes: ['full_time', 'intern', 'retired_rehire', 'security'], needDuplicate: false },
  other: { label: '其他', needSeal: false, employeeTypes: [], needDuplicate: false },
};

const docStatusMap: Record<DocStatus, { label: string; color: string }> = {
  pending: { label: '待准备', color: 'default' },
  pending_sign: { label: '待签署', color: 'processing' },
  pending_seal: { label: '待用印', color: 'warning' },
  sealed: { label: '已用印', color: 'cyan' },
  company_archived: { label: '公司联已归档', color: 'blue' },
  returned_to_employee: { label: '员工联已归还', color: 'green' },
  archived: { label: '全部归档', color: 'success' },
};

import { useOutletContext } from 'react-router-dom';
import type { OnboardingContext } from './index';

const OnboardingDocs: React.FC = () => {
  const { selectedEmployeeId: employeeId } = useOutletContext<OnboardingContext>();
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
    let query = supabase.from('onboarding_documents').select('*').order('created_at', { ascending: false });
    if (employeeId) query = query.eq('employee_id', employeeId);
    const [{ data: docs }, { data: empList }] = await Promise.all([
      query,
      supabase.from('employees').select('id,chinese_name,employee_no,employee_type'),
    ]);
    if (docs) setData(docs);
    if (empList) setEmployees(empList);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [employeeId]);

  const getCurrentEmployeeType = () => {
    if (!employeeId) return null;
    const emp = employees.find((e: any) => e.id === employeeId);
    return emp?.employee_type || null;
  };

  const handleSubmit = async (values: any) => {
    const docType = values.doc_type as OnboardingDocType;
    const isDuplicate = docTypeMap[docType]?.needDuplicate || false;
    await supabase.from('onboarding_documents').insert({
      ...values,
      employee_id: employeeId || values.employee_id,
      need_seal: docTypeMap[docType]?.needSeal || false,
      seal_count: docType === 'labor_contract' ? 4 : 1,
      copy_count: isDuplicate ? 2 : 1,
      company_copy_status: isDuplicate ? 'pending' : null,
      employee_copy_status: isDuplicate ? 'pending' : null,
    });
    message.success('入职文件已创建');
    setModalVisible(false);
    form.resetFields();
    fetchData();
  };

  const handleStatusChange = async (id: string, newStatus: DocStatus, extra?: Record<string, any>) => {
    const updateData: any = { status: newStatus, ...extra };
    await supabase.from('onboarding_documents').update(updateData).eq('id', id);
    message.success('状态已更新');
    fetchData();
  };

  const handleCompanyArchive = async (id: string) => {
    await supabase.from('onboarding_documents').update({
      status: 'company_archived',
      company_copy_status: 'archived',
      company_copy_archived_at: new Date().toISOString(),
    }).eq('id', id);
    message.success('公司联已归档');
    fetchData();
  };

  const handleReturnToEmployee = async (id: string) => {
    await supabase.from('onboarding_documents').update({
      status: 'returned_to_employee',
      employee_copy_status: 'returned',
      employee_copy_returned_at: new Date().toISOString(),
      returned_to_employee: true,
    }).eq('id', id);
    message.success('员工联已归还本人');
    fetchData();
  };

  const handleFullArchive = async (id: string) => {
    await supabase.from('onboarding_documents').update({
      status: 'archived',
      company_copy_status: 'archived',
      employee_copy_status: 'returned',
      company_copy_archived_at: new Date().toISOString(),
      employee_copy_returned_at: new Date().toISOString(),
    }).eq('id', id);
    message.success('一式两份均已归档');
    fetchData();
  };

  const renderCopyStatus = (record: any) => {
    if (!record.copy_count || record.copy_count <= 1) return <Tag>单份</Tag>;

    const companyTag = record.company_copy_status === 'archived'
      ? <Tag color="blue">公司联 ✓</Tag>
      : <Tag color="default">公司联</Tag>;

    const employeeTag = record.employee_copy_status === 'returned' || record.returned_to_employee
      ? <Tag color="green">员工联 ✓</Tag>
      : <Tag color="default">员工联</Tag>;

    return <Space size={4}>{companyTag}{employeeTag}</Space>;
  };

  const columns = [
    { title: '员工', dataIndex: 'employee_id', width: 80,
      render: (id: string) => employees.find((e: any) => e.id === id)?.chinese_name || '-' },
    {
      title: '文件类型', dataIndex: 'doc_type', width: 200,
      render: (type: OnboardingDocType) => (
        <div>
          <FileTextOutlined style={{ marginRight: 4, color: '#8c8c8c', verticalAlign: -1 }} />
          <span style={{ fontWeight: 500 }}>{docTypeMap[type]?.label || type}</span>
          {docTypeMap[type]?.needSeal && <Tag color="orange" style={{ marginLeft: 6, fontSize: 11 }}>需用印</Tag>}
          {docTypeMap[type]?.needDuplicate && <Tag color="purple" style={{ marginLeft: 2, fontSize: 11 }}>一式两份</Tag>}
        </div>
      ),
    },
    { title: '编号', dataIndex: 'doc_number', width: 100, ellipsis: true },
    { title: '签署', dataIndex: 'signed', width: 72, align: 'center' as const,
      render: (v: boolean) => v ? <Tag color="success">已签</Tag> : <Tag>未签</Tag> },
    { title: '用印', dataIndex: 'sealed_at', width: 72, align: 'center' as const,
      render: (v: string) => v ? <Tag color="cyan">已印</Tag> : <Tag>未印</Tag> },
    { title: '状态', dataIndex: 'status', width: 110,
      render: (status: DocStatus) => <Tag color={docStatusMap[status]?.color}>{docStatusMap[status]?.label}</Tag> },
    {
      title: '一式两份状态', dataIndex: 'id', width: 130,
      render: (_: string, record: any) => renderCopyStatus(record) },
    {
      title: '操作', width: 340, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size={4} wrap>
          <Button size="small" icon={<EyeOutlined />}
            onClick={() => { setSelectedRecord(record); setDetailVisible(true); }}>详情</Button>

          {user && canEdit(user.role) && record.status === 'pending' && (
            <Button size="small" onClick={() => handleStatusChange(record.id, 'pending_sign')}>准备签署</Button>
          )}

          {record.need_seal && record.status === 'pending_sign' && user && canEdit(user.role) && (
            <Button size="small" type="primary" onClick={() => handleStatusChange(record.id, 'pending_seal')}>申请用印</Button>
          )}

          {record.status === 'pending_seal' && user && canEdit(user.role) && (
            <Tooltip title={record.copy_count > 1 ? '一式两份同时用印' : '确认用印'}>
              <Button size="small" type="primary"
                onClick={() => handleStatusChange(record.id, 'sealed', {
                  sealed_at: new Date().toISOString(),
                  company_copy_status: record.copy_count > 1 ? 'sealed' : null,
                  employee_copy_status: record.copy_count > 1 ? 'sealed' : null,
                })}>确认用印</Button>
            </Tooltip>
          )}

          {record.status === 'sealed' && record.copy_count > 1 && user && canEdit(user.role) && (
            <Popconfirm title="确认将公司联归档？" onConfirm={() => handleCompanyArchive(record.id)}>
              <Button size="small" icon={<ContainerOutlined />}>公司联归档</Button>
            </Popconfirm>
          )}

          {record.status === 'company_archived' && user && canEdit(user.role) && (
            <Popconfirm title="确认将员工联归还本人？" onConfirm={() => handleReturnToEmployee(record.id)}>
              <Button size="small" type="primary" icon={<SendOutlined />}>归还本人</Button>
            </Popconfirm>
          )}

          {record.status === 'returned_to_employee' && user && canEdit(user.role) && (
            <Button size="small" icon={<CheckCircleOutlined />}
              onClick={() => handleFullArchive(record.id)}>全部归档</Button>
          )}

          {record.status === 'sealed' && (!record.copy_count || record.copy_count <= 1) && user && canEdit(user.role) && (
            <Button size="small" onClick={() => handleStatusChange(record.id, 'archived')}>归档</Button>
          )}
        </Space>
      ),
    },
  ];

  const employeeType = getCurrentEmployeeType();
  const recommendedTypes = employeeType
    ? (Object.entries(docTypeMap) as [OnboardingDocType, typeof docTypeMap[keyof typeof docTypeMap]][])
        .filter(([_, v]) => v.employeeTypes.includes(employeeType) || v.employeeTypes.length === 0)
        .map(([k]) => k)
    : Object.keys(docTypeMap) as OnboardingDocType[];

  return (
    <div>
      {/* 流程说明 */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>入职文件清单</Title>
        <Row gutter={[16, 8]}>
          {Object.entries(docTypeMap).map(([key, val]) => (
            <Col span={12} key={key}>
              <Text>{val.label}</Text>
              {val.needSeal && <Tag color="orange" style={{ marginLeft: 8 }}>需用印</Tag>}
              {val.needDuplicate && <Tag color="purple" style={{ marginLeft: 4 }}>一式两份</Tag>}
              {employeeType && !val.employeeTypes.includes(employeeType) && val.employeeTypes.length > 0 && (
                <Tag color="default" style={{ marginLeft: 4 }}>不适用</Tag>
              )}
            </Col>
          ))}
        </Row>
      </Card>

      {/* 一式两份流程说明 */}
      <Card style={{ marginBottom: 16, background: '#f6f8fa' }}>
        <Title level={5} style={{ marginBottom: 16 }}>
          <HistoryOutlined style={{ marginRight: 8 }} />
          一式两份文档流转步骤
        </Title>
        <Steps
          size="small"
          current={-1}
          items={[
            { title: '待签署', description: '员工签署', icon: <FileTextOutlined /> },
            { title: '待用印', description: '申请盖章', icon: <SafetyCertificateOutlined /> },
            { title: '已用印', description: '一式两份盖章完成', icon: <CheckCircleOutlined /> },
            { title: '公司联归档', description: '公司留存一份', icon: <ContainerOutlined /> },
            { title: '归还本人', description: '员工联交还本人', icon: <SendOutlined /> },
            { title: '全部归档', description: '流程完结', icon: <TeamOutlined /> },
          ]}
        />
      </Card>

      <Card>
        <div className="table-toolbar">
          <Text strong>共 {data.length} 条记录</Text>
          {user && canEdit(user.role) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              form.resetFields();
              if (employeeId) form.setFieldsValue({ employee_id: employeeId });
              setModalVisible(true);
            }}>新建入职文件</Button>
          )}
        </div>
        <Table className="onboarding-docs-table" columns={columns} dataSource={data} rowKey="id" size="middle"
          loading={loading} pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t: number) => `共 ${t} 条` }}
          scroll={{ x: 1144 }} />
      </Card>

      <Modal title="新建入职文件" open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        onOk={() => form.submit()} width={500}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!employeeId && (
            <Form.Item name="employee_id" label="选择员工" rules={[{ required: true }]}>
              <Select showSearch filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                options={employees.map((e: any) => ({ label: `${e.chinese_name} (${e.employee_no})`, value: e.id }))} />
            </Form.Item>
          )}
          <Form.Item name="doc_type" label="文件类型" rules={[{ required: true }]}>
            <Select options={Object.entries(docTypeMap)
              .filter(([k]) => recommendedTypes.includes(k as OnboardingDocType))
              .map(([k, v]) => ({ label: `${v.label}${v.needDuplicate ? ' (一式两份)' : ''}`, value: k }))} />
          </Form.Item>
          <Form.Item name="doc_name" label="文件名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="doc_number" label="文件编号"><Input /></Form.Item>
          <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="文件详情" open={detailVisible} onCancel={() => setDetailVisible(false)}
        footer={null} width={550}>
        {selectedRecord && (() => {
          const emp = employees.find((e: any) => e.id === selectedRecord.employee_id);
          const docTypeInfo = docTypeMap[selectedRecord.doc_type as OnboardingDocType];
          const isDuplicate = selectedRecord.copy_count > 1;
          return (
            <div>
              <p><strong>员工：</strong>{emp?.chinese_name || '-'} ({emp?.employee_no || '-'})</p>
              <p><strong>文件类型：</strong>{docTypeInfo?.label}
                {docTypeInfo?.needDuplicate && <Tag color="purple" style={{ marginLeft: 8 }}>一式两份</Tag>}
              </p>
              <p><strong>文件名称：</strong>{selectedRecord.doc_name}</p>
              <p><strong>文件编号：</strong>{selectedRecord.doc_number || '-'}</p>
              <p><strong>签署状态：</strong>{selectedRecord.signed ? <Tag color="success">已签署</Tag> : <Tag>未签署</Tag>}</p>
              <p><strong>需用印：</strong>{selectedRecord.need_seal ? `是 (${selectedRecord.seal_count}处)` : '否'}</p>

              {isDuplicate && (
                <Card size="small" title="一式两份明细" style={{ marginTop: 12, marginBottom: 12 }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>公司联：</Text>
                      {selectedRecord.company_copy_status === 'archived'
                        ? <Tag color="blue">已归档 ({selectedRecord.company_copy_archived_at?.slice(0, 10) || '-'})</Tag>
                        : <Tag>待处理</Tag>}
                    </Col>
                    <Col span={12}>
                      <Text strong>员工联：</Text>
                      {selectedRecord.employee_copy_status === 'returned' || selectedRecord.returned_to_employee
                        ? <Tag color="green">已归还本人 ({selectedRecord.employee_copy_returned_at?.slice(0, 10) || '-'})</Tag>
                        : <Tag>待归还</Tag>}
                    </Col>
                  </Row>
                </Card>
              )}

              <p><strong>状态：</strong><Tag color={docStatusMap[selectedRecord.status as DocStatus]?.color}>{docStatusMap[selectedRecord.status as DocStatus]?.label}</Tag></p>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default OnboardingDocs;
