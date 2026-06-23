import React, { useState } from 'react';
import {
  Card, Table, Button, Tag, Space, Typography, Row, Col, Statistic, Tabs,
  Modal, Form, Input, Select, DatePicker, Upload, message, Tooltip,
  Alert, List, Divider, Badge, Steps, Empty, Input as AntInput,
} from 'antd';
import {
  CustomerServiceOutlined, SolutionOutlined, UserOutlined, GiftOutlined,
  TeamOutlined, HomeOutlined, FileSearchOutlined, DesktopOutlined,
  IdcardOutlined, SafetyOutlined, MedicineBoxOutlined, RobotOutlined,
  BulbOutlined, MessageOutlined, DownloadOutlined, PlusOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
  FileTextOutlined, CalendarOutlined, RightOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// ─── 账号系统说明（表5-4）────────────────────────────────────────────────────
const accountSystems = [
  { key: '1', system: '本系统（HRO）', owner: 'Jason（黄欢欢）', note: '入职时开设' },
  { key: '2', system: '企业邮箱', owner: 'Jason（黄欢欢）', note: '入职时开设' },
  { key: '3', system: 'HKMS系统', owner: 'Jason（黄欢欢）', note: '入职时开设（如适用）' },
  { key: '4', system: '钉钉', owner: '人事专员', note: '入职当天完成' },
];

// ─── 福利分类（表5-5）────────────────────────────────────────────────────────
const benefitCategories = [
  { key: '1', category: '节日福利', desc: '春节、中秋、端午等节日礼品或补贴', icon: <GiftOutlined />, color: '#f5222d' },
  { key: '2', category: '生日福利', desc: '员工生日当月福利（蛋糕券/贺卡等）', icon: <GiftOutlined />, color: '#eb2f96' },
  { key: '3', category: '健康福利', desc: '年度体检、商业保险等健康保障', icon: <MedicineBoxOutlined />, color: '#52c41a' },
  { key: '4', category: '商保福利', desc: '团体商业保险参保及理赔服务', icon: <SafetyOutlined />, color: '#1890ff' },
  { key: '5', category: '其他福利', desc: '运动卡、人才公寓、培训补贴等', icon: <CustomerServiceOutlined />, color: '#722ed1' },
];

// ─── 服务目录（表5-11）───────────────────────────────────────────────────────
const serviceCatalog = [
  { key: '1', category: '人事服务', items: ['开具在职证明', '开具收入证明', '开具离职证明', '档案调阅申请'], icon: <FileTextOutlined />, color: '#1890ff' },
  { key: '2', category: '行政服务', items: ['工位调整申请', '工牌补办', '办公用品申领', '设备申领/维修'], icon: <DesktopOutlined />, color: '#13c2c2' },
  { key: '3', category: '假期服务', items: ['请假申请', '调休申请', '出差申请'], icon: <CalendarOutlined />, color: '#52c41a' },
  { key: '4', category: '财务服务', items: ['报销申请', '备用金申请（如有）'], icon: <SolutionOutlined />, color: '#faad14' },
  { key: '5', category: '福利服务', items: ['运动卡申请', '人才公寓申请', '体检预约', '商保理赔'], icon: <GiftOutlined />, color: '#722ed1' },
  { key: '6', category: '培训服务', items: ['培训报名', '外部培训申请'], icon: <TeamOutlined />, color: '#f5222d' },
];

// ─── 智能客服功能（表5-12）───────────────────────────────────────────────────
const aiServiceFeatures = [
  { key: '1', feature: '常见问题解答', desc: '内置HR常见问题知识库（考勤规则、假期政策、社保问题等），员工输入问题自动匹配答案' },
  { key: '2', feature: '引导申请', desc: '智能客服可识别员工意图，引导员工跳转至对应申请入口' },
  { key: '3', feature: '人工转接', desc: '智能客服无法解答时，可转接至HR人工服务' },
];

// ─── 我要建议功能（表5-13）───────────────────────────────────────────────────
const suggestionFeatures = [
  { key: '1', feature: '建议提交', desc: '员工可匿名或实名提交对公司/HR/系统的建议或反馈' },
  { key: '2', feature: '建议状态', desc: '已提交 / 处理中 / 已处理' },
  { key: '3', feature: 'HR回复', desc: 'HR可在系统中回复员工建议，员工收到回复通知' },
];

const EmployeeServicePage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('office');
  const [suggestionModal, setSuggestionModal] = useState(false);
  const [form] = Form.useForm();

  return (
    <div style={{ padding: 24 }}>
      {/* 页头 */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <CustomerServiceOutlined style={{ fontSize: 28, color: '#722ed1' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#262626' }}>员工服务</div>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 2 }}>
            办公配置 · 员工福利 · 生活服务 · 服务大厅 — 面向全体员工的自助服务入口
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic title="本月服务申请" value={8} suffix="件" prefix={<FileTextOutlined />} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic title="待处理申请" value={2} suffix="件" prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic title="在保人数" value={13} suffix="人" prefix={<SafetyOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic title="福利发放批次" value={1} suffix="批" prefix={<GiftOutlined />} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
      </Row>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16, borderRadius: 8 }}
        message="员工服务板块面向全体员工开放"
        description="员工通过个人账号登录后，可查看个人相关信息、提交服务申请、查询申请进度、享受公司福利服务。HR在此板块维护福利政策和服务目录。"
      />

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          // ─── Tab 1: 办公配置 ───────────────────────────────────────
          {
            key: 'office',
            label: <span><DesktopOutlined /> 办公配置</span>,
            children: (
              <div>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  {/* 工位查看 */}
                  <Col span={12}>
                    <Card title={<span><HomeOutlined /> 工位查看（表5-1）</span>} style={{ borderRadius: 10 }} size="small">
                      <Table
                        dataSource={[
                          { key: '1', feature: '工位信息查看', desc: '员工可查看本人已分配工位的位置信息（楼层/区域/工位编号）' },
                          { key: '2', feature: '工位地图（可选）', desc: '展示办公室工位平面图，标注本人工位位置（如有工位地图资源）' },
                          { key: '3', feature: '工位调整申请', desc: '员工发起工位调整申请，经部门负责人 → 物业确认' },
                        ]}
                        rowKey="key"
                        pagination={false}
                        size="small"
                        columns={[
                          { title: '功能', dataIndex: 'feature', width: 120, render: (v: string) => <Text strong>{v}</Text> },
                          { title: '说明', dataIndex: 'desc' },
                        ]}
                      />
                      <Alert type="warning" showIcon style={{ marginTop: 8, borderRadius: 6 }}
                        message="【待补充】工位编号命名规则；是否有工位地图；工位调整申请频次限制" />
                    </Card>
                  </Col>

                  {/* 电脑设备申领 */}
                  <Col span={12}>
                    <Card title={<span><DesktopOutlined /> 电脑设备申领（表5-2）</span>} style={{ borderRadius: 10 }} size="small">
                      <Table
                        dataSource={[
                          { key: '1', feature: '设备申领', desc: '员工提交电脑/外设申领申请，填写申领原因，经部门负责人 → IT审批' },
                          { key: '2', feature: '我的设备', desc: '员工查看名下已领用设备列表（设备名称/型号/序列号/领用日期）' },
                          { key: '3', feature: '设备归还', desc: '离职或归还时，IT确认设备回收并更新记录' },
                          { key: '4', feature: '设备维修申请', desc: '员工提交设备维修申请，IT跟进处理' },
                        ]}
                        rowKey="key"
                        pagination={false}
                        size="small"
                        columns={[
                          { title: '功能', dataIndex: 'feature', width: 120, render: (v: string) => <Text strong>{v}</Text> },
                          { title: '说明', dataIndex: 'desc' },
                        ]}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* 工牌发放 */}
                <Card title={<span><IdcardOutlined /> 工牌发放（表5-3）</span>} style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                        <IdcardOutlined style={{ fontSize: 28, color: '#1890ff', marginBottom: 8 }} />
                        <div style={{ fontWeight: 500 }}>工牌信息查看</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>员工查看本人工牌状态（是否已领取）</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                        <PlusOutlined style={{ fontSize: 28, color: '#faad14', marginBottom: 8 }} />
                        <div style={{ fontWeight: 500 }}>补办工牌申请</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>工牌丢失时，员工提交补办申请，经HR确认后由物业制作</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                        <FileTextOutlined style={{ fontSize: 28, color: '#52c41a', marginBottom: 8 }} />
                        <div style={{ fontWeight: 500 }}>发放记录</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>HR/物业记录工牌发放及补办记录</div>
                      </div>
                    </Col>
                  </Row>
                </Card>

                {/* 账号权限管理 */}
                <Card title={<span><SafetyOutlined /> 账号权限管理（表5-4）</span>} style={{ borderRadius: 10 }} size="small">
                  <Table
                    dataSource={accountSystems}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '系统名称', dataIndex: 'system', width: 150,
                        render: (v: string) => <Tag color="blue">{v}</Tag> },
                      { title: '账号负责人', dataIndex: 'owner', width: 150 },
                      { title: '说明', dataIndex: 'note' },
                    ]}
                  />
                  <Alert type="warning" showIcon style={{ marginTop: 8, borderRadius: 6 }}
                    message="【待补充】员工账号申请流程（员工是否可自行申请新系统权限、还是全部由HR/IT发起）；账号离职注销流程" />
                </Card>
              </div>
            ),
          },

          // ─── Tab 2: 员工福利 ───────────────────────────────────────
          {
            key: 'benefits',
            label: <span><GiftOutlined /> 员工福利</span>,
            children: (
              <div>
                {/* 福利政策 */}
                <Card title="福利政策分类（表5-5）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Row gutter={[12, 12]}>
                    {benefitCategories.map(item => (
                      <Col span={8} key={item.key}>
                        <div style={{
                          border: `1px solid ${item.color}33`,
                          borderRadius: 10, padding: 16,
                          background: `${item.color}08`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 20, color: item.color }}>{item.icon}</span>
                            <Text strong style={{ fontSize: 14 }}>{item.category}</Text>
                          </div>
                          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{item.desc}</div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                  <Alert type="warning" showIcon style={{ marginTop: 12, borderRadius: 6 }}
                    message="【待补充】公司当前福利政策列表（节假日福利标准、生日福利、是否有餐补/交通补等）" />
                </Card>

                {/* 礼品领取 */}
                <Card title="礼品领取（表5-6）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={[
                      { key: '1', feature: '福利发放通知', desc: 'HR在系统中创建福利发放批次，推送通知给符合条件的员工' },
                      { key: '2', feature: '员工确认领取', desc: '员工收到通知后在系统中确认领取，HR记录实际发放结果' },
                      { key: '3', feature: '发放状态追踪', desc: '展示每批次福利的发放状态（待领取/已领取/逾期未领）' },
                    ]}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '功能', dataIndex: 'feature', width: 120, render: (v: string) => <Text strong>{v}</Text> },
                      { title: '说明', dataIndex: 'desc' },
                    ]}
                  />
                </Card>

                {/* 本月福利发放 */}
                <Card title={<span><GiftOutlined /> 福利发放记录</span>} style={{ marginBottom: 16, borderRadius: 10 }}>
                  <Table
                    dataSource={[
                      { key: '1', batch: '2026端午礼盒', category: '节日福利', target: '全体在职员工', count: 13, claimed: 10, status: 'ongoing' },
                      { key: '2', batch: '2026Q1生日会', category: '生日福利', target: 'Q1生日员工', count: 3, claimed: 3, status: 'completed' },
                    ]}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '批次', dataIndex: 'batch', width: 140,
                        render: (v: string) => <Tag color="purple">{v}</Tag> },
                      { title: '分类', dataIndex: 'category', width: 100 },
                      { title: '发放对象', dataIndex: 'target', width: 120 },
                      { title: '应领人数', dataIndex: 'count', width: 90 },
                      { title: '已领取', dataIndex: 'claimed', width: 80,
                        render: (v: number, r: any) => <Text style={{ color: v === r.count ? '#52c41a' : '#faad14' }}>{v}/{r.count}</Text> },
                      { title: '状态', dataIndex: 'status', width: 80,
                        render: (v: string) => v === 'completed'
                          ? <Tag color="success">已完成</Tag>
                          : <Tag color="processing">进行中</Tag> },
                    ]}
                  />
                </Card>

                {/* 商保理赔 */}
                <Card title="商保理赔（表5-7）" style={{ borderRadius: 10 }} size="small">
                  <Table
                    dataSource={[
                      { key: '1', feature: '理赔申请发起', desc: '员工填写理赔申请：事故/就医日期、理赔类型、费用金额、上传凭证' },
                      { key: '2', feature: '材料上传', desc: '支持上传发票、病历、医院诊断证明等理赔材料' },
                      { key: '3', feature: '理赔进度查询', desc: '员工可查看本人理赔申请的处理状态' },
                      { key: '4', feature: 'HR转交商保', desc: 'HR收到申请后，整理材料转交友邦商保专员处理' },
                    ]}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '功能', dataIndex: 'feature', width: 120, render: (v: string) => <Text strong>{v}</Text> },
                      { title: '说明', dataIndex: 'desc' },
                    ]}
                  />
                </Card>
              </div>
            ),
          },

          // ─── Tab 3: 生活服务 ───────────────────────────────────────
          {
            key: 'life',
            label: <span><MedicineBoxOutlined /> 生活服务</span>,
            children: (
              <div>
                {/* HRO运动卡 */}
                <Card title={<span><TeamOutlined /> HRO运动卡（表5-8）</span>} style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={[
                      { key: '1', feature: '运动卡申请', desc: '符合条件的员工发起运动卡申请，填写申请理由' },
                      { key: '2', feature: '申请状态查看', desc: '员工查看申请审批状态和运动卡信息' },
                      { key: '3', feature: 'HR维护', desc: 'HR管理运动卡申请名单，与合作健身机构对接' },
                    ]}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '功能', dataIndex: 'feature', width: 120, render: (v: string) => <Text strong>{v}</Text> },
                      { title: '说明', dataIndex: 'desc' },
                    ]}
                  />
                  <Alert type="warning" showIcon style={{ marginTop: 8, borderRadius: 6 }}
                    message="【待补充】运动卡申请条件（入职满X个月、全职员工等）；合作健身机构名称/地址；运动卡费用是否全额补贴" />
                </Card>

                {/* 人才公寓 */}
                <Card title={<span><HomeOutlined /> 人才公寓申请（表5-9）</span>} style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={[
                      { key: '1', feature: '公寓申请', desc: '符合条件的员工发起人才公寓申请，填写申请信息' },
                      { key: '2', feature: '审批流程', desc: '部门负责人 → HR确认资格 → 统一上报' },
                      { key: '3', feature: '申请状态查看', desc: '员工查看申请审批状态' },
                    ]}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '功能', dataIndex: 'feature', width: 120, render: (v: string) => <Text strong>{v}</Text> },
                      { title: '说明', dataIndex: 'desc' },
                    ]}
                  />
                  <Alert type="warning" showIcon style={{ marginTop: 8, borderRadius: 6 }}
                    message="【待补充】人才公寓申请资格要求（户籍/年龄/工龄等）；公寓申请渠道（政府平台或企业集体申请）；申请流程和材料" />
                </Card>

                {/* 年度体检 */}
                <Card title={<span><MedicineBoxOutlined /> 年度体检预约（表5-10）</span>} style={{ borderRadius: 10 }} size="small">
                  <Table
                    dataSource={[
                      { key: '1', feature: '体检通知', desc: 'HR发布年度体检安排通知（体检机构/时间段/套餐说明）' },
                      { key: '2', feature: '体检预约', desc: '员工在系统中提交体检预约申请，选择时间段' },
                      { key: '3', feature: '体检记录', desc: 'HR录入员工体检完成记录' },
                      { key: '4', feature: '报告上传', desc: '员工可上传体检报告至个人档案' },
                    ]}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '功能', dataIndex: 'feature', width: 100, render: (v: string) => <Text strong>{v}</Text> },
                      { title: '说明', dataIndex: 'desc' },
                    ]}
                  />
                  <Alert type="warning" showIcon style={{ marginTop: 8, borderRadius: 6 }}
                    message="【待补充】年度体检合作机构；体检套餐内容及费用承担方式；体检是否强制要求" />
                </Card>
              </div>
            ),
          },

          // ─── Tab 4: 服务大厅 ───────────────────────────────────────
          {
            key: 'hall',
            label: <span><CustomerServiceOutlined /> 服务大厅</span>,
            children: (
              <div>
                {/* 服务目录 */}
                <Card title="全部服务目录（表5-11）" style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Row gutter={[12, 12]}>
                    {serviceCatalog.map(cat => (
                      <Col xs={24} sm={12} lg={8} key={cat.key}>
                        <div style={{
                          border: `1px solid ${cat.color}33`,
                          borderRadius: 10, padding: '14px 16px',
                          background: `${cat.color}06`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <span style={{ fontSize: 18, color: cat.color }}>{cat.icon}</span>
                            <Text strong style={{ fontSize: 14 }}>{cat.category}</Text>
                          </div>
                          <Space wrap size={[4, 4]}>
                            {cat.items.map(item => (
                              <Tag key={item} style={{ cursor: 'pointer', fontSize: 12, margin: 0 }}
                                color={cat.color}>
                                {item}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      </Col>
                    ))}
                  </Row>
                  <Alert type="warning" showIcon style={{ marginTop: 12, borderRadius: 6 }}
                    message="【待补充】是否有报销申请功能（报销单填写、凭证上传、审批流）；外部培训申请费用审批流程" />
                </Card>

                {/* 智能客服 */}
                <Card title={<span><RobotOutlined /> 智能客服（表5-12）</span>} style={{ marginBottom: 16, borderRadius: 10 }} size="small">
                  <Table
                    dataSource={aiServiceFeatures}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '功能', dataIndex: 'feature', width: 120, render: (v: string) => <Text strong>{v}</Text> },
                      { title: '说明', dataIndex: 'desc' },
                    ]}
                  />
                  <Alert type="warning" showIcon style={{ marginTop: 8, borderRadius: 6 }}
                    message="【待补充】智能客服知识库初始内容（常见问题列表）；是否需要接入第三方AI客服平台" />
                </Card>

                {/* 我要建议 */}
                <Card title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><BulbOutlined /> 我要建议（表5-13）</span>
                    <Button type="primary" icon={<PlusOutlined />} size="small"
                      onClick={() => { form.resetFields(); setSuggestionModal(true); }}>
                      提交建议
                    </Button>
                  </div>
                } style={{ borderRadius: 10 }} size="small">
                  <Table
                    dataSource={suggestionFeatures}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '功能', dataIndex: 'feature', width: 100, render: (v: string) => <Text strong>{v}</Text> },
                      { title: '说明', dataIndex: 'desc' },
                    ]}
                  />
                </Card>
              </div>
            ),
          },
        ]}
      />

      {/* 建议提交弹窗 */}
      <Modal
        title="提交建议"
        open={suggestionModal}
        onCancel={() => setSuggestionModal(false)}
        onOk={() => form.submit()}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={(values) => {
          message.success('建议已提交，感谢您的反馈！');
          setSuggestionModal(false);
        }}>
          <Form.Item name="anonymous" label="提交方式" rules={[{ required: true }]}>
            <Select options={[
              { label: '匿名提交', value: 'anonymous' },
              { label: '实名提交', value: 'realname' },
            ]} />
          </Form.Item>
          <Form.Item name="category" label="建议类别" rules={[{ required: true }]}>
            <Select options={[
              { label: '公司建议', value: 'company' },
              { label: 'HR建议', value: 'hr' },
              { label: '系统建议', value: 'system' },
              { label: '其他', value: 'other' },
            ]} />
          </Form.Item>
          <Form.Item name="content" label="建议内容" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请详细描述您的建议或反馈..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeServicePage;
