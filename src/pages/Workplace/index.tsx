import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Timeline,
  Tag,
  List,
  Typography,
  Badge,
  Spin,
  Button,
  Progress,
  Divider,
  Alert,
  Tooltip,
  Avatar,
  Space,
} from 'antd';
import {
  TeamOutlined,
  UserAddOutlined,
  FileTextOutlined,
  AuditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  SendOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
  DollarOutlined,
  ContainerOutlined,
  CustomerServiceOutlined,
  WarningOutlined,
  BellOutlined,
  RightOutlined,
  SwapOutlined,
  LogoutOutlined,
  SafetyOutlined,
  GiftOutlined,
  FileDoneOutlined,
  ScheduleOutlined,
  BankOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabase';

const { Title, Text, Paragraph } = Typography;

// ─── 类型 ────────────────────────────────────────────────────────────────────
interface DashboardStats {
  // 员工管理
  totalEmployees: number;
  newHires30d: number;
  resignations30d: number;
  // 招聘
  openRecruitment: number;
  activeInterviews: number;
  pendingOffers: number;
  // 合同
  contractsExpiringSoon: number;
  probationDue: number;
  // Payroll
  payrollPending: boolean;
  attendanceAbnormal: number;
  // 审批
  pendingApprovals: number;
}

interface PendingTask {
  key: string;
  title: string;
  module: string;
  moduleKey: string;
  path: string;
  priority: 'high' | 'medium' | 'low';
  deadline?: string;
  type: 'approval' | 'reminder' | 'task';
}

interface RecentActivity {
  id: string;
  time: string;
  content: string;
  type: 'resume' | 'demand' | 'interview' | 'onboarding' | 'offboarding' | 'contract' | 'payroll' | 'approval';
  operator?: string;
}

// ─── 快捷入口配置（按四大板块分组）────────────────────────────────────────────
const quickEntries = [
  {
    group: '员工管理',
    icon: <TeamOutlined style={{ fontSize: 28, color: '#1890ff' }} />,
    color: '#e6f7ff',
    borderColor: '#91caff',
    items: [
      { label: '发布招聘需求', path: '/recruitment/demand', icon: <FileSearchOutlined /> },
      { label: '录入简历', path: '/recruitment/resume', icon: <FileTextOutlined /> },
      { label: '安排面试', path: '/recruitment/interview', icon: <CalendarOutlined /> },
      { label: '新员工入职', path: '/onboarding/docs', icon: <UserAddOutlined /> },
    ],
  },
  {
    group: '员工合同',
    icon: <ContainerOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
    color: '#f6ffed',
    borderColor: '#b7eb8f',
    items: [
      { label: '员工档案', path: '/employment/employees', icon: <TeamOutlined /> },
      { label: '试用期评估', path: '/employment/evaluation', icon: <AuditOutlined /> },
      { label: '续签管理', path: '/employment/renewal', icon: <FileDoneOutlined /> },
      { label: '员工流动', path: '/employment/transfer', icon: <SwapOutlined /> },
    ],
  },
  {
    group: 'Payroll',
    icon: <DollarOutlined style={{ fontSize: 28, color: '#faad14' }} />,
    color: '#fffbe6',
    borderColor: '#ffe58f',
    items: [
      { label: '月度Payroll', path: '/payroll/monthly', icon: <DollarOutlined /> },
      { label: '考勤记录', path: '/payroll/attendance', icon: <ScheduleOutlined /> },
      { label: '请假管理', path: '/payroll/leave', icon: <CalendarOutlined /> },
      { label: '社保/公积金', path: '/payroll/social-insurance', icon: <BankOutlined /> },
    ],
  },
  {
    group: '员工服务',
    icon: <CustomerServiceOutlined style={{ fontSize: 28, color: '#722ed1' }} />,
    color: '#f9f0ff',
    borderColor: '#d3adf7',
    items: [
      { label: '座位/设备', path: '/employee-service/assets', icon: <CustomerServiceOutlined /> },
      { label: '系统账户', path: '/employee-service/accounts', icon: <SafetyOutlined /> },
      { label: '福利政策', path: '/employee-service/benefits-policy', icon: <GiftOutlined /> },
      { label: '员工查询', path: '/employee-service/query', icon: <FileSearchOutlined /> },
    ],
  },
];

// ─── 活动类型颜色 ─────────────────────────────────────────────────────────────
const activityColors: Record<string, string> = {
  resume: 'blue',
  demand: 'green',
  interview: 'orange',
  onboarding: 'purple',
  offboarding: 'red',
  contract: 'cyan',
  payroll: 'gold',
  approval: 'geekblue',
};

const activityIcons: Record<string, React.ReactNode> = {
  resume: <FileSearchOutlined />,
  demand: <FileTextOutlined />,
  interview: <CalendarOutlined />,
  onboarding: <UserAddOutlined />,
  offboarding: <LogoutOutlined />,
  contract: <ContainerOutlined />,
  payroll: <DollarOutlined />,
  approval: <AuditOutlined />,
};

// ─── 模拟数据（实际从 Supabase 加载）────────────────────────────────────────
const mockPendingTasks: PendingTask[] = [
  {
    key: '1',
    title: '待审批：法务助理录用审批单（陈圆 提交）',
    module: '审批管理',
    moduleKey: 'approval',
    path: '/approval',
    priority: 'high',
    deadline: '今日',
    type: 'approval',
  },
  {
    key: '2',
    title: '合同到期提醒：王某合同将于30天后到期',
    module: '续签管理',
    moduleKey: 'contract',
    path: '/employment/renewal',
    priority: 'high',
    deadline: '30天内',
    type: 'reminder',
  },
  {
    key: '3',
    title: '试用期评估：张某试用期评估截止日临近',
    module: '试用期评估',
    moduleKey: 'evaluation',
    path: '/employment/evaluation',
    priority: 'medium',
    deadline: '本周',
    type: 'reminder',
  },
  {
    key: '4',
    title: '待安排：财务助理候选人二面',
    module: '面试安排',
    moduleKey: 'interview',
    path: '/recruitment/interview',
    priority: 'medium',
    type: 'task',
  },
  {
    key: '5',
    title: '待发送：CS/AI实习生Offer（已审批通过）',
    module: 'Offer管理',
    moduleKey: 'offer',
    path: '/recruitment/offer',
    priority: 'medium',
    type: 'task',
  },
  {
    key: '6',
    title: '6月考勤数据待核对（共55人）',
    module: 'Payroll',
    moduleKey: 'payroll',
    path: '/payroll/attendance',
    priority: 'low',
    type: 'task',
  },
];

const mockActivities: RecentActivity[] = [
  { id: '1', time: '今天 14:30', content: '收到财务助理岗位简历 3 份', type: 'resume', operator: '系统自动' },
  { id: '2', time: '今天 10:00', content: 'CS/AI技术实习生岗位需求已发布', type: 'demand', operator: '黄燕婷' },
  { id: '3', time: '昨天 16:00', content: '法务助理候选人陈X通过二面', type: 'interview', operator: '陈圆' },
  { id: '4', time: '昨天 09:30', content: '新员工林X入职引导表已归档', type: 'onboarding', operator: '黄燕婷' },
  { id: '5', time: '3天前 11:00', content: '员工王X续签合同已签署完成', type: 'contract', operator: '黄燕婷' },
  { id: '6', time: '3天前 09:00', content: '5月薪资单已发送（共13人）', type: 'payroll', operator: '黄燕婷' },
];

// ─── 主组件 ──────────────────────────────────────────────────────────────────
const WorkplacePage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    newHires30d: 0,
    resignations30d: 0,
    openRecruitment: 0,
    activeInterviews: 0,
    pendingOffers: 0,
    contractsExpiringSoon: 0,
    probationDue: 0,
    payrollPending: false,
    attendanceAbnormal: 0,
    pendingApprovals: 0,
  });

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekday = weekdays[today.getDay()];

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        { count: employeeCount },
        { count: interviewCount },
        { count: offerCount },
        { count: recruitmentCount },
      ] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact', head: true }).in('status', ['active', 'probation']),
        supabase.from('interviews').select('*', { count: 'exact', head: true }).eq('result', 'pending'),
        supabase.from('offers').select('*', { count: 'exact', head: true }).in('status', ['sent', 'pending_send']),
        supabase.from('recruitment_requests').select('*', { count: 'exact', head: true }).in('status', ['published', 'approved']),
      ]);

      setStats({
        totalEmployees: employeeCount || 13,
        newHires30d: 1,
        resignations30d: 0,
        openRecruitment: recruitmentCount || 3,
        activeInterviews: interviewCount || 2,
        pendingOffers: offerCount || 1,
        contractsExpiringSoon: 2,
        probationDue: 1,
        payrollPending: true,
        attendanceAbnormal: 3,
        pendingApprovals: mockPendingTasks.filter((t) => t.type === 'approval').length,
      });
    } catch {
      // 使用默认数据
      setStats((s) => ({ ...s, totalEmployees: 13, openRecruitment: 3, activeInterviews: 2, pendingOffers: 1 }));
    } finally {
      setLoading(false);
    }
  };

  const priorityConfig = {
    high: { color: '#ff4d4f', bgColor: '#fff2f0', label: '紧急', icon: <FireOutlined /> },
    medium: { color: '#faad14', bgColor: '#fffbe6', label: '待办', icon: <ClockCircleOutlined /> },
    low: { color: '#8c8c8c', bgColor: '#fafafa', label: '一般', icon: <CheckCircleOutlined /> },
  };

  // 渲染统计卡片
  const renderStatCard = (
    title: string,
    value: number | string,
    icon: React.ReactNode,
    color: string,
    subtitle?: string,
    trend?: { value: number; up: boolean },
    onClick?: () => void,
  ) => (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', borderRadius: 10, border: `1px solid ${color}22` }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#262626', lineHeight: 1 }}>{value}</div>
          {subtitle && <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 6 }}>{subtitle}</div>}
          {trend && (
            <div style={{ fontSize: 12, marginTop: 6, color: trend.up ? '#52c41a' : '#ff4d4f' }}>
              {trend.up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} 较上月 {trend.value}
            </div>
          )}
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: `${color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            color,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );

  return (
    <div style={{ maxWidth: 1400 }}>
      {/* ── 页头欢迎区 ─────────────────────────────── */}
      <div
        className="page-header"
        style={{
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          borderRadius: 12,
          padding: '24px 32px',
          marginBottom: 24,
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            欢迎回来，{user?.display_name || '-'} 👋
          </div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>
            {dateStr} {weekday}&nbsp;&nbsp;|&nbsp;&nbsp;
            {user?.role === 'super_admin' ? '超级管理员' :
              user?.role === 'main_admin' ? '系统主管理员' :
              user?.role === 'sub_admin' ? '系统子管理员' :
              user?.role === 'bu_head' ? 'BU负责人' : '普通员工'}
            &nbsp;&nbsp;|&nbsp;&nbsp;{user?.department || '上海办公室'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>当前待办事项</div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>
            {mockPendingTasks.filter((t) => t.priority === 'high').length}
            <span style={{ fontSize: 16, fontWeight: 400, marginLeft: 4 }}>项紧急</span>
          </div>
        </div>
      </div>

      <Spin spinning={loading}>
        {/* ── 预警横幅 ────────────────────────────────── */}
        {(stats.contractsExpiringSoon > 0 || stats.probationDue > 0) && (
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: 20, borderRadius: 8 }}
            message={
              <Space size={24}>
                {stats.contractsExpiringSoon > 0 && (
                  <span>
                    <strong>{stats.contractsExpiringSoon} 位员工</strong> 合同将在 30 天内到期
                    <Button type="link" size="small" onClick={() => navigate('/employment/renewal')} style={{ paddingLeft: 4 }}>
                      去处理 <RightOutlined />
                    </Button>
                  </span>
                )}
                {stats.probationDue > 0 && (
                  <span>
                    <strong>{stats.probationDue} 位员工</strong> 试用期评估即将截止
                    <Button type="link" size="small" onClick={() => navigate('/employment/evaluation')} style={{ paddingLeft: 4 }}>
                      去处理 <RightOutlined />
                    </Button>
                  </span>
                )}
                {stats.pendingApprovals > 0 && (
                  <span>
                    <strong>{stats.pendingApprovals} 项</strong> 审批待处理
                    <Button type="link" size="small" onClick={() => navigate('/approval')} style={{ paddingLeft: 4 }}>
                      去审批 <RightOutlined />
                    </Button>
                  </span>
                )}
              </Space>
            }
          />
        )}

        {/* ── 核心数据统计（8 个卡片）──────────────────── */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} lg={6}>
            {renderStatCard(
              '在职员工',
              stats.totalEmployees,
              <TeamOutlined />,
              '#1890ff',
              `本月新增 ${stats.newHires30d} 人`,
              undefined,
              () => navigate('/employment/employees'),
            )}
          </Col>
          <Col xs={12} sm={8} lg={6}>
            {renderStatCard(
              '在招岗位',
              stats.openRecruitment,
              <FileSearchOutlined />,
              '#13c2c2',
              '招聘需求进行中',
              undefined,
              () => navigate('/recruitment/demand'),
            )}
          </Col>
          <Col xs={12} sm={8} lg={6}>
            {renderStatCard(
              '待面试',
              stats.activeInterviews,
              <CalendarOutlined />,
              '#faad14',
              '需安排面试候选人',
              undefined,
              () => navigate('/recruitment/interview'),
            )}
          </Col>
          <Col xs={12} sm={8} lg={6}>
            {renderStatCard(
              'Offer待处理',
              stats.pendingOffers,
              <SendOutlined />,
              '#722ed1',
              '已审批通过待发送',
              undefined,
              () => navigate('/recruitment/offer'),
            )}
          </Col>
          <Col xs={12} sm={8} lg={6}>
            {renderStatCard(
              '合同即将到期',
              stats.contractsExpiringSoon,
              <ContainerOutlined />,
              '#ff4d4f',
              '30天内到期，需续签',
              undefined,
              () => navigate('/employment/renewal'),
            )}
          </Col>
          <Col xs={12} sm={8} lg={6}>
            {renderStatCard(
              '试用期待评估',
              stats.probationDue,
              <AuditOutlined />,
              '#eb2f96',
              '评估截止日临近',
              undefined,
              () => navigate('/employment/evaluation'),
            )}
          </Col>
          <Col xs={12} sm={8} lg={6}>
            {renderStatCard(
              '考勤异常',
              stats.attendanceAbnormal,
              <ScheduleOutlined />,
              '#fa8c16',
              '本月异常记录数',
              undefined,
              () => navigate('/payroll/attendance'),
            )}
          </Col>
          <Col xs={12} sm={8} lg={6}>
            {renderStatCard(
              '待审批',
              stats.pendingApprovals,
              <AuditOutlined />,
              '#52c41a',
              '需我审批的流程',
              undefined,
              () => navigate('/approval'),
            )}
          </Col>
        </Row>

        {/* ── 主体内容区 ─────────────────────────────── */}
        <Row gutter={[16, 16]}>
          {/* 左列：待办 + 快捷操作 */}
          <Col xs={24} lg={15}>
            {/* 待办任务 */}
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BellOutlined style={{ color: '#ff4d4f' }} />
                  <span>待办任务</span>
                  <Badge count={mockPendingTasks.length} style={{ backgroundColor: '#ff4d4f' }} />
                </div>
              }
              extra={
                <Button type="link" size="small" onClick={() => navigate('/approval')}>
                  全部审批 <RightOutlined />
                </Button>
              }
              style={{ marginBottom: 16, borderRadius: 10 }}
              bodyStyle={{ padding: 0 }}
            >
              <List
                dataSource={mockPendingTasks}
                renderItem={(item) => {
                  const cfg = priorityConfig[item.priority];
                  return (
                    <List.Item
                      style={{
                        padding: '12px 20px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f5f5f5',
                        transition: 'background 0.15s',
                      }}
                      onClick={() => navigate(item.path)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <List.Item.Meta
                        avatar={
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              backgroundColor: cfg.bgColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: cfg.color,
                              fontSize: 16,
                            }}
                          >
                            {cfg.icon}
                          </div>
                        }
                        title={
                          <span style={{ fontSize: 14, color: '#262626' }}>{item.title}</span>
                        }
                        description={
                          <Space size={6}>
                            <Tag color={item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'default'} style={{ fontSize: 11 }}>
                              {cfg.label}
                            </Tag>
                            <Tag color="blue" style={{ fontSize: 11 }}>{item.module}</Tag>
                            {item.deadline && (
                              <Text style={{ fontSize: 12, color: item.priority === 'high' ? '#ff4d4f' : '#8c8c8c' }}>
                                截止：{item.deadline}
                              </Text>
                            )}
                          </Space>
                        }
                      />
                      <RightOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />
                    </List.Item>
                  );
                }}
              />
            </Card>

            {/* 快捷操作（四大板块） */}
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FireOutlined style={{ color: '#faad14' }} />
                  <span>快捷操作</span>
                </div>
              }
              style={{ borderRadius: 10 }}
              bodyStyle={{ padding: '16px 20px' }}
            >
              <Row gutter={[12, 12]}>
                {quickEntries.map((group) => (
                  <Col xs={24} sm={12} key={group.group}>
                    <div
                      style={{
                        border: `1px solid ${group.borderColor}`,
                        borderRadius: 10,
                        padding: '14px 16px',
                        background: group.color,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        {group.icon}
                        <Text strong style={{ fontSize: 14 }}>{group.group}</Text>
                      </div>
                      <Row gutter={[8, 8]}>
                        {group.items.map((item) => (
                          <Col span={12} key={item.label}>
                            <Button
                              block
                              size="small"
                              icon={item.icon}
                              style={{ fontSize: 12, textAlign: 'left', borderRadius: 6 }}
                              onClick={() => navigate(item.path)}
                            >
                              {item.label}
                            </Button>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          {/* 右列：动态 + 模块概览 */}
          <Col xs={24} lg={9}>
            {/* 四大板块状态概览 */}
            <Card
              title="板块状态概览"
              style={{ marginBottom: 16, borderRadius: 10 }}
              bodyStyle={{ padding: '16px 20px' }}
            >
              {[
                {
                  label: '员工管理',
                  icon: <TeamOutlined />,
                  color: '#1890ff',
                  items: [
                    { name: '在招岗位', value: stats.openRecruitment, total: 5 },
                    { name: '本月入离职', value: stats.newHires30d + stats.resignations30d, total: 5 },
                  ],
                  path: '/recruitment/resume',
                },
                {
                  label: '员工合同',
                  icon: <ContainerOutlined />,
                  color: '#52c41a',
                  items: [
                    { name: '合同即将到期', value: stats.contractsExpiringSoon, total: 13 },
                    { name: '待评估', value: stats.probationDue, total: 5 },
                  ],
                  path: '/employment/employees',
                },
                {
                  label: 'Payroll',
                  icon: <DollarOutlined />,
                  color: '#faad14',
                  items: [
                    { name: '考勤异常', value: stats.attendanceAbnormal, total: 55 },
                    { name: '本月社保', value: 13, total: 13 },
                  ],
                  path: '/payroll/monthly',
                },
                {
                  label: '员工服务',
                  icon: <CustomerServiceOutlined />,
                  color: '#722ed1',
                  items: [
                    { name: '设备待分配', value: 0, total: 10 },
                    { name: '待办申请', value: 0, total: 10 },
                  ],
                  path: '/employee-service/query',
                },
              ].map((mod) => (
                <div
                  key={mod.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid #f5f5f5',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(mod.path)}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: `${mod.color}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      color: mod.color,
                      marginRight: 12,
                      flexShrink: 0,
                    }}
                  >
                    {mod.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 13 }}>{mod.label}</Text>
                      <RightOutlined style={{ color: '#bfbfbf', fontSize: 11 }} />
                    </div>
                    {mod.items.map((it) => (
                      <div key={it.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8c8c8c' }}>
                        <span>{it.name}</span>
                        <span style={{ color: it.value > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 500 }}>
                          {it.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Card>

            {/* 近期动态 */}
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ClockCircleOutlined style={{ color: '#1890ff' }} />
                  <span>近期动态</span>
                </div>
              }
              style={{ borderRadius: 10 }}
              bodyStyle={{ padding: '16px 20px' }}
            >
              <Timeline
                items={mockActivities.map((act) => ({
                  key: act.id,
                  color: activityColors[act.type] || 'blue',
                  dot: (
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: `var(--ant-color-${activityColors[act.type] || 'blue'}-1, #e6f7ff)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                      }}
                    >
                      {activityIcons[act.type]}
                    </div>
                  ),
                  children: (
                    <div style={{ paddingBottom: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, color: '#262626' }}>{act.content}</Text>
                      </div>
                      <div style={{ fontSize: 11, color: '#bfbfbf', marginTop: 2 }}>
                        {act.time}
                        {act.operator && ` · ${act.operator}`}
                      </div>
                    </div>
                  ),
                }))}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default WorkplacePage;
