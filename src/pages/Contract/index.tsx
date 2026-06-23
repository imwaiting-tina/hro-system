import React, { useEffect, useState } from 'react';
import {
  Card, Table, Button, Tag, Space, Typography, Row, Col, Statistic, Tabs,
  Modal, Form, Input, Select, DatePicker, InputNumber, message, Tooltip,
  Progress, Alert, List, Divider,
} from 'antd';
import {
  ContainerOutlined, FileTextOutlined, AuditOutlined, FileDoneOutlined,
  PlusOutlined, EyeOutlined, UploadOutlined, EditOutlined, DownloadOutlined,
  WarningOutlined, TeamOutlined, ClockCircleOutlined, CheckCircleOutlined,
  SafetyOutlined, FileSearchOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore, canEdit } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabase';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

// ─── 档案材料清单（产品说明书 表3-1）─────────────────────────────────────────
const archiveMaterials = [
  { key: '1', name: '劳动合同 / 实习协议扫描件', required: true, note: '必须项，入职时提供', color: '#ff4d4f' },
  { key: '2', name: '《求职申请表》完整扫描件（含各轮面试评价）', required: true, note: '必须项，面试期间完成', color: '#ff4d4f' },
  { key: '3', name: '身份证复印件', required: true, note: '必须项，offer接受后邮件收取', color: '#ff4d4f' },
  { key: '4', name: '学信网学籍在线验证报告', required: true, note: '必须项，offer接受后邮件收取', color: '#ff4d4f' },
  { key: '5', name: '退工单扫描件（如有）', required: false, note: '有则必须，offer接受后邮件收取', color: '#faad14' },
  { key: '6', name: '银行卡复印件', required: false, note: '入职后提供', color: '#52c41a' },
  { key: '7', name: '户口本户主页和本人页复印件', required: false, note: '入职后提供', color: '#52c41a' },
  { key: '8', name: '毕业证书复印件（实习生提供学生证复印件）', required: false, note: '入职后提供', color: '#52c41a' },
  { key: '9', name: '1个月内体检报告', required: false, note: '入职后提供', color: '#52c41a' },
  { key: '10', name: '钉钉入职登记表', required: false, note: '入职当天导出', color: '#1890ff' },
  { key: '11', name: '员工手册签署页', required: false, note: '入职当天签署', color: '#1890ff' },
];

// ─── 固定导出字段顺序（产品说明书 3.2）───────────────────────────────────────
const exportFields = [
  '员工登记表', '求职申请表', '身份证复印件', '银行卡复印件', '学历证明',
  '体检报告', '户口本复印件', '新员工入职引导表', '新员工试用期评估表',
  '简历', '保密协议', '员工尽职廉洁协议', '员工手册签收单', '录用审批',
  '退工单/离职证明', '合同（劳动合同/劳务合同/实习协议/保安劳动合同）',
  '续签合同申请表', '续签合同', '员工流动表', '劳动关系变更', '劳动手册', '其他',
];

// ─── 试用期评估流程（产品说明书 表3-4）───────────────────────────────────────
const evaluationFlow = [
  { step: 1, action: '系统到期提醒，人事专员收到通知', owner: '人事专员' },
  { step: 2, action: '人事专员发起试用期评估，系统生成评估任务', owner: '人事专员' },
  { step: 3, action: '直属部门负责人填写评估表（工作绩效、工作态度、综合评价等）', owner: '部门负责人' },
  { step: 4, action: '人事负责人审核评估结果', owner: '人事负责人' },
  { step: 5, action: 'Jenny最终确认：同意转正 / 延长试用期 / 终止合同', owner: 'Jenny' },
  { step: 6, action: '人事专员收到最终结果通知，更新员工状态，归档评估材料', owner: '人事专员' },
];

// ─── 评估结果处理（产品说明书 表3-5）─────────────────────────────────────────
const evaluationResults = [
  { conclusion: '同意转正', statusChange: '试用期 → 正式员工', action: '更新合同信息，归档评估记录', color: '#52c41a' },
  { conclusion: '延长试用期', statusChange: '试用期（延长）', action: '更新试用期结束日期，约定N天后再次评估', color: '#faad14' },
  { conclusion: '终止合同', statusChange: '离职流程启动', action: '按离职管理流程处理', color: '#ff4d4f' },
];

// ─── 续签管理流程（产品说明书 表3-6）─────────────────────────────────────────
const renewalFlow = [
  { step: 1, action: '系统提醒，人事专员收到续签提醒通知', owner: '人事专员' },
  { step: 2, action: '人事专员与员工及部门确认续签意向', owner: '人事专员' },
  { step: 3, action: '人事专员在系统中发起续签申请，填写续签信息', owner: '人事专员' },
  { step: 4, action: '部门负责人审批续签申请', owner: '部门负责人' },
  { step: 5, action: 'Jenny最终审批确认', owner: 'Jenny' },
  { step: 6, action: '审批通过后，打印续签合同，完成用印及双方签字', owner: '人事专员' },
  { step: 7, action: '上传续签合同扫描件，归档至员工档案', owner: '人事专员' },
  { step: 8, action: '更新员工合同到期日，关闭本次续签流程', owner: '人事专员' },
];

// ─── 合同状态说明（产品说明书 表3-8）─────────────────────────────────────────
const contractStatuses = [
  { status: '生效中', desc: '合同已签署，在有效期内', color: '#52c41a' },
  { status: '即将到期', desc: '距离到期日不足30天（可配置）', color: '#faad14' },
  { status: '已到期', desc: '合同已过有效期', color: '#ff4d4f' },
  { status: '续签审批中', desc: '续签申请已提交，审批流程进行中', color: '#1890ff' },
  { status: '已续签', desc: '已完成续签，新合同生效', color: '#52c41a' },
  { status: '已终止', desc: '合同到期未续签，员工离职', color: '#8c8c8c' },
];

const ContractPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('archive');
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [renewalModalVisible, setRenewalModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    const { data: result } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    if (result) setEmployees(result);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // 统计数据
  const expiringCount = employees.filter(e => {
    if (!e.contract_end) return false;
    const days = dayjs(e.contract_end).diff(dayjs(), 'day');
    return days >= 0 && days <= 30;
  }).length;
  const probationCount = employees.filter(e => e.status === 'probation' || e.status === 'internship').length;
  const activeCount = employees.filter(e => e.status === 'active' || e.status === 'probation').length;

  // 员工档案列
  const archiveColumns = [
    { title: '工号', dataIndex: 'employee_no', width: 80 },
    { title: '姓名', dataIndex: 'chinese_name', width: 90,
      render: (v: string, r: any) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{v}</span>
          {r.english_name && <Text type="secondary" style={{ fontSize: 12 }}>{r.english_name}</Text>}
        </Space>
      ) },
    { title: '类型', dataIndex: 'employee_type', width: 80,
      render: (v: string) => {
        const map: Record<string, { label: string; color: string }> = {
          full_time: { label: '全日制', color: 'blue' },
          intern: { label: '实习生', color: 'orange' },
          retired_rehire: { label: '退休返聘', color: 'purple' },
          security: { label: '保安', color: 'cyan' },
        };
        return <Tag color={map[v]?.color}>{map[v]?.label || v}</Tag>;
      } },
    { title: '部门', dataIndex: 'department_id', width: 80, ellipsis: true },
    { title: '职位', dataIndex: 'position_name', width: 110, ellipsis: true },
    { title: '入职日期', dataIndex: 'onboard_date', width: 100 },
    { title: '合同到期', dataIndex: 'contract_end', width: 100,
      render: (v: string) => {
        if (!v) return <Text type="secondary">-</Text>;
        const days = dayjs(v).diff(dayjs(), 'day');
        if (days < 0) return <Tag color="red">{v}（已过期）</Tag>;
        if (days <= 30) return <Tag color="orange">{v}（{days}天到期）</Tag>;
        return <Text>{v}</Text>;
      } },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: string) => {
        const map: Record<string, { label: string; color: string }> = {
          active: { label: '在职', color: 'success' },
          probation: { label: '试用期', color: 'processing' },
          internship: { label: '实习期', color: 'warning' },
          resigned: { label: '已离职', color: 'default' },
        };
        return <Tag color={map[v]?.color}>{map[v]?.label || v}</Tag>;
      },
    },
    {
      title: '档案', width: 100, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="查看档案">
            <Button size="small" icon={<EyeOutlined />} onClick={() => navigate('/employment/employees')} />
          </Tooltip>
          {user && canEdit(user.role) && (
            <Tooltip title="上传材料">
              <Button size="small" icon={<UploadOutlined />} type="primary" ghost />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // 续签管理列
  const renewalColumns = [
    { title: '员工', dataIndex: 'chinese_name', width: 90,
      render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '当前合同类型', dataIndex: 'employee_type', width: 110,
      render: (v: string) => {
        const map: Record<string, string> = {
          full_time: '劳动合同', intern: '实习协议', security: '保安劳动合同', retired_rehire: '劳务合同',
        };
        return map[v] || v;
      } },
    { title: '当前到期日', dataIndex: 'contract_end', width: 110,
      render: (v: string) => {
        if (!v) return '-';
        const days = dayjs(v).diff(dayjs(), 'day');
        if (days < 0) return <Tag color="red">{v}</Tag>;
        if (days <= 30) return <Tag color="orange">{v}</Tag>;
        return v;
      } },
    { title: '合同状态', width: 100,
      render: (_: any, record: any) => {
        if (!record.contract_end) return <Tag>生效中</Tag>;
        const days = dayjs(record.contract_end).diff(dayjs(), 'day');
        if (days < 0) return <Tag color="red">已到期</Tag>;
        if (days <= 30) return <Tag color="orange">即将到期</Tag>;
        return <Tag color="success">生效中</Tag>;
      } },
    {
      title: '操作', width: 160, fixed: 'right' as const,
      render: (_: any, record: any) => {
        if (!record.contract_end) return <Text type="secondary">-</Text>;
        const days = dayjs(record.contract_end).diff(dayjs(), 'day');
        if (days > 30) return <Text type="secondary">暂无需续签</Text>;
        return (
          <Button size="small" type="primary" icon={<PlusOutlined />}
            onClick={() => { form.resetFields(); form.setFieldsValue({ employee_name: record.chinese_name }); setRenewalModalVisible(true); }}>
            发起续签
          </Button>
        );
      },
    },
  ];

  const expiringEmployees = employees.filter(e => {
    if (!e.contract_end) return false;
    const days = dayjs(e.contract_end).diff(dayjs(), 'day');
    return days >= 0 && days <= 30;
  });

  return (
    <div style={{ padding: 24 }}>
      {/* 页头 */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <ContainerOutlined style={{ fontSize: 28, color: '#1890ff' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#262626' }}>员工合同管理</div>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 2 }}>
            员工档案 · 试用期/实习评估 · 续签管理 — 管理员工在职期间与公司签订的各类合同及相关文件
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic title="在职员工" value={activeCount} suffix="人" prefix={<TeamOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic title="试用/实习期" value={probationCount} suffix="人" prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic title="合同即将到期（30天内）" value={expiringCount} suffix="人" prefix={<WarningOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic title="档案材料总数" value={archiveMaterials.length} suffix="类" prefix={<FileTextOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      {/* 到期预警 */}
      {expiringCount > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16, borderRadius: 8 }}
          message={`有 ${expiringCount} 位员工合同将在30天内到期，请及时处理续签`}
          description={
            <Space wrap>
              {expiringEmployees.map(e => (
                <Tag key={e.id} color="orange">{e.chinese_name} - {e.contract_end}</Tag>
              ))}
            </Space>
          }
        />
      )}

      {/* Tabs 切换 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          // ─── Tab 1: 员工档案 ─────────────────────────────────────────
          {
            key: 'archive',
            label: <span><FileTextOutlined /> 员工档案</span>,
            children: (
              <div>
                {/* 档案材料清单 */}
                <Card title={<span><SafetyOutlined /> 档案材料清单（表3-1）</span>} style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={archiveMaterials}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '编号', dataIndex: 'key', width: 60 },
                      { title: '材料名称', dataIndex: 'name' },
                      { title: '必须项', dataIndex: 'required', width: 80,
                        render: (v: boolean) => v ? <Tag color="red">必须</Tag> : <Tag color="default">可选</Tag> },
                      { title: '备注', dataIndex: 'note', width: 220 },
                    ]}
                  />
                </Card>

                {/* 档案管理规范 */}
                <Card title="档案管理规范（表3-2）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Row gutter={16}>
                    <Col span={6}>
                      <div style={{ background: '#fafafa', padding: 12, borderRadius: 8 }}>
                        <Text strong style={{ color: '#1890ff' }}>材料命名规则</Text>
                        <Paragraph style={{ fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                          统一命名格式："姓名-材料类型-日期"
                        </Paragraph>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div style={{ background: '#fafafa', padding: 12, borderRadius: 8 }}>
                        <Text strong style={{ color: '#52c41a' }}>材料格式要求</Text>
                        <Paragraph style={{ fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                          接受PDF、图片格式（JPG/PNG）
                        </Paragraph>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div style={{ background: '#fafafa', padding: 12, borderRadius: 8 }}>
                        <Text strong style={{ color: '#faad14' }}>材料缺失处理</Text>
                        <Paragraph style={{ fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                          身份证、学信网报告、退工单为Offer接受后必须提供
                        </Paragraph>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div style={{ background: '#fafafa', padding: 12, borderRadius: 8 }}>
                        <Text strong style={{ color: '#722ed1' }}>档案修改</Text>
                        <Paragraph style={{ fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                          支持上传键（PDF/JPG/PNG）、修改键，保留修改记录
                        </Paragraph>
                      </div>
                    </Col>
                  </Row>
                </Card>

                {/* 固定导出字段顺序 */}
                <Card title={<span><DownloadOutlined /> 档案导出字段（固定顺序）</span>} style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {exportFields.map((field, idx) => (
                      <Tag key={idx} style={{ margin: 0, fontSize: 12 }}>
                        {idx + 1}. {field}
                      </Tag>
                    ))}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                    注：若某项文件不存在，则输出0。
                  </div>
                </Card>

                {/* 档案查阅权限 */}
                <Card title="档案查阅权限（表3-3）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={[
                      { key: '1', role: 'Jenny', permission: '可查看所有员工档案（含薪酬相关字段）' },
                      { key: '2', role: '人事专员', permission: '可查看所有员工档案（含薪酬相关字段）' },
                      { key: '3', role: '人事负责人', permission: '可查看所有员工档案（含薪酬相关字段）' },
                      { key: '4', role: '员工本人', permission: '通过员工服务板块查看本人档案（不含薪酬字段）' },
                      { key: '5', role: '其他角色', permission: '无查看权限' },
                    ]}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '角色', dataIndex: 'role', width: 120,
                        render: (v: string) => <Tag color="blue">{v}</Tag> },
                      { title: '权限', dataIndex: 'permission' },
                    ]}
                  />
                </Card>

                {/* 员工档案列表 */}
                <Card title={<span><TeamOutlined /> 员工档案列表</span>} style={{ borderRadius: 10 }}>
                  <div className="table-toolbar">
                    <Text strong>共 {employees.length} 份档案</Text>
                    {user && canEdit(user.role) && (
                      <Space>
                        <Button icon={<DownloadOutlined />}>导出档案清单</Button>
                        <Button type="primary" icon={<PlusOutlined />}>新增员工档案</Button>
                      </Space>
                    )}
                  </div>
                  <Table
                    columns={archiveColumns}
                    dataSource={employees}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 1000 }}
                  />
                </Card>
              </div>
            ),
          },

          // ─── Tab 2: 试用期/实习评估 ─────────────────────────────────
          {
            key: 'evaluation',
            label: <span><AuditOutlined /> 试用期/实习评估</span>,
            children: (
              <div>
                {/* 评估流程 */}
                <Card title="试用期/实习评估流程（表3-4）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0 }}>
                    {evaluationFlow.map((item, idx) => (
                      <React.Fragment key={item.step}>
                        <div style={{
                          flex: '0 0 auto',
                          minWidth: 160,
                          maxWidth: 200,
                          padding: '12px 16px',
                          background: idx === 0 ? '#e6f7ff' : idx === evaluationFlow.length - 1 ? '#f6ffed' : '#fafafa',
                          borderRadius: 8,
                          border: `1px solid ${idx === 0 ? '#91caff' : idx === evaluationFlow.length - 1 ? '#b7eb8f' : '#f0f0f0'}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%',
                              backgroundColor: '#1890ff', color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 600,
                            }}>{item.step}</div>
                            <Tag color="blue" style={{ fontSize: 11 }}>{item.owner}</Tag>
                          </div>
                          <div style={{ fontSize: 12, color: '#595959', lineHeight: 1.5 }}>{item.action}</div>
                        </div>
                        {idx < evaluationFlow.length - 1 && (
                          <div style={{ color: '#d9d9d9', fontSize: 18, padding: '0 4px' }}>→</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </Card>

                {/* 转正提醒 */}
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16, borderRadius: 8 }}
                  message="转正提醒机制"
                  description="系统根据员工入职日期和合同中约定的试用期时长，自动在试用期结束前14天（可配置）向人事专员发送提醒通知，提醒尽快发起转正评估流程。"
                />

                {/* 评估表字段（待补充） */}
                <Card title="评估表字段" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Alert
                    type="warning"
                    showIcon
                    message="【待补充】请补充：试用期/实习评估表的具体字段内容"
                    description="包括：工作绩效维度、工作态度维度、综合评分方式（百分制/五分制）、部门负责人填写说明、最终评定结论（转正通过/延长试用/终止合同）等"
                    style={{ borderRadius: 6 }}
                  />
                </Card>

                {/* 评估结果处理 */}
                <Card title="评估结果与员工状态处理（表3-5）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={evaluationResults}
                    rowKey="conclusion"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '评估结论', dataIndex: 'conclusion', width: 120,
                        render: (v: string, r: any) => <Tag color={r.color}>{v}</Tag> },
                      { title: '员工状态变更', dataIndex: 'statusChange', width: 160 },
                      { title: '后续操作', dataIndex: 'action' },
                    ]}
                  />
                </Card>

                {/* 跳转按钮 */}
                <Card style={{ borderRadius: 10, textAlign: 'center' }}>
                  <Button type="primary" size="large" icon={<AuditOutlined />} onClick={() => navigate('/employment/evaluation')}>
                    进入试用期评估管理
                  </Button>
                </Card>
              </div>
            ),
          },

          // ─── Tab 3: 续签管理 ─────────────────────────────────────────
          {
            key: 'renewal',
            label: <span><FileDoneOutlined /> 续签管理</span>,
            children: (
              <div>
                {/* 续签提醒 */}
                <Alert
                  type="warning"
                  showIcon
                  icon={<ClockCircleOutlined />}
                  style={{ marginBottom: 16, borderRadius: 8 }}
                  message="续签提醒机制"
                  description={
                    <div>
                      <p style={{ marginBottom: 4 }}>系统根据员工合同到期日，提前30天（可配置）自动向人事专员发送续签提醒。提醒包括：</p>
                      <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                        <li>工作台待办事项中显示"X位员工合同即将到期"</li>
                        <li>消息通知中心推送提醒（可配置提醒提前天数）</li>
                        <li>支持批量查看即将到期合同列表</li>
                      </ul>
                    </div>
                  }
                />

                {/* 续签流程 */}
                <Card title="续签管理流程（表3-6）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={renewalFlow}
                    rowKey="step"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '步骤', dataIndex: 'step', width: 60,
                        render: (v: number) => (
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%',
                            backgroundColor: '#1890ff', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 600,
                          }}>{v}</div>
                        ) },
                      { title: '操作内容', dataIndex: 'action' },
                      { title: '负责人', dataIndex: 'owner', width: 100,
                        render: (v: string) => <Tag color="blue">{v}</Tag> },
                    ]}
                  />
                </Card>

                {/* 续签申请字段 */}
                <Card title="续签申请字段（表3-7）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={[
                      { key: '1', field: '员工姓名', type: '关联', desc: '从花名册选择' },
                      { key: '2', field: '当前合同类型', type: '自动带出', desc: '劳动合同 / 劳务合同 / 实习协议 / 保安劳动合同' },
                      { key: '3', field: '当前合同到期日', type: '自动带出', desc: '-' },
                      { key: '4', field: '续签合同类型', type: '下拉', desc: '固定期限劳动合同 / 无固定期限劳动合同 / 劳务合同 / 实习协议' },
                      { key: '5', field: '新合同开始日期', type: '日期', desc: '通常为当前合同到期次日' },
                      { key: '6', field: '新合同期限', type: '下拉/输入', desc: '1年 / 2年 / 3年 / 无固定期限 / 自定义' },
                      { key: '7', field: '新合同到期日', type: '自动计算', desc: '根据开始日期和期限自动计算' },
                      { key: '8', field: '薪资调整', type: '单选', desc: '不调整 / 有调整（填写新薪资）' },
                      { key: '9', field: '职位调整', type: '单选', desc: '不调整 / 有调整（填写新职位）' },
                      { key: '10', field: '续签备注', type: '文本', desc: '其他需要说明的事项' },
                    ]}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '字段名称', dataIndex: 'field', width: 140,
                        render: (v: string) => <Text strong>{v}</Text> },
                      { title: '类型', dataIndex: 'type', width: 100,
                        render: (v: string) => <Tag>{v}</Tag> },
                      { title: '说明', dataIndex: 'desc' },
                    ]}
                  />
                </Card>

                {/* 合同状态说明 */}
                <Card title="合同状态说明（表3-8）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={contractStatuses}
                    rowKey="status"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '状态', dataIndex: 'status', width: 120,
                        render: (v: string, r: any) => <Tag color={r.color}>{v}</Tag> },
                      { title: '说明', dataIndex: 'desc' },
                    ]}
                  />
                </Card>

                {/* 即将到期合同列表 */}
                <Card title={<span><WarningOutlined /> 即将到期合同（30天内）</span>} style={{ borderRadius: 10 }}>
                  {expiringEmployees.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
                      <div style={{ color: '#8c8c8c' }}>暂无即将到期的合同</div>
                    </div>
                  ) : (
                    <Table
                      columns={renewalColumns}
                      dataSource={expiringEmployees}
                      rowKey="id"
                      loading={loading}
                      pagination={false}
                      scroll={{ x: 700 }}
                    />
                  )}
                </Card>

                {/* 全部合同列表 */}
                <Card title="全部合同列表" style={{ marginTop: 16, borderRadius: 10 }}>
                  <Table
                    columns={renewalColumns}
                    dataSource={employees}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 700 }}
                  />
                </Card>
              </div>
            ),
          },
        ]}
      />

      {/* 续签申请弹窗 */}
      <Modal
        title="发起续签申请"
        open={renewalModalVisible}
        onCancel={() => setRenewalModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={async (values) => {
          message.success('续签申请已创建，等待部门负责人审批');
          setRenewalModalVisible(false);
          navigate('/employment/renewal');
        }}>
          <Form.Item name="employee_name" label="员工姓名" rules={[{ required: true }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="renewal_type" label="续签合同类型" rules={[{ required: true }]}>
            <Select options={[
              { label: '固定期限劳动合同', value: 'fixed_term' },
              { label: '无固定期限劳动合同', value: 'open_ended' },
              { label: '劳务合同', value: 'service' },
              { label: '实习协议', value: 'internship' },
            ]} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="new_start_date" label="新合同开始日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contract_term" label="新合同期限" rules={[{ required: true }]}>
                <Select options={[
                  { label: '1年', value: '1' },
                  { label: '2年', value: '2' },
                  { label: '3年', value: '3' },
                  { label: '无固定期限', value: 'open' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="salary_adjust" label="薪资调整">
                <Select options={[
                  { label: '不调整', value: 'no' },
                  { label: '有调整', value: 'yes' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="new_salary" label="新薪资（如有调整）">
                <InputNumber prefix="¥" style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="position_adjust" label="职位调整">
            <Select options={[
              { label: '不调整', value: 'no' },
              { label: '有调整', value: 'yes' },
            ]} />
          </Form.Item>
          <Form.Item name="remark" label="续签备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractPage;
