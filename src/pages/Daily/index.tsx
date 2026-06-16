import React, { useMemo, useState } from 'react';
import {
  Card, Typography, Row, Col, Statistic, Tabs, Table, Tag, Button, Space,
  Drawer, Descriptions, Form, Input, InputNumber, Select, DatePicker,
  Modal, message, Divider, Empty, List, Tooltip, Badge, Progress, Alert
} from 'antd';
import {
  ClockCircleOutlined, CalendarOutlined, FileSearchOutlined,
  TeamOutlined, AuditOutlined, ScheduleOutlined, ThunderboltOutlined,
  ExportOutlined, EditOutlined, ReloadOutlined, UserOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined,
  LinkOutlined, SolutionOutlined, FieldTimeOutlined, RiseOutlined,
  FallOutlined, MinusOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useAuthStore, isAdmin } from '../../stores/authStore';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

/* ================= 类型定义 ================= */
type ClockStatus = 'normal' | 'late' | 'early' | 'absent' | 'missed' | 'remote';
type ApprovalType = '请假' | '加班' | '外出' | '出差' | '补卡';
type ApprovalStatus = 'approved' | 'pending' | 'rejected' | 'processing';

interface ClockRecord {
  id: string;
  date: string;
  name: string;
  empId: string;
  department: string;
  clockIn: string;
  clockOut: string;
  status: ClockStatus;
  workHours: number;
  remark?: string;
}

interface LeaveBalance {
  type: string;
  total: number;
  used: number;
  remaining: number;
  expiry?: string;
}

interface ApprovalItem {
  id: string;
  type: ApprovalType;
  applicant: string;
  department: string;
  startTime: string;
  endTime: string;
  duration: string;
  reason: string;
  status: ApprovalStatus;
  submittedAt: string;
  approver?: string;
}

interface ScheduleShift {
  date: string;
  name: string;
  shift: '早班' | '中班' | '晚班' | '休息' | '弹性';
  hours: number;
}

/* ================= 静态数据（演示） ================= */
const STATS_ALL = {
  todayPresent: 211,
  todayLate: 6,
  todayAbsent: 2,
  pendingApprovals: 7,
  thisMonthLeave: 23,
  thisMonthOvertime: 48,
};

const MY_STATS = {
  todayClockIn: '08:52',
  todayClockOut: '18:05',
  thisMonthLate: 1,
  remainingAnnual: 7.5,
  pendingMine: 1,
};

const DEPARTMENT_OPTIONS = ['总经办', '财务部', '人事部', '运营部', 'IT部', '市场部', '客服部'];

const CLOCK_DATA: ClockRecord[] = [
  { id: '1', date: '2026-06-16', name: '程璐', empId: 'E10031', department: '人事部', clockIn: '08:52', clockOut: '18:05', status: 'normal', workHours: 8.2 },
  { id: '2', date: '2026-06-16', name: '王嘉怡', empId: 'E10042', department: '运营部', clockIn: '09:18', clockOut: '18:00', status: 'late', workHours: 7.7, remark: '交通堵塞' },
  { id: '3', date: '2026-06-16', name: '张子豪', empId: 'E10058', department: 'IT部', clockIn: '--', clockOut: '--', status: 'absent', workHours: 0, remark: '未打卡' },
  { id: '4', date: '2026-06-16', name: '李梦琪', empId: 'E10067', department: '市场部', clockIn: '08:30', clockOut: '13:00', status: 'early', workHours: 4.5, remark: '事假半天' },
  { id: '5', date: '2026-06-16', name: '陈宇航', empId: 'E10089', department: '客服部', clockIn: '08:45', clockOut: '19:30', status: 'normal', workHours: 9.8, remark: '加班1.5h' },
  { id: '6', date: '2026-06-16', name: '赵思源', empId: 'E10102', department: '财务部', clockIn: '08:55', clockOut: '18:02', status: 'normal', workHours: 8.1 },
  { id: '7', date: '2026-06-16', name: '刘欣然', empId: 'E10115', department: '人事部', clockIn: '09:32', clockOut: '--', status: 'missed', workHours: 0, remark: '未签退' },
  { id: '8', date: '2026-06-16', name: '黄一萧', empId: 'E10001', department: '总经办', clockIn: '08:20', clockOut: '20:15', status: 'normal', workHours: 11.0, remark: '远程打卡' },
  { id: '9', date: '2026-06-16', name: '周晓彤', empId: 'E10128', department: '运营部', clockIn: '08:48', clockOut: '18:00', status: 'normal', workHours: 8.2 },
  { id: '10', date: '2026-06-16', name: '杨振华', empId: 'E10139', department: 'IT部', clockIn: '08:35', clockOut: '20:45', status: 'normal', workHours: 11.2, remark: '弹性班次' },
];

const LEAVE_BALANCE: LeaveBalance[] = [
  { type: '年假', total: 10, used: 2.5, remaining: 7.5, expiry: '2026-12-31' },
  { type: '调休', total: 4, used: 1, remaining: 3, expiry: '2026-09-30' },
  { type: '事假', total: 0, used: 0, remaining: 0 },
  { type: '病假', total: 0, used: 0, remaining: 0 },
  { type: '婚假', total: 10, used: 0, remaining: 10 },
  { type: '产假', total: 158, used: 0, remaining: 158 },
  { type: '陪产假', total: 15, used: 0, remaining: 15 },
  { type: '丧假', total: 3, used: 0, remaining: 3 },
];

const APPROVAL_DATA: ApprovalItem[] = [
  { id: 'A26061601', type: '请假', applicant: '程璐', department: '人事部', startTime: '2026-06-18 09:00', endTime: '2026-06-18 18:00', duration: '1天', reason: '年假，处理私事', status: 'pending', submittedAt: '2026-06-16 10:21', approver: '黄一萧' },
  { id: 'A26061602', type: '加班', applicant: '陈宇航', department: '客服部', startTime: '2026-06-15 18:30', endTime: '2026-06-15 21:00', duration: '2.5小时', reason: '618大促客户答疑', status: 'approved', submittedAt: '2026-06-15 17:45', approver: '王嘉怡' },
  { id: 'A26061603', type: '外出', applicant: '张子豪', department: 'IT部', startTime: '2026-06-16 14:00', endTime: '2026-06-16 16:00', duration: '2小时', reason: '客户现场服务器调试', status: 'approved', submittedAt: '2026-06-16 09:30', approver: '黄一萧' },
  { id: 'A26061604', type: '出差', applicant: '赵思源', department: '财务部', startTime: '2026-06-22 08:00', endTime: '2026-06-24 18:00', duration: '3天', reason: '南京子公司半年度盘点', status: 'processing', submittedAt: '2026-06-15 16:08', approver: 'Jenny' },
  { id: 'A26061605', type: '补卡', applicant: '刘欣然', department: '人事部', startTime: '2026-06-16 18:00', endTime: '2026-06-16 18:00', duration: '一次', reason: '忘打卡，确认真实出勤', status: 'pending', submittedAt: '2026-06-16 18:12', approver: '黄一萧' },
  { id: 'A26061606', type: '请假', applicant: '李梦琪', department: '市场部', startTime: '2026-06-16 13:00', endTime: '2026-06-16 18:00', duration: '0.5天', reason: '事假半天', status: 'approved', submittedAt: '2026-06-16 11:50', approver: '王嘉怡' },
  { id: 'A26061607', type: '加班', applicant: '杨振华', department: 'IT部', startTime: '2026-06-16 19:00', endTime: '2026-06-16 22:00', duration: '3小时', reason: '系统升级', status: 'pending', submittedAt: '2026-06-16 19:05', approver: '黄一萧' },
  { id: 'A26061608', type: '请假', applicant: '周晓彤', department: '运营部', startTime: '2026-06-20 09:00', endTime: '2026-06-22 18:00', duration: '3天', reason: '年假，回老家', status: 'rejected', submittedAt: '2026-06-14 14:30', approver: '王嘉怡' },
];

const SCHEDULE_DATA: ScheduleShift[] = [
  { date: '2026-06-16', name: '程璐', shift: '弹性', hours: 8.5 },
  { date: '2026-06-16', name: '王嘉怡', shift: '早班', hours: 8 },
  { date: '2026-06-16', name: '张子豪', shift: '早班', hours: 8 },
  { date: '2026-06-16', name: '李梦琪', shift: '中班', hours: 8 },
  { date: '2026-06-16', name: '陈宇航', shift: '中班', hours: 8 },
  { date: '2026-06-17', name: '程璐', shift: '弹性', hours: 8.5 },
  { date: '2026-06-17', name: '王嘉怡', shift: '早班', hours: 8 },
  { date: '2026-06-17', name: '张子豪', shift: '休息', hours: 0 },
  { date: '2026-06-17', name: '李梦琪', shift: '早班', hours: 8 },
  { date: '2026-06-17', name: '陈宇航', shift: '休息', hours: 0 },
  { date: '2026-06-18', name: '程璐', shift: '休息', hours: 0 },
  { date: '2026-06-18', name: '王嘉怡', shift: '中班', hours: 8 },
  { date: '2026-06-18', name: '张子豪', shift: '晚班', hours: 8 },
  { date: '2026-06-18', name: '李梦琪', shift: '早班', hours: 8 },
  { date: '2026-06-18', name: '陈宇航', shift: '中班', hours: 8 },
];

/* ================= 工具方法 ================= */
const CLOCK_STATUS_MAP: Record<ClockStatus, { label: string; color: string; icon: React.ReactNode }> = {
  normal:  { label: '正常',   color: 'success', icon: <CheckCircleOutlined /> },
  late:    { label: '迟到',   color: 'warning', icon: <ExclamationCircleOutlined /> },
  early:   { label: '早退',   color: 'warning', icon: <ExclamationCircleOutlined /> },
  absent:  { label: '缺勤',   color: 'error',   icon: <CloseCircleOutlined /> },
  missed:  { label: '缺卡',   color: 'error',   icon: <CloseCircleOutlined /> },
  remote:  { label: '远程',   color: 'processing', icon: <LinkOutlined /> },
};

const APPROVAL_STATUS_MAP: Record<ApprovalStatus, { label: string; color: string }> = {
  approved:   { label: '已通过', color: 'success' },
  pending:    { label: '审批中', color: 'processing' },
  rejected:   { label: '已拒绝', color: 'error' },
  processing: { label: '审批中', color: 'processing' },
};

const APPROVAL_TYPE_COLOR: Record<ApprovalType, string> = {
  请假: 'blue',
  加班: 'orange',
  外出: 'cyan',
  出差: 'geekblue',
  补卡: 'purple',
};

const SHIFT_COLOR: Record<string, string> = {
  早班: 'blue',
  中班: 'cyan',
  晚班: 'purple',
  休息: 'default',
  弹性: 'gold',
};

/* ================= 子组件：管理员侧 ================= */
const AdminPanel: React.FC = () => {
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false);
  const [balanceAdjustOpen, setBalanceAdjustOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<LeaveBalance | null>(null);
  const [adjustForm] = Form.useForm();

  const handleOpenAdjust = (emp: LeaveBalance) => {
    setSelectedEmployee(emp);
    adjustForm.resetFields();
    setBalanceAdjustOpen(true);
  };

  const handleSubmitAdjust = async () => {
    try {
      const v = await adjustForm.validateFields();
      // 演示：实际应调用 Edge Function → 钉钉 API 回写 + 操作日志
      message.success(`已为${selectedEmployee?.type}提交调整：${v.delta}天（${v.reason}）`);
      setBalanceAdjustOpen(false);
    } catch {}
  };

  return (
    <>
      <Row gutter={16}>
        <Col span={16}>
          <Card
            className="section-card"
            title={<Space><FileSearchOutlined />考勤报表 / 统计</Space>}
            extra={
              <Space>
                <Button icon={<ExportOutlined />} onClick={() => message.info('演示：导出 Excel')}>导出 Excel</Button>
                <Button icon={<ExportOutlined />} onClick={() => message.info('演示：导出 PDF')}>导出 PDF</Button>
              </Space>
            }
          >
            <Form layout="inline" style={{ marginBottom: 16 }}>
              <Form.Item label="部门">
                <Select placeholder="全部部门" style={{ width: 140 }} allowClear options={DEPARTMENT_OPTIONS.map(d => ({ label: d, value: d }))} />
              </Form.Item>
              <Form.Item label="月份">
                <DatePicker picker="month" defaultValue={dayjs('2026-06')} format="YYYY-MM" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" icon={<FileSearchOutlined />} onClick={() => setReportDrawerOpen(true)}>查看汇总</Button>
              </Form.Item>
            </Form>
            <Row gutter={16}>
              <Col span={6}><Statistic title="应出勤" value={219} suffix="人天" /></Col>
              <Col span={6}><Statistic title="实际出勤" value={211} suffix="人天" valueStyle={{ color: '#52c41a' }} /></Col>
              <Col span={6}><Statistic title="出勤率" value={96.3} suffix="%" precision={1} valueStyle={{ color: '#1890ff' }} /></Col>
              <Col span={6}><Statistic title="异常次数" value={8} suffix="次" valueStyle={{ color: '#faad14' }} /></Col>
            </Row>
            <Divider />
            <Text type="secondary" style={{ fontSize: 12 }}>
              说明：报表数据来源于本地已同步的钉钉考勤数据；统计口径为自然月，跨月请分段查询。
            </Text>
          </Card>
        </Col>

        <Col span={8}>
          <Card className="section-card" title={<Space><ScheduleOutlined />排班结果核对</Space>}>
            <Table<ScheduleShift>
              size="small"
              rowKey={(r) => `${r.date}-${r.name}`}
              dataSource={SCHEDULE_DATA.slice(0, 6)}
              pagination={false}
              columns={[
                { title: '日期', dataIndex: 'date', width: 96 },
                { title: '姓名', dataIndex: 'name', width: 72 },
                { title: '班次', dataIndex: 'shift', width: 72, render: (s: string) => <Tag color={SHIFT_COLOR[s]}>{s}</Tag> },
                { title: '工时', dataIndex: 'hours', width: 60, render: (h: number) => h ? `${h}h` : '-' },
              ]}
            />
            <Button type="link" icon={<ScheduleOutlined />} style={{ marginTop: 8, padding: 0 }}
                    onClick={() => message.info('演示：跳转排班表全月视图')}>
              查看本月完整排班表 →
            </Button>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card
            className="section-card"
            title={<Space><ClockCircleOutlined />原始打卡记录</Space>}
            extra={
              <Space>
                <DatePicker.RangePicker defaultValue={[dayjs('2026-06-16'), dayjs('2026-06-16')]} />
                <Select placeholder="异常类型" style={{ width: 120 }} allowClear options={[
                  { label: '全部', value: '' },
                  { label: '迟到', value: 'late' },
                  { label: '缺卡', value: 'missed' },
                  { label: '缺勤', value: 'absent' },
                ]} />
                <Button icon={<ReloadOutlined />}>刷新</Button>
              </Space>
            }
          >
            <Table<ClockRecord>
              size="small"
              rowKey="id"
              dataSource={CLOCK_DATA}
              pagination={{ pageSize: 5, showSizeChanger: false }}
              columns={[
                { title: '姓名', dataIndex: 'name', width: 80 },
                { title: '部门', dataIndex: 'department', width: 80, ellipsis: true },
                { title: '上班', dataIndex: 'clockIn', width: 60 },
                { title: '下班', dataIndex: 'clockOut', width: 60 },
                { title: '工时', dataIndex: 'workHours', width: 60, render: (h: number) => h ? `${h}h` : '-' },
                { title: '状态', dataIndex: 'status', width: 80, render: (s: ClockStatus) => {
                    const m = CLOCK_STATUS_MAP[s];
                    return <Tag color={m.color} icon={m.icon}>{m.label}</Tag>;
                  }
                },
                { title: '备注', dataIndex: 'remark', ellipsis: true, render: (v?: string) => v || <Text type="secondary">-</Text> },
              ]}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card className="section-card" title={<Space><CalendarOutlined />假期余额管理</Space>}>
            <Table<LeaveBalance>
              size="small"
              rowKey="type"
              dataSource={LEAVE_BALANCE}
              pagination={false}
              columns={[
                { title: '类型', dataIndex: 'type', width: 80 },
                { title: '总额', dataIndex: 'total', width: 60 },
                { title: '已用', dataIndex: 'used', width: 60 },
                { title: '剩余', dataIndex: 'remaining', width: 60, render: (v: number) => <Text strong style={{ color: v > 0 ? '#52c41a' : '#999' }}>{v}</Text> },
                { title: '操作', width: 80, render: (_: any, r: LeaveBalance) => (
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleOpenAdjust(r)}>调整</Button>
                  )
                },
              ]}
            />
            <Alert type="info" showIcon style={{ marginTop: 12 }} message="调整会通过钉钉 API 回写并记操作日志，请谨慎操作。" />
          </Card>
        </Col>
      </Row>

      <Card
        className="section-card"
        style={{ marginTop: 16 }}
        title={<Space><AuditOutlined />审批数据备查</Space>}
        extra={
          <Space>
            <Select placeholder="类型" style={{ width: 100 }} allowClear options={['请假', '加班', '外出', '出差', '补卡'].map(t => ({ label: t, value: t }))} />
            <Select placeholder="状态" style={{ width: 100 }} allowClear options={[
              { label: '审批中', value: 'pending' },
              { label: '已通过', value: 'approved' },
              { label: '已拒绝', value: 'rejected' },
            ]} />
            <DatePicker.RangePicker />
          </Space>
        }
      >
        <Table<ApprovalItem>
          size="small"
          rowKey="id"
          dataSource={APPROVAL_DATA}
          pagination={{ pageSize: 6, showSizeChanger: false }}
          columns={[
            { title: '单号', dataIndex: 'id', width: 100 },
            { title: '类型', dataIndex: 'type', width: 70, render: (t: ApprovalType) => <Tag color={APPROVAL_TYPE_COLOR[t]}>{t}</Tag> },
            { title: '申请人', dataIndex: 'applicant', width: 80 },
            { title: '部门', dataIndex: 'department', width: 80, ellipsis: true },
            { title: '时段', render: (_: any, r: ApprovalItem) => <span style={{ fontSize: 12 }}>{r.startTime}<br/>至 {r.endTime}</span> },
            { title: '时长', dataIndex: 'duration', width: 80 },
            { title: '事由', dataIndex: 'reason', ellipsis: true },
            { title: '状态', dataIndex: 'status', width: 80, render: (s: ApprovalStatus) => {
                const m = APPROVAL_STATUS_MAP[s];
                return <Badge status={m.color as any} text={m.label} />;
              }
            },
          ]}
        />
      </Card>

      <Card
        className="section-card"
        style={{ marginTop: 16 }}
        title={<Space><ThunderboltOutlined />快捷入口（去钉钉后台）</Space>}
      >
        <Row gutter={16}>
          {[
            { label: '考勤组设置', desc: '配置规则、定位、WiFi、班次算法', icon: <TeamOutlined />, color: '#1890ff' },
            { label: '班次管理', desc: '班次模板与计算规则', icon: <ScheduleOutlined />, color: '#13c2c2' },
            { label: '排班管理', desc: '按人按日批量排班', icon: <CalendarOutlined />, color: '#722ed1' },
            { label: '审批模板', desc: '请假/加班/补卡模板配置', icon: <SolutionOutlined />, color: '#fa8c16' },
          ].map(item => (
            <Col span={6} key={item.label}>
              <Card size="small" hoverable className="quick-card"
                    onClick={() => window.open('https://oa.dingtalk.com', '_blank')}>
                <div className="quick-icon" style={{ color: item.color }}>{item.icon}</div>
                <div className="quick-title">{item.label}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>
                <div className="quick-link"><ExportOutlined /> 打开钉钉</div>
              </Card>
            </Col>
          ))}
        </Row>
        <Text type="secondary" style={{ fontSize: 12, marginTop: 12, display: 'block' }}>
          说明：考勤组/班次/排班/审批模板等设置类操作仍在钉钉后台完成；本系统仅承担【读 + 备查 + 调账 + 跳转】职责。
        </Text>
      </Card>

      {/* 报表详情 Drawer */}
      <Drawer
        title="2026年06月 考勤汇总详情"
        placement="right"
        width={560}
        open={reportDrawerOpen}
        onClose={() => setReportDrawerOpen(false)}
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="部门">人事部</Descriptions.Item>
          <Descriptions.Item label="月份">2026-06</Descriptions.Item>
          <Descriptions.Item label="应出勤">528 人天</Descriptions.Item>
          <Descriptions.Item label="实际出勤">512 人天</Descriptions.Item>
          <Descriptions.Item label="出勤率">96.97%</Descriptions.Item>
          <Descriptions.Item label="迟到人次">11</Descriptions.Item>
          <Descriptions.Item label="早退人次">3</Descriptions.Item>
          <Descriptions.Item label="缺卡人次">6</Descriptions.Item>
          <Descriptions.Item label="事假"><Tag color="cyan">14 人天</Tag></Descriptions.Item>
          <Descriptions.Item label="病假"><Tag color="cyan">6 人天</Tag></Descriptions.Item>
          <Descriptions.Item label="年假"><Tag color="cyan">8 人天</Tag></Descriptions.Item>
          <Descriptions.Item label="调休"><Tag color="cyan">3 人天</Tag></Descriptions.Item>
        </Descriptions>
        <Divider>异常明细 Top 5</Divider>
        <List
          size="small"
          dataSource={[
            { name: '张子豪', type: '缺勤', day: '2026-06-12' },
            { name: '王嘉怡', type: '迟到', day: '2026-06-09' },
            { name: '刘欣然', type: '缺卡', day: '2026-06-05' },
            { name: '李梦琪', type: '迟到', day: '2026-06-03' },
            { name: '陈宇航', type: '缺卡', day: '2026-06-02' },
          ]}
          renderItem={(it) => (
            <List.Item>
              <List.Item.Meta
                avatar={<UserOutlined style={{ color: '#999' }} />}
                title={it.name}
                description={`${it.day} · ${it.type}`}
              />
            </List.Item>
          )}
        />
      </Drawer>

      {/* 假期余额调整 Modal */}
      <Modal
        title={`假期余额调整 - ${selectedEmployee?.type || ''}`}
        open={balanceAdjustOpen}
        onCancel={() => setBalanceAdjustOpen(false)}
        onOk={handleSubmitAdjust}
        okText="确认调整"
        cancelText="取消"
      >
        <Form form={adjustForm} layout="vertical">
          <Form.Item label="调整类型">
            <Select
              defaultValue="add"
              options={[
                { label: '增加 (+天)', value: 'add' },
                { label: '扣减 (-天)', value: 'sub' },
                { label: '结转 (carry over)', value: 'carry' },
                { label: '手工修正', value: 'fix' },
              ]}
            />
          </Form.Item>
          <Form.Item label="调整天数" name="delta" rules={[{ required: true, message: '请输入调整天数' }]}>
            <InputNumber step={0.5} placeholder="如 +1 或 -0.5" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="备注" name="reason" rules={[{ required: true, message: '请填写备注' }]}>
            <Input.TextArea rows={3} placeholder="例如：2025年年假结转 / 手工补录 / 离职结清" />
          </Form.Item>
          <Alert type="warning" showIcon message="本次操作将通过钉钉 API 回写并记入【假期调整操作日志】" />
        </Form>
      </Modal>
    </>
  );
};

/* ================= 子组件：员工侧 ================= */
const EmployeePanel: React.FC = () => {
  return (
    <>
      <Row gutter={16}>
        <Col span={8}>
          <Card className="section-card" title={<Space><ClockCircleOutlined />今日打卡</Space>}>
            <Statistic title="上班打卡" value={MY_STATS.todayClockIn} prefix={<FieldTimeOutlined />} valueStyle={{ color: '#52c41a' }} />
            <Divider style={{ margin: '12px 0' }} />
            <Statistic title="下班打卡" value={MY_STATS.todayClockOut} prefix={<FieldTimeOutlined />} valueStyle={{ color: '#1890ff' }} />
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>工作时长：9.2 小时（含 1h 加班）</Text>
          </Card>
        </Col>

        <Col span={8}>
          <Card className="section-card" title={<Space><CalendarOutlined />我的假期余额</Space>}>
            {LEAVE_BALANCE.filter(l => l.total > 0).slice(0, 5).map(l => {
              const pct = l.total ? Math.round((l.used / l.total) * 100) : 0;
              return (
                <div key={l.type} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>{l.type}</Text>
                    <Text><Text strong style={{ color: '#52c41a' }}>{l.remaining}</Text> / {l.total} 天</Text>
                  </div>
                  <Progress percent={pct} showInfo={false} strokeColor={pct > 80 ? '#faad14' : '#1890ff'} />
                </div>
              );
            })}
            <Button type="link" style={{ padding: 0 }} onClick={() => message.info('演示：跳转我的假期详情')}>查看全部假期类型 →</Button>
          </Card>
        </Col>

        <Col span={8}>
          <Card className="section-card" title={<Space><AuditOutlined />我的审批</Space>}>
            <Row gutter={16}>
              <Col span={12}><Statistic title="待我审批" value={0} valueStyle={{ color: '#999' }} /></Col>
              <Col span={12}><Statistic title="我发起的" value={MY_STATS.pendingMine} valueStyle={{ color: '#1890ff' }} /></Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <List
              size="small"
              dataSource={APPROVAL_DATA.filter(a => a.applicant === '程璐').slice(0, 3)}
              renderItem={(it) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Tag color={APPROVAL_TYPE_COLOR[it.type]}>{it.type}</Tag>}
                    title={it.reason}
                    description={`${it.startTime} · ${it.duration}`}
                  />
                  <Badge status={APPROVAL_STATUS_MAP[it.status].color as any} text={APPROVAL_STATUS_MAP[it.status].label} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card
        className="section-card"
        style={{ marginTop: 16 }}
        title={<Space><FileSearchOutlined />我的考勤记录</Space>}
        extra={
          <Space>
            <DatePicker.RangePicker defaultValue={[dayjs('2026-06-01'), dayjs('2026-06-16')]} />
            <Select defaultValue="month" options={[
              { label: '本月', value: 'month' },
              { label: '上月', value: 'last' },
              { label: '近3月', value: '3m' },
            ]} style={{ width: 100 }} />
          </Space>
        }
      >
        <Table<ClockRecord>
          size="small"
          rowKey="id"
          dataSource={CLOCK_DATA.filter(c => c.name === '程璐' || c.name === '黄一萧')}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          columns={[
            { title: '日期', dataIndex: 'date', width: 110 },
            { title: '姓名', dataIndex: 'name', width: 80 },
            { title: '上班', dataIndex: 'clockIn', width: 70 },
            { title: '下班', dataIndex: 'clockOut', width: 70 },
            { title: '工时', dataIndex: 'workHours', width: 70, render: (h: number) => h ? `${h}h` : '-' },
            { title: '状态', dataIndex: 'status', width: 90, render: (s: ClockStatus) => {
                const m = CLOCK_STATUS_MAP[s];
                return <Tag color={m.color} icon={m.icon}>{m.label}</Tag>;
              }
            },
            { title: '备注', dataIndex: 'remark', ellipsis: true, render: (v?: string) => v || '-' },
          ]}
        />
      </Card>

      <Card
        className="section-card"
        style={{ marginTop: 16 }}
        title={<Space><ThunderboltOutlined />我的快捷操作</Space>}
      >
        <Row gutter={16}>
          {[
            { label: '请假申请', icon: <CalendarOutlined />, color: '#52c41a', desc: '年假/事假/病假' },
            { label: '加班申请', icon: <RiseOutlined />, color: '#fa8c16', desc: '工作日加班/周末加班' },
            { label: '外出申请', icon: <FieldTimeOutlined />, color: '#13c2c2', desc: '因公外出' },
            { label: '出差申请', icon: <SolutionOutlined />, color: '#722ed1', desc: '异地出差' },
            { label: '补卡申请', icon: <EditOutlined />, color: '#eb2f96', desc: '漏打卡补录' },
            { label: '打开钉钉', icon: <LinkOutlined />, color: '#1890ff', desc: '跳转钉钉打卡' },
          ].map(item => (
            <Col span={4} key={item.label}>
              <Card size="small" hoverable className="quick-card" onClick={() => message.info(`演示：触发【${item.label}】`)}>
                <div className="quick-icon" style={{ color: item.color }}>{item.icon}</div>
                <div className="quick-title">{item.label}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </>
  );
};

/* ================= 主页面 ================= */
const DailyPage: React.FC = () => {
  const { user } = useAuthStore();
  const userIsAdmin = isAdmin(user?.role as any);

  const stats = userIsAdmin ? STATS_ALL : {
    todayPresent: 1, todayLate: MY_STATS.thisMonthLate, todayAbsent: 0,
    pendingApprovals: MY_STATS.pendingMine, thisMonthLeave: 2.5, thisMonthOvertime: 6,
  };

  return (
    <div>
      <div className="page-header">
        <Title level={2}>日常管理 <Tag color="blue" style={{ marginLeft: 8, fontSize: 14 }}>钉钉事务</Tag></Title>
        <Text type="secondary">
          {userIsAdmin
            ? '考勤查看、假期调账、审批备查、排班核对、报表导出'
            : '我的打卡、我的假期、我的审批'}
        </Text>
      </div>

      <div className="stats-row">
        <Card className="stat-card">
          <Statistic
            title={userIsAdmin ? '今日出勤' : '本月迟到'}
            value={userIsAdmin ? stats.todayPresent : stats.todayLate}
            suffix={userIsAdmin ? '人' : '次'}
            prefix={userIsAdmin ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            valueStyle={{ color: userIsAdmin ? '#52c41a' : '#faad14' }}
          />
          <div className="stat-trend">
            <RiseOutlined /> 较昨日 <Text type="success">+3</Text>
          </div>
        </Card>
        <Card className="stat-card">
          <Statistic
            title={userIsAdmin ? '待审批请假' : '我的待审批'}
            value={stats.pendingApprovals}
            prefix={<CalendarOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
          <div className="stat-trend">
            <MinusOutlined /> 持平
          </div>
        </Card>
        <Card className="stat-card">
          <Statistic
            title={userIsAdmin ? '本月请假' : '我的年假剩余'}
            value={userIsAdmin ? stats.thisMonthLeave : MY_STATS.remainingAnnual}
            suffix={userIsAdmin ? '人天' : '天'}
            prefix={userIsAdmin ? <FileSearchOutlined /> : <ScheduleOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
          <div className="stat-trend">
            <FallOutlined /> 较上月 <Text type="danger">-2</Text>
          </div>
        </Card>
        <Card className="stat-card">
          <Statistic
            title={userIsAdmin ? '本月加班' : '今日工时'}
            value={userIsAdmin ? stats.thisMonthOvertime : '9.2'}
            suffix={userIsAdmin ? '人次' : 'h'}
            prefix={userIsAdmin ? <RiseOutlined /> : <FieldTimeOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
          <div className="stat-trend">
            <RiseOutlined /> 较上周 <Text type="success">+5</Text>
          </div>
        </Card>
      </div>

      <Tabs
        defaultActiveKey={userIsAdmin ? 'report' : 'mine'}
        size="large"
        items={userIsAdmin
          ? [
              { key: 'report',   label: <span><FileSearchOutlined />考勤报表/统计</span>, children: <AdminPanel /> },
              { key: 'clock',    label: <span><ClockCircleOutlined />原始打卡记录</span>, children: null },
              { key: 'leave',    label: <span><CalendarOutlined />假期余额管理</span>, children: null },
              { key: 'approval', label: <span><AuditOutlined />审批数据备查</span>, children: null },
              { key: 'schedule', label: <span><ScheduleOutlined />排班结果核对</span>, children: null },
              { key: 'shortcut', label: <span><ThunderboltOutlined />快捷入口</span>, children: null },
            ]
          : [
              { key: 'mine',     label: <span><UserOutlined />我的考勤</span>, children: <EmployeePanel /> },
              { key: 'apply',    label: <span><CalendarOutlined />我的申请</span>, children: null },
            ]}
      />
    </div>
  );
};

export default DailyPage;
