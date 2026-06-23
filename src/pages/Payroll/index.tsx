import React, { useState } from 'react';
import {
  Card, Table, Button, Tag, Space, Typography, Row, Col, Statistic, Tabs,
  Modal, Form, Input, Select, DatePicker, InputNumber, message, Tooltip,
  Alert, Progress, Steps, List, Divider, Badge,
} from 'antd';
import {
  DollarOutlined, CalendarOutlined, ScheduleOutlined, FileTextOutlined,
  BankOutlined, SafetyOutlined, FileDoneOutlined, PlusOutlined,
  DownloadOutlined, SyncOutlined, CheckCircleOutlined, WarningOutlined,
  ClockCircleOutlined, TeamOutlined, LockOutlined, UnlockOutlined,
  SendOutlined, EyeOutlined, EditOutlined,
} from '@ant-design/icons';
import { useAuthStore, canEdit } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

// ─── 月度Payroll核算流程（表4-1）─────────────────────────────────────────────
const payrollFlow = [
  { step: 1, action: '导入/同步当月考勤数据（对接钉钉）', owner: '人事专员' },
  { step: 2, action: '导入当月请假记录，计算假期扣款', owner: '人事专员' },
  { step: 3, action: '确认当月社保、公积金缴纳基数及金额', owner: '人事专员' },
  { step: 4, action: '录入当月特殊项目（奖金、补贴、扣款等）', owner: '人事专员' },
  { step: 5, action: '系统自动计算应发、实发薪资', owner: '系统自动' },
  { step: 6, action: '人事专员审核核算结果，确认无误', owner: '人事专员' },
  { step: 7, action: '人事负责人复核审批', owner: '人事负责人' },
  { step: 8, action: 'Jenny最终确认发放', owner: 'Jenny' },
  { step: 9, action: '系统生成当月工资单，推送给员工', owner: '系统自动' },
];

// ─── 薪资核算字段（表4-2）────────────────────────────────────────────────────
const payrollFields = [
  { key: '1', category: '基本信息', field: '员工姓名 / 部门 / 职位', desc: '自动带出' },
  { key: '2', category: '基本信息', field: '薪资月份', desc: '当月年月' },
  { key: '3', category: '应发项', field: '基本工资', desc: '合同约定月薪' },
  { key: '4', category: '应发项', field: '绩效奖金', desc: '当月绩效（如有）' },
  { key: '5', category: '应发项', field: '补贴', desc: '餐补/交通补/其他补贴' },
  { key: '6', category: '应发项', field: '加班费', desc: '根据考勤计算' },
  { key: '7', category: '扣款项', field: '请假扣款', desc: '根据请假记录计算' },
  { key: '8', category: '扣款项', field: '个人社保', desc: '员工社保个人缴纳部分' },
  { key: '9', category: '扣款项', field: '个人公积金', desc: '员工公积金个人缴纳部分' },
  { key: '10', category: '扣款项', field: '个税', desc: '按国家规定计算（可配置或手动录入）' },
  { key: '11', category: '扣款项', field: '其他扣款', desc: '备注说明' },
  { key: '12', category: '汇总', field: '应发合计', desc: '自动计算' },
  { key: '13', category: '汇总', field: '扣款合计', desc: '自动计算' },
  { key: '14', category: '汇总', field: '实发合计', desc: '应发 - 扣款' },
];

// ─── 考勤功能说明（表4-3）────────────────────────────────────────────────────
const attendanceFeatures = [
  { key: '1', feature: '考勤数据同步', desc: '对接钉钉API，自动拉取员工每日打卡记录' },
  { key: '2', feature: '考勤异常标记', desc: '自动标记：迟到、早退、缺勤、未打卡、请假等异常' },
  { key: '3', feature: '手动补录', desc: '员工或HR可发起补卡申请，经部门负责人审批后生效' },
  { key: '4', feature: '月度汇总', desc: '按月统计每位员工：出勤天数、迟到次数、早退次数、缺勤天数、请假天数等' },
  { key: '5', feature: '数据导出', desc: '支持按部门/按月导出Excel考勤汇总报表' },
  { key: '6', feature: '考勤规则配置', desc: '支持配置上班时间、弹性打卡范围、迟到扣款规则等' },
];

// ─── 假期类型（表4-4）────────────────────────────────────────────────────────
const leaveTypes = [
  { key: '1', type: '年假', calc: '按工龄/合同约定计算年假余额', approval: '部门负责人 → HR', remark: '支持余额查询、按年结转或归零' },
  { key: '2', type: '病假', calc: '凭医院证明', approval: '部门负责人 → HR', remark: '不同病假天数可能有不同扣薪规则' },
  { key: '3', type: '事假', calc: '按天扣薪', approval: '部门负责人 → HR', remark: '' },
  { key: '4', type: '婚假', calc: '按国家规定天数', approval: '部门负责人 → HR', remark: '需提供婚姻证明' },
  { key: '5', type: '产假/陪产假', calc: '按国家规定天数', approval: '部门负责人 → HR', remark: '需提供相关证明材料' },
  { key: '6', type: '丧假', calc: '按国家规定天数', approval: '部门负责人 → HR', remark: '' },
  { key: '7', type: '调休', calc: '凭加班记录抵扣', approval: '部门负责人', remark: '' },
  { key: '8', type: '出差', calc: '不扣薪', approval: '部门负责人 → HR', remark: '' },
];

// ─── 社保险种（表4-6，上海）──────────────────────────────────────────────────
const insuranceItems = [
  { key: '1', type: '养老保险', company: '16%', personal: '8%', remark: '' },
  { key: '2', type: '医疗保险', company: '10%', personal: '2%+3元', remark: '' },
  { key: '3', type: '失业保险', company: '0.5%', personal: '0.5%', remark: '' },
  { key: '4', type: '工伤保险', company: '按行业基准', personal: '0', remark: '' },
  { key: '5', type: '生育保险', company: '1%', personal: '0', remark: '' },
  { key: '6', type: '住房公积金', company: '7%（可配置）', personal: '7%（可配置）', remark: '' },
  { key: '7', type: '补充公积金', company: '可配置', personal: '0', remark: '视员工类型' },
];

// ─── 社保功能（表4-5）────────────────────────────────────────────────────────
const socialInsFeatures = [
  { key: '1', feature: '参保信息管理', desc: '维护每位员工的社保缴纳城市、险种、缴纳比例、缴纳基数' },
  { key: '2', feature: '月度缴纳记录', desc: '记录每月社保/公积金实际缴纳金额（公司缴纳部分+个人缴纳部分）' },
  { key: '3', feature: '增员操作', desc: '新员工入职时由人事专员填写参保信息，社保专员确认办理' },
  { key: '4', feature: '减员操作', desc: '员工离职时由人事专员发起减员，社保专员确认停缴' },
  { key: '5', feature: '基数调整', desc: '按国家规定进行年度基数调整，HR填写新基数，经审批后生效' },
  { key: '6', feature: '补缴', desc: '因延误等原因需补缴时，记录补缴月份和金额' },
  { key: '7', feature: '数据导出', desc: '支持导出月度社保/公积金缴纳汇总表（用于对账）' },
];

// ─── 商保功能（表4-7）────────────────────────────────────────────────────────
const commercialInsFeatures = [
  { key: '1', feature: '参保信息维护', desc: '维护每位员工的商保套餐类型、参保日期、保额' },
  { key: '2', feature: '增员操作', desc: '新员工入职后，人事专员发起商保增员，商保专员确认办理' },
  { key: '3', feature: '减员操作', desc: '员工离职时，人事专员发起商保减员，商保专员确认停保' },
  { key: '4', feature: '理赔申请', desc: '员工通过员工服务板块发起理赔申请，提交理赔材料，由HR转交商保专员处理' },
  { key: '5', feature: '保单信息查看', desc: 'HR可查看当前有效保单列表及覆盖人数' },
  { key: '6', feature: '月度账单核对', desc: '对比商保公司账单与系统记录，确认无误后完成对账' },
];

// ─── 工资单功能（表4-8）──────────────────────────────────────────────────────
const payslipFeatures = [
  { key: '1', feature: '自动生成', desc: '月度Payroll审批通过后，系统自动根据核算结果生成每位员工的工资单' },
  { key: '2', feature: '工资单内容', desc: '展示：员工姓名、工号、部门、月份、各薪资明细项（应发项+扣款项）、实发合计' },
  { key: '3', feature: '推送方式', desc: '工资单生成后，系统通知员工可在员工服务板块查看；支持PDF格式下载' },
  { key: '4', feature: '查看权限', desc: '员工只能查看本人工资单；HR/人事负责人/Jenny可查看所有员工工资单' },
  { key: '5', feature: '历史查询', desc: '员工可查看过去12个月的工资单记录' },
  { key: '6', feature: '数据加密', desc: '工资单数据传输加密，防止中间人截获' },
];

const categoryColors: Record<string, string> = {
  '基本信息': '#1890ff',
  '应发项': '#52c41a',
  '扣款项': '#ff4d4f',
  '汇总': '#722ed1',
};

const PayrollPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('monthly');

  return (
    <div style={{ padding: 24 }}>
      {/* 页头 */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <DollarOutlined style={{ fontSize: 28, color: '#faad14' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#262626' }}>Payroll 薪酬管理</div>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 2 }}>
            月度Payroll · 考勤记录 · 假期管理 · 社保公积金 · 商业保险 · 工资单
          </div>
        </div>
        {user && canEdit(user.role) && (
          <Button type="primary" icon={<PlusOutlined />} size="large">新建月度Payroll</Button>
        )}
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic title="本月在职人员" value={13} suffix="人" prefix={<TeamOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic title="本月应发总额" value="¥--" prefix={<DollarOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic title="待处理考勤异常" value={3} suffix="条" prefix={<WarningOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic title="待审批请假" value={1} suffix="条" prefix={<ClockCircleOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      {/* 数据安全提示 */}
      <Alert
        type="warning"
        showIcon
        icon={<SafetyOutlined />}
        style={{ marginBottom: 16, borderRadius: 8 }}
        message="数据安全提示"
        description="薪资数据仅HR和授权人员可查看；员工只能通过员工服务板块查看本人薪资条；所有薪资查看操作记录操作日志；建议数据库中薪资字段加密存储。"
      />

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          // ─── Tab 1: 月度Payroll ───────────────────────────────────
          {
            key: 'monthly',
            label: <span><CalendarOutlined /> 月度Payroll</span>,
            children: (
              <div>
                {/* 核算流程 */}
                <Card title="月度Payroll核算流程（表4-1）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={payrollFlow}
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
                        render: (v: string) => <Tag color={v === '系统自动' ? 'green' : 'blue'}>{v}</Tag> },
                    ]}
                  />
                </Card>

                {/* 薪资核算字段 */}
                <Card title="薪资核算字段（表4-2）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={payrollFields}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '字段分类', dataIndex: 'category', width: 100,
                        render: (v: string) => <Tag color={categoryColors[v]}>{v}</Tag> },
                      { title: '字段名称', dataIndex: 'field', width: 200,
                        render: (v: string) => <Text strong>{v}</Text> },
                      { title: '说明', dataIndex: 'desc' },
                    ]}
                  />
                </Card>

                {/* 待补充 */}
                <Card title="核算规则配置" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Alert
                    type="warning"
                    showIcon
                    message="【待补充】请补充以下核算规则"
                    description={
                      <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                        <li>个税计算方式（是否系统自动计算或手动录入）</li>
                        <li>绩效奖金计算规则</li>
                        <li>薪资核算锁定机制（锁定后是否允许修改、修改流程）</li>
                      </ul>
                    }
                    style={{ borderRadius: 6 }}
                  />
                </Card>

                {/* 模拟薪资列表 */}
                <Card title={<span><DollarOutlined /> 2026年6月薪资核算</span>} style={{ borderRadius: 10 }}>
                  <div className="table-toolbar">
                    <Space>
                      <Badge status="processing" text="核算中 - 步骤5/9" />
                      <Progress percent={55} size="small" style={{ width: 120 }} />
                    </Space>
                    <Space>
                      <Button icon={<SyncOutlined />}>同步考勤数据</Button>
                      <Button icon={<DownloadOutlined />}>导出薪资表</Button>
                      {user && canEdit(user.role) && (
                        <Button type="primary" icon={<CheckCircleOutlined />}>审核确认</Button>
                      )}
                    </Space>
                  </div>
                  <Table
                    dataSource={[
                      { key: '1', name: '员工A', dept: '技术部', base: 15000, bonus: 2000, subsidy: 500, total_gross: 17500, total_deduct: 3500, net: 14000, status: 'confirmed' },
                      { key: '2', name: '员工B', dept: '行政部', base: 12000, bonus: 1000, subsidy: 500, total_gross: 13500, total_deduct: 2700, net: 10800, status: 'pending' },
                      { key: '3', name: '员工C', dept: '财务部', base: 13000, bonus: 1500, subsidy: 500, total_gross: 15000, total_deduct: 3000, net: 12000, status: 'pending' },
                    ]}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '姓名', dataIndex: 'name', width: 80 },
                      { title: '部门', dataIndex: 'dept', width: 80 },
                      { title: '基本工资', dataIndex: 'base', width: 100, render: (v: number) => `¥${v.toLocaleString()}` },
                      { title: '绩效奖金', dataIndex: 'bonus', width: 100, render: (v: number) => `¥${v.toLocaleString()}` },
                      { title: '补贴', dataIndex: 'subsidy', width: 80, render: (v: number) => `¥${v.toLocaleString()}` },
                      { title: '应发合计', dataIndex: 'total_gross', width: 100, render: (v: number) => <Text strong style={{ color: '#52c41a' }}>¥{v.toLocaleString()}</Text> },
                      { title: '扣款合计', dataIndex: 'total_deduct', width: 100, render: (v: number) => <Text style={{ color: '#ff4d4f' }}>¥{v.toLocaleString()}</Text> },
                      { title: '实发', dataIndex: 'net', width: 100, render: (v: number) => <Text strong style={{ color: '#1890ff' }}>¥{v.toLocaleString()}</Text> },
                      { title: '状态', dataIndex: 'status', width: 80,
                        render: (v: string) => v === 'confirmed'
                          ? <Tag color="success">已确认</Tag>
                          : <Tag color="warning">待确认</Tag> },
                    ]}
                  />
                </Card>
              </div>
            ),
          },

          // ─── Tab 2: 考勤记录 ───────────────────────────────────────
          {
            key: 'attendance',
            label: <span><ScheduleOutlined /> 考勤记录</span>,
            children: (
              <div>
                <Card title="考勤记录功能说明（表4-3）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={attendanceFeatures}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '功能', dataIndex: 'feature', width: 140,
                        render: (v: string) => <Text strong>{v}</Text> },
                      { title: '说明', dataIndex: 'desc' },
                    ]}
                  />
                </Card>

                <Card title="考勤展示字段" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Paragraph style={{ marginBottom: 0 }}>
                    展示字段：员工姓名、部门、日期、应到时间、实际打卡时间（上班/下班）、考勤状态（正常/迟到/早退/缺勤/请假/出差/加班）、备注
                  </Paragraph>
                </Card>

                <Card title="【待补充】考勤规则配置" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Alert
                    type="warning"
                    showIcon
                    message="请补充以下考勤规则"
                    description={
                      <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                        <li>钉钉API对接方式（是否已确认接口文档）</li>
                        <li>弹性打卡时间范围（如上班时间09:00，允许弹性±X分钟）</li>
                        <li>迟到/早退认定标准</li>
                      </ul>
                    }
                    style={{ borderRadius: 6 }}
                  />
                </Card>

                <Card title={<span><ScheduleOutlined /> 本月考勤汇总</span>} style={{ borderRadius: 10 }}>
                  <div className="table-toolbar">
                    <Space>
                      <Button icon={<SyncOutlined />} type="primary" ghost>同步钉钉数据</Button>
                      <Button icon={<DownloadOutlined />}>导出考勤报表</Button>
                    </Space>
                  </div>
                  <Table
                    dataSource={[
                      { key: '1', name: '员工A', dept: '技术部', attend: 22, late: 1, early: 0, absent: 0, leave: 0, status: 'normal' },
                      { key: '2', name: '员工B', dept: '行政部', attend: 21, late: 0, early: 0, absent: 0, leave: 1, status: 'normal' },
                      { key: '3', name: '员工C', dept: '财务部', attend: 20, late: 2, early: 1, absent: 0, leave: 1, status: 'abnormal' },
                    ]}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '姓名', dataIndex: 'name', width: 80 },
                      { title: '部门', dataIndex: 'dept', width: 80 },
                      { title: '出勤天数', dataIndex: 'attend', width: 90 },
                      { title: '迟到次数', dataIndex: 'late', width: 90,
                        render: (v: number) => v > 0 ? <Tag color="orange">{v}</Tag> : v },
                      { title: '早退次数', dataIndex: 'early', width: 90,
                        render: (v: number) => v > 0 ? <Tag color="orange">{v}</Tag> : v },
                      { title: '缺勤天数', dataIndex: 'absent', width: 90,
                        render: (v: number) => v > 0 ? <Tag color="red">{v}</Tag> : v },
                      { title: '请假天数', dataIndex: 'leave', width: 90,
                        render: (v: number) => v > 0 ? <Tag color="blue">{v}</Tag> : v },
                      { title: '状态', dataIndex: 'status', width: 80,
                        render: (v: string) => v === 'normal' ? <Tag color="success">正常</Tag> : <Tag color="warning">有异常</Tag> },
                    ]}
                  />
                </Card>
              </div>
            ),
          },

          // ─── Tab 3: 假期管理 ───────────────────────────────────────
          {
            key: 'leave',
            label: <span><FileTextOutlined /> 假期管理</span>,
            children: (
              <div>
                <Card title="假期类型说明（表4-4）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={leaveTypes}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '假期类型', dataIndex: 'type', width: 120,
                        render: (v: string) => <Tag color="blue">{v}</Tag> },
                      { title: '计算方式', dataIndex: 'calc', width: 200 },
                      { title: '审批流程', dataIndex: 'approval', width: 140 },
                      { title: '备注', dataIndex: 'remark' },
                    ]}
                  />
                </Card>

                <Card title="假期申请流程" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <ol style={{ paddingLeft: 20, marginBottom: 0, lineHeight: 2 }}>
                    <li>员工在系统中发起请假申请（员工服务端入口），填写假期类型、开始时间、结束时间、原因</li>
                    <li>系统自动计算请假天数（排除节假日和周末）</li>
                    <li>经直属部门负责人 → HR审批后生效</li>
                    <li>审批通过后自动同步至考勤记录，对应日期标记为对应假期类型</li>
                    <li>年假余额自动扣减</li>
                  </ol>
                </Card>

                <Card title="【待补充】假期规则配置" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Alert
                    type="warning"
                    showIcon
                    message="请补充以下假期规则"
                    description={
                      <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                        <li>年假计算规则（如按入职日期每年几天、是否按工龄递增）</li>
                        <li>病假薪资扣减规则</li>
                        <li>跨月假期是否需要分别计算</li>
                      </ul>
                    }
                    style={{ borderRadius: 6 }}
                  />
                </Card>

                <Card title={<span><CalendarOutlined /> 本月请假记录</span>} style={{ borderRadius: 10 }}>
                  <Table
                    dataSource={[
                      { key: '1', name: '员工A', type: '年假', start: '2026-06-10', end: '2026-06-11', days: 2, reason: '家庭事务', status: 'approved' },
                      { key: '2', name: '员工C', type: '病假', start: '2026-06-15', end: '2026-06-15', days: 1, reason: '感冒发烧', status: 'pending' },
                    ]}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '姓名', dataIndex: 'name', width: 80 },
                      { title: '假期类型', dataIndex: 'type', width: 90,
                        render: (v: string) => <Tag color="blue">{v}</Tag> },
                      { title: '开始日期', dataIndex: 'start', width: 110 },
                      { title: '结束日期', dataIndex: 'end', width: 110 },
                      { title: '天数', dataIndex: 'days', width: 60 },
                      { title: '事由', dataIndex: 'reason', width: 120, ellipsis: true },
                      { title: '状态', dataIndex: 'status', width: 80,
                        render: (v: string) => v === 'approved' ? <Tag color="success">已批准</Tag> : <Tag color="warning">待审批</Tag> },
                    ]}
                  />
                </Card>
              </div>
            ),
          },

          // ─── Tab 4: 社保/公积金 ────────────────────────────────────
          {
            key: 'social',
            label: <span><BankOutlined /> 社保/公积金</span>,
            children: (
              <div>
                <Card title="社保&公积金功能说明（表4-5）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={socialInsFeatures}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '功能', dataIndex: 'feature', width: 140,
                        render: (v: string) => <Text strong>{v}</Text> },
                      { title: '说明', dataIndex: 'desc' },
                    ]}
                  />
                </Card>

                <Card title="上海社保险种及缴纳比例（表4-6，参考，以实际政策为准）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={insuranceItems}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '险种', dataIndex: 'type', width: 120,
                        render: (v: string) => <Tag color="cyan">{v}</Tag> },
                      { title: '公司缴纳比例', dataIndex: 'company', width: 120,
                        render: (v: string) => <Text style={{ color: '#1890ff' }}>{v}</Text> },
                      { title: '个人缴纳比例', dataIndex: 'personal', width: 120,
                        render: (v: string) => <Text style={{ color: '#ff4d4f' }}>{v}</Text> },
                      { title: '备注', dataIndex: 'remark' },
                    ]}
                  />
                </Card>

                <Card title="【待补充】社保缴纳基数" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Alert
                    type="warning"
                    showIcon
                    message="请补充以下社保配置"
                    description={
                      <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                        <li>公司实际执行的社保缴纳基数标准（上下限）</li>
                        <li>是否有不同员工类型采用不同缴纳方案</li>
                        <li>补充公积金适用范围</li>
                      </ul>
                    }
                    style={{ borderRadius: 6 }}
                  />
                </Card>

                <Card title={<span><BankOutlined /> 本月社保缴纳汇总</span>} style={{ borderRadius: 10 }}>
                  <div className="table-toolbar">
                    <Text strong>2026年6月 · 上海</Text>
                    <Button icon={<DownloadOutlined />}>导出缴纳汇总表</Button>
                  </div>
                  <Table
                    dataSource={[
                      { key: '1', name: '员工A', base: 15000, pension_c: 2400, pension_p: 1200, medical_c: 1500, medical_p: 303, total_c: 3900, total_p: 1503 },
                      { key: '2', name: '员工B', base: 12000, pension_c: 1920, pension_p: 960, medical_c: 1200, medical_p: 243, total_c: 3120, total_p: 1203 },
                    ]}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    scroll={{ x: 800 }}
                    columns={[
                      { title: '姓名', dataIndex: 'name', width: 80 },
                      { title: '缴纳基数', dataIndex: 'base', width: 100, render: (v: number) => `¥${v.toLocaleString()}` },
                      { title: '养老(公司)', dataIndex: 'pension_c', width: 100, render: (v: number) => `¥${v}` },
                      { title: '养老(个人)', dataIndex: 'pension_p', width: 100, render: (v: number) => `¥${v}` },
                      { title: '医疗(公司)', dataIndex: 'medical_c', width: 100, render: (v: number) => `¥${v}` },
                      { title: '医疗(个人)', dataIndex: 'medical_p', width: 100, render: (v: number) => `¥${v}` },
                      { title: '公司合计', dataIndex: 'total_c', width: 100, render: (v: number) => <Text strong style={{ color: '#1890ff' }}>¥{v}</Text> },
                      { title: '个人合计', dataIndex: 'total_p', width: 100, render: (v: number) => <Text strong style={{ color: '#ff4d4f' }}>¥{v}</Text> },
                    ]}
                  />
                </Card>
              </div>
            ),
          },

          // ─── Tab 5: 商业保险 ───────────────────────────────────────
          {
            key: 'commercial',
            label: <span><SafetyOutlined /> 商业保险</span>,
            children: (
              <div>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16, borderRadius: 8 }}
                  message="商保专员分工"
                  description="Carrie 负责友邦商保管理，Shenmingming 负责友邦意外险管理。人事专员发起信息，商保专员执行确认。"
                />

                <Card title="商业保险功能说明（表4-7）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={commercialInsFeatures}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '功能', dataIndex: 'feature', width: 140,
                        render: (v: string) => <Text strong>{v}</Text> },
                      { title: '说明', dataIndex: 'desc' },
                    ]}
                  />
                </Card>

                <Card title="【待补充】商保套餐配置" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Alert
                    type="warning"
                    showIcon
                    message="请补充以下商保信息"
                    description={
                      <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                        <li>商保套餐具体内容（医疗险保额/意外险保额/是否含牙科/视光）</li>
                        <li>员工类型与商保套餐的对应关系</li>
                        <li>理赔材料清单要求</li>
                      </ul>
                    }
                    style={{ borderRadius: 6 }}
                  />
                </Card>

                <Card title={<span><SafetyOutlined /> 在保人员列表</span>} style={{ borderRadius: 10 }}>
                  <div className="table-toolbar">
                    <Space>
                      <Button icon={<PlusOutlined />}>商保增员</Button>
                      <Button>商保减员</Button>
                      <Button icon={<DownloadOutlined />}>导出在保名单</Button>
                    </Space>
                  </div>
                  <Table
                    dataSource={[
                      { key: '1', name: '员工A', plan: '友邦团体医疗险', start: '2026-01-01', amount: '100万', status: 'active' },
                      { key: '2', name: '员工B', plan: '友邦意外险', start: '2026-01-01', amount: '50万', status: 'active' },
                      { key: '3', name: '员工C', plan: '友邦团体医疗险', start: '2026-03-01', amount: '100万', status: 'active' },
                    ]}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '姓名', dataIndex: 'name', width: 80 },
                      { title: '商保套餐', dataIndex: 'plan', width: 160,
                        render: (v: string) => <Tag color="purple">{v}</Tag> },
                      { title: '参保日期', dataIndex: 'start', width: 110 },
                      { title: '保额', dataIndex: 'amount', width: 80 },
                      { title: '状态', dataIndex: 'status', width: 80,
                        render: () => <Tag color="success">在保</Tag> },
                    ]}
                  />
                </Card>
              </div>
            ),
          },

          // ─── Tab 6: 工资单 ─────────────────────────────────────────
          {
            key: 'payslip',
            label: <span><FileDoneOutlined /> 工资单</span>,
            children: (
              <div>
                <Card title="工资单功能说明（表4-8）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={payslipFeatures}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '功能', dataIndex: 'feature', width: 120,
                        render: (v: string) => <Text strong>{v}</Text> },
                      { title: '说明', dataIndex: 'desc' },
                    ]}
                  />
                </Card>

                <Card title="【待补充】工资单配置" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Alert
                    type="warning"
                    showIcon
                    message="请补充以下工资单配置"
                    description={
                      <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                        <li>工资单推送时间（每月几号发放）</li>
                        <li>是否需要员工在系统中进行工资单确认签收</li>
                      </ul>
                    }
                    style={{ borderRadius: 6 }}
                  />
                </Card>

                <Card title={<span><FileDoneOutlined /> 工资单发送记录</span>} style={{ borderRadius: 10 }}>
                  <div className="table-toolbar">
                    <Space>
                      <Button type="primary" icon={<SendOutlined />}>生成并发送本月工资单</Button>
                      <Button icon={<DownloadOutlined />}>批量导出</Button>
                    </Space>
                  </div>
                  <Table
                    dataSource={[
                      { key: '1', month: '2026-05', count: 13, sent_at: '2026-06-05 10:00', status: 'sent', read: 12 },
                      { key: '2', month: '2026-04', count: 13, sent_at: '2026-05-05 10:00', status: 'sent', read: 13 },
                      { key: '3', month: '2026-03', count: 13, sent_at: '2026-04-05 10:00', status: 'sent', read: 13 },
                    ]}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '薪资月份', dataIndex: 'month', width: 100,
                        render: (v: string) => <Tag color="blue">{v}</Tag> },
                      { title: '发送人数', dataIndex: 'count', width: 90 },
                      { title: '发送时间', dataIndex: 'sent_at', width: 160 },
                      { title: '已查阅', dataIndex: 'read', width: 90,
                        render: (v: number, r: any) => `${v}/${r.count} 人` },
                      { title: '状态', dataIndex: 'status', width: 80,
                        render: () => <Tag color="success">已发送</Tag> },
                      { title: '操作', width: 100,
                        render: () => <Button size="small" icon={<EyeOutlined />}>查看明细</Button> },
                    ]}
                  />
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default PayrollPage;
