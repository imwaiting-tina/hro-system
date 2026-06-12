import React, { useEffect, useState } from 'react';
import { Card, Button, Tag, Typography, Steps, Space, message, Collapse, Row, Col, Progress, Alert, Table, Timeline, Divider, Input } from 'antd';
import {
  CheckCircleOutlined, ReadOutlined, TrophyOutlined,
  BankOutlined, HistoryOutlined, SafetyCertificateOutlined,
  FileProtectOutlined, TeamOutlined, DollarOutlined,
  AuditOutlined, FileTextOutlined, MailOutlined,
  PhoneOutlined, EnvironmentOutlined, ClockCircleOutlined,
  SendOutlined, EyeOutlined, SaveOutlined, UploadOutlined,
} from '@ant-design/icons';
import supabase from '../../utils/supabase';
import { useOutletContext } from 'react-router-dom';
import WelcomeCard from './WelcomeCard';
import type { OnboardingContext } from './index';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// ============================================================
// 培训模块内容（基于HRS-002-新员工入职培训-v20250324.pptx）
// ============================================================

interface TrainingModule {
  key: string;
  name: string;
  icon: React.ReactNode;
  order: number;
  /** 详细内容渲染函数 */
  renderContent: () => React.ReactNode;
}

const TRAINING_MODULES: TrainingModule[] = [
  // ---- 模块1: 公司简介 ----
  {
    key: 'company_intro', name: '公司简介', icon: <BankOutlined />, order: 1,
    renderContent: () => (
      <div>
        <Paragraph>
          开弈集团成立于 <Text strong>2003年</Text>，总部位于<Text strong>上海</Text>。
          作为大中华地区领先的人力资源服务平台运营商，开弈集团凭借着专业的服务能力和良好的资源整合能力，
          已在亚太地区主要的商业中心城市以及中国<Text strong>100多个城市</Text>建立了人力资源外包服务网络，
          并在美国、香港、北京、天津、深圳、南京等地设有子公司及分公司。
        </Paragraph>
        <Paragraph>
          成立二十二年来，开弈通过专业服务的持续积累，现已形成<Text strong>"3+1"四大优势业务板块</Text>：
        </Paragraph>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {['人力资源外包', '人才服务社区', 'HRO共享服务平台', '人力资源研究院'].map((item, i) => (
            <Col span={6} key={i}>
              <Card size="small" style={{ textAlign: 'center', background: '#f0f5ff' }}>
                <Text strong style={{ color: '#1890ff' }}>{item}</Text>
              </Card>
            </Col>
          ))}
        </Row>
        <Alert
          type="info"
          showIcon={false}
          message={null}
          description={
            <Text style={{ fontSize: 15 }}>
              世界在变，对优秀人才的渴望没有改变，开弈
              <Text strong style={{ color: '#1890ff' }}>"以人为本，用心于人"</Text>
              的服务理念不会改变。以专业服务与客户共同成长，是开弈集团的发展初心和归依。
            </Text>
          }
        />
      </div>
    ),
  },

  // ---- 模块2: 发展史 ----
  {
    key: 'history', name: '发展史', icon: <HistoryOutlined />, order: 2,
    renderContent: () => (
      <div>
        <Timeline
          items={[
            { children: <><Text strong>2003</Text> — 筹备启动公司</> },
            { children: <><Text strong>2006</Text> — 开启客户薪酬外包计算业务</> },
            { children: <><Text strong>2007</Text> — 成为包括世界500强在内公司的薪酬福利外包提供商</> },
            { children: <><Text strong>2008</Text> — 在普陀区天地软件园正式成立开弈信息公司，开弈人才从徐汇区迁入普陀区；启动信息技术产品研发</> },
            { children: <><Text strong>2009</Text> — 服务网络遍布亚太地区100多个城市，客户超过1000家，服务年均高峰覆盖10万人次</> },
            { children: <><Text strong>2014</Text> — 开弈信息（中国）获高新技术企业</> },
            { children: <><Text strong>2015</Text> — HRO创享人才社区筹备启动</> },
            { children: <><Text strong>2016</Text> — 公司完成集团化整合</> },
            { children: <><Text strong>2017</Text> — 启动人才服务社区的空间改造；获得ISO9001质量管理体系认证</> },
            { children: <><Text strong>2018</Text> — 执行集团化、平台化战略</> },
            { children: <><Text strong>2019</Text> — 启动注册人力资源研究院</> },
            { children: <><Text strong>2021</Text> — HRO创享人才社区核心区域开启企业服务招商</> },
            { children: <><Text strong>2022</Text> — HRO创享人才社区着眼于聚集HR人群，服务好未来成长企业</> },
          ]}
        />
      </div>
    ),
  },

  // ---- 模块3: 荣誉资质 ----
  {
    key: 'honors', name: '荣誉资质', icon: <SafetyCertificateOutlined />, order: 3,
    renderContent: () => (
      <div>
        <Table
          dataSource={[
            { year: '2017', honors: '亚太人力资源服务供应商 · 人力资源派遣服务规范地方标准贯标单位 · 上海市普陀区年度区域发展贡献奖 · 年度信得过人力资源服务机构 · 创税亿元企业' },
            { year: '2018', honors: 'ISO9001质量管理体系认证 · 上海市普陀区年度区域发展贡献一等奖 · 年度社会责任突出贡献奖 · 创税亿元企业' },
            { year: '2019', honors: '上海市普陀区年度区域发展贡献一等奖 · 年度社会责任突出贡献奖 · 上海市五一劳动奖状 · 全国人力资源诚信服务示范机构' },
            { year: '2020', honors: '上海市普陀区年度区域发展贡献二等奖 · 2020中国人力资源服务机构100强 · 2020年度普陀区经济贡献重点企业' },
            { year: '2021', honors: '普陀区2021年度高质量发展领军企业 · 2021年度创税亿元企业' },
          ]}
          columns={[
            { title: '年份', dataIndex: 'year', key: 'year', width: 80, render: (v: string) => <Text strong style={{ color: '#fa8c16' }}>{v}</Text> },
            { title: '荣誉', dataIndex: 'honors', key: 'honors' },
          ]}
          pagination={false}
          size="small"
          bordered
        />
      </div>
    ),
  },

  // ---- 模块4: 行政制度 ----
  {
    key: 'admin_rules', name: '行政制度', icon: <FileProtectOutlined />, order: 4,
    renderContent: () => (
      <div>
        <Collapse accordion defaultActiveKey={['1']}>
          <Panel header={<Text strong>办公用品</Text>} key="1">
            <Paragraph>
              行政序列人员统一在月底购买办公用品。若有办公用品的需求请在<Text strong>月底前申报</Text>，
              否则记入下月购买清单中。若遇特殊情况需<Text strong>提前两天申请</Text>。
            </Paragraph>
          </Panel>
          <Panel header={<Text strong>办公设备</Text>} key="2">
            <Paragraph>
              按照办公设备的使用须知安全环保使用办公设备。为了提倡环保意识和习惯，降低公司用纸的办公成本，
              请各位节约使用纸张，<Text strong>能用废纸打印复印的提倡不使用新纸</Text>。
            </Paragraph>
          </Panel>
          <Panel header={<Text strong>办公卫生</Text>} key="3">
            <Paragraph>
              保持公共区域及自身周边区域卫生的清洁。保持洗手间马桶的清洁，
              <Text strong type="danger">不许站在马桶上或者将脏污丢入马桶</Text>。
            </Paragraph>
          </Panel>
          <Panel header={<Text strong>办公安全</Text>} key="4">
            <Paragraph>
              <Text strong>最后一个离开办公区域的人</Text>负责关电脑、关灯、关空调（风扇）、关窗、关门等。
            </Paragraph>
          </Panel>
        </Collapse>
      </div>
    ),
  },

  // ---- 模块5: 人事制度-入离职 ----
  {
    key: 'hr_rules', name: '人事制度-入离职', icon: <TeamOutlined />, order: 5,
    renderContent: () => (
      <div>
        <Card size="small" title={<Text strong>续签合同</Text>} style={{ marginBottom: 12 }}>
          <Paragraph>
            在合同到期前<Text strong>一个月</Text>，由员工填写《劳动合同续签意向表》提交予公司人力资源部及其直属上司。
            如员工未提出的，公司可视为员工无续签劳动合同之意愿。如员工有续签劳动合同之意愿的，
            公司应于合同到期日前给予明确答复，如未予以答复的，视为不同意续签。
          </Paragraph>
        </Card>
        <Card size="small" title={<Text strong>离职</Text>}>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>提前<Text strong type="danger">30天</Text>告知</li>
            <li style={{ marginBottom: 8 }}>做好工作交接</li>
            <li>员工在其离职后，仍应遵守员工手册规定的<Text strong>保密义务</Text></li>
          </ul>
        </Card>
      </div>
    ),
  },

  // ---- 模块6: 人事制度-薪酬福利 ----
  {
    key: 'salary', name: '人事制度-薪酬福利', icon: <DollarOutlined />, order: 6,
    renderContent: () => (
      <div>
        <Collapse accordion defaultActiveKey={['1']}>
          <Panel header={<Text strong>薪酬标准</Text>} key="1">
            <Paragraph>
              按照公司的工资制度执行，公司按照职级及职位所需要资历制定不同的薪酬级别。
              员工的薪酬包括<Text strong>基本工资</Text>（必备）、以及履职工资（或称绩效工资）、各类津贴、
              交通或餐饮津贴报销、提成、奖金、佣金等（非必备）。
              公司将根据其经营状况及员工的工作表现，调整工资。
            </Paragraph>
          </Panel>
          <Panel header={<Text strong>发薪时间</Text>} key="2">
            <Paragraph>
              薪酬的实际发放日为<Text strong>次月5日前</Text>，遇节假日提前或顺延。
            </Paragraph>
          </Panel>
          <Panel header={<Text strong>薪酬依据</Text>} key="3">
            <Paragraph>
              核实后的或按规定经过批准后的《考勤记录》、《履职工作报告》、《KPI考核申请表》
              和《提成、奖金、佣金申请表》为计算薪酬的书面依据。
            </Paragraph>
          </Panel>
          <Panel header={<Text strong type="danger">薪酬保密</Text>} key="4">
            <Paragraph>
              员工薪酬是公司的<Text strong type="danger">机密资料</Text>，
              任何人员不得向其他人询问或告知他人有关个人薪金。
            </Paragraph>
          </Panel>
        </Collapse>

        <Divider orientation="left">福利一览</Divider>
        <Row gutter={[12, 12]}>
          {[
            { label: '五险一金', desc: '养老、医疗、失业、生育、工伤 + 公积金', color: '#1890ff' },
            { label: '商业保险', desc: '门急诊补贴，意外保险', color: '#722ed1' },
            { label: '年节福利', desc: '春节、端午、中秋福利；三八妇女节礼物；各类喜庆礼金', color: '#eb2f96' },
            { label: '生日祝福', desc: '您的生日公司记得，生日蛋糕券奉上', color: '#fa8c16' },
            { label: '旅游福利', desc: '根据公司总体业绩及个人服务业绩，安排短途、长途旅游', color: '#52c41a' },
            { label: '年度体检', desc: '关爱您的健康，每年定制体检方案', color: '#13c2c2' },
            { label: '午餐茶歇', desc: '每日提供工作午餐，不定期有下午茶点心', color: '#2f54eb' },
            { label: '弹性福利', desc: '弹性福利平台', color: '#a0d911' },
          ].map((item) => (
            <Col span={12} key={item.label}>
              <Card size="small" style={{ borderLeft: `3px solid ${item.color}` }}>
                <Text strong style={{ color: item.color }}>{item.label}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>{item.desc}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    ),
  },

  // ---- 模块7: 财务报销 ----
  {
    key: 'finance', name: '财务报销', icon: <AuditOutlined />, order: 7,
    renderContent: () => (
      <div>
        <Collapse accordion defaultActiveKey={['1']}>
          <Panel header={<Text strong>市内交通费</Text>} key="1">
            <Paragraph>暂采用实报实销原则。后续将根据集团整体人员层级架构及绩效考核体系等制度调整。</Paragraph>
            <ul style={{ paddingLeft: 20 }}>
              <li>原则上以<Text strong>公共交通为主</Text></li>
              <li>确需乘坐出租车出行的，应先报主管领导同意后报销，出租车票据后面必须写清<Text strong>起、止点</Text></li>
              <li>私车公用的，油费按公司到目的地的实际距离，<Text strong>1元/公里</Text>报销，过路费、停车费实报实销</li>
            </ul>
          </Panel>
          <Panel header={<Text strong>招待费</Text>} key="2">
            <Paragraph>
              招待费包括因公请客的餐费、礼品费、旅游费、赠送商品、赠送返利卡开支等。
              发生招待费用根据实际发生内容开具发票。
            </Paragraph>
            <ul style={{ paddingLeft: 20 }}>
              <li>各部门因公招待须<Text strong>事先在钉钉内申请</Text>，原则上不允许先斩后奏</li>
              <li>参与招待活动的人员中（集团总裁除外），以<Text strong>最高级别的人员</Text>为报销申请人，不得指定下级人员提出申请并自己审批报销</li>
              <li>本着"必需、节俭、适当"的原则，控制陪同人员数量，严禁铺张浪费</li>
            </ul>
          </Panel>
          <Panel header={<Text strong>差旅费</Text>} key="3">
            <Paragraph>
              公司人员因公外出所发生的交通费、住宿费、出差补贴等按规定标准在限额内实报实销，
              <Text strong type="danger">超出标准部分自行承担</Text>。
            </Paragraph>
            <ul style={{ paddingLeft: 20 }}>
              <li>出差时提前在<Text strong>钉钉内提交申请</Text>，审批完毕的出差申请应抄送人事部记录考勤</li>
              <li>若因工作需要延长出差时间，应打电话向公司请示；若因私事无故延长出差时间，公司不予报销差旅费</li>
              <li>出差住宿费按不超过公司规定标准实报实销，超出部分不予报销</li>
              <li>出差交通费（不含上海市内）应提供出差当地交通发票，按标准实报实销</li>
            </ul>
          </Panel>
          <Panel header={<Text strong>加班补贴</Text>} key="4">
            <Paragraph>
              工作日加班的工作时间超过<Text strong>21:00（含）</Text>或上午<Text strong>7:00（含）之前</Text>到公司加班者，
              或双休日连续工作<Text strong>4小时（含）以上</Text>的，凭符合规定的《加班申请单》，
              可实报实销不超过每次<Text strong type="danger">100元</Text>的餐费和交通补贴。
            </Paragraph>
          </Panel>
        </Collapse>
      </div>
    ),
  },

  // ---- 模块8: 印章制度 ----
  {
    key: 'seal', name: '印章制度', icon: <FileTextOutlined />, order: 8,
    renderContent: () => (
      <div>
        <Alert
          type="error"
          showIcon
          message="违规后果"
          description={
            <div>
              <Paragraph style={{ marginBottom: 8 }}>
                对于以下任一情形，一经查证属实，<Text strong type="danger">立即给予辞退处分</Text>，
                造成公司损失的，应赔偿公司损失，触犯刑法者，报执法机关处理：
              </Paragraph>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                <li>伪造、变造有关主管之签字或以其它欺骗手段申请用印者</li>
                <li>印章携出者未按照本规定在未经事先核准的文件上用印者</li>
              </ul>
            </div>
          }
        />
      </div>
    ),
  },

  // ---- 模块9: 员工义务 ----
  {
    key: 'obligations', name: '员工义务', icon: <CheckCircleOutlined />, order: 9,
    renderContent: () => (
      <div>
        <Paragraph>作为开弈的一员，您有以下责任和义务：</Paragraph>
        {[
          '保证所提供的个人信息的真实性和准确性',
          '遵守公司的所有规章制度，服从公司对其工作的各项合理要求和安排',
          '定期查看自己的电子邮件并及时予以回复（公司邮箱统一做业务备份，请勿使用公司邮箱处理个人事务）',
          '及时查看公司以各种形式发布或更新的规章制度、通知等文件内容',
          '在工作时间内完成岗位职责任务',
          '保守公司机密信息，保证公司利益',
          '妥善使用和保管公司资产（手提电脑、台式电脑、电话、U盘、文具等）',
          '禁止占用公司资源做与工作无关的事情',
        ].map((item, i) => (
          <div key={i} style={{
            padding: '10px 14px', marginBottom: 8, borderRadius: 8,
            background: i % 2 === 0 ? '#f0f5ff' : '#f6ffed',
            borderLeft: '3px solid #1890ff',
          }}>
            <Text>{i + 1}. {item}</Text>
          </div>
        ))}
      </div>
    ),
  },
];

// ============================================================
// 员工培训页面（面向员工本人，HR只看结果）
// ============================================================

const StaffTraining: React.FC = () => {
  const {
    selectedEmployeeId: employeeId,
    selectedEmployee,
    announcementData: ctxAnnouncementData,
    onAnnouncementChange: setAnnouncementData,
    saveAnnouncement,
  } = useOutletContext<OnboardingContext>();
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [localAnnouncement, setLocalAnnouncement] = useState<any>(ctxAnnouncementData || {
    display_name: '', department_name: '', position_title: '',
    onboard_date: '', avatar_url: '', self_intro: '', education_bg: '',
  });

  const fetchProgress = async () => {
    if (!employeeId) return;
    setLoading(true);
    let { data } = await supabase.from('employee_training_progress')
      .select('*').eq('employee_id', employeeId).order('module_order');

    if (!data || data.length === 0) {
      await supabase.from('employee_training_progress').insert(
        TRAINING_MODULES.map((m) => ({
          employee_id: employeeId,
          module_key: m.key,
          module_name: m.name,
          module_order: m.order,
          is_read: false,
        }))
      );
      const { data: fresh } = await supabase.from('employee_training_progress')
        .select('*').eq('employee_id', employeeId).order('module_order');
      data = fresh || [];
    }

    setProgress(data);
    setLoading(false);
  };

  useEffect(() => { fetchProgress(); }, [employeeId]);

  // 同步 context 中的公告数据
  useEffect(() => {
    if (ctxAnnouncementData) {
      setLocalAnnouncement(ctxAnnouncementData);
    }
  }, [ctxAnnouncementData, employeeId]);

  const handleAnnouncementChange = (field: string, value: string) => {
    const updated = { ...localAnnouncement, [field]: value };
    setLocalAnnouncement(updated);
    if (setAnnouncementData) setAnnouncementData(updated);
  };

  const handleSaveAnnouncement = async () => {
    if (!employeeId) return;
    if (saveAnnouncement) await saveAnnouncement();
    else {
      const { data: existing } = await supabase.from('welcome_announcements')
        .select('id').eq('employee_id', employeeId).maybeSingle();
      if (existing) {
        await supabase.from('welcome_announcements').update(localAnnouncement).eq('id', existing.id);
      } else {
        await supabase.from('welcome_announcements').insert({
          ...localAnnouncement, employee_id: employeeId, status: 'draft',
        });
      }
      message.success('迎新公告已保存');
    }
  };

  const handlePublishAnnouncement = async () => {
    await handleSaveAnnouncement();
    if (!employeeId) return;
    await supabase.from('welcome_announcements')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('employee_id', employeeId);
    message.success('迎新公告已发布！');
  };

  const markAsRead = async (moduleOrder: number) => {
    const mod = progress.find((p: any) => p.module_order === moduleOrder);
    if (!mod) return;
    await supabase.from('employee_training_progress').update({
      is_read: true, read_at: new Date().toISOString(),
    }).eq('id', mod.id);
    message.success(`「${mod.module_name}」已确认阅读`);
    fetchProgress();
  };

  const allCompleted = progress.length > 0 && progress.every((p: any) => p.is_read);
  const completedCount = progress.filter((p: any) => p.is_read).length;
  const totalCount = TRAINING_MODULES.length;

  if (!employeeId) {
    return <Text type="secondary">请先在顶部选择员工</Text>;
  }

  return (
    <div>
      {/* ---- 顶部进度总览（HR视角） ---- */}
      <Card style={{ marginBottom: 16 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={5} style={{ margin: 0 }}>
              <ReadOutlined /> 入职培训任务卡
            </Title>
            <Text type="secondary">
              入职第1天自动推送至员工 · 共{totalCount}个模块 · HR接收完成结果
            </Text>
          </Col>
          <Col>
            {allCompleted ? (
              <Tag color="success" icon={<TrophyOutlined />} style={{ fontSize: 14, padding: '4px 12px' }}>
                全部完成！已通知HR
              </Tag>
            ) : (
              <Space direction="vertical" align="end" size={4}>
                <Progress percent={Math.round((completedCount / totalCount) * 100)} size="small" style={{ width: 200 }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  已完成 {completedCount}/{totalCount} 模块
                </Text>
              </Space>
            )}
          </Col>
        </Row>

        <Steps
          current={completedCount - 1}
          size="small"
          style={{ marginTop: 16 }}
          items={TRAINING_MODULES.map((m) => {
            const isRead = progress.find((p: any) => p.module_order === m.order)?.is_read;
            return {
              title: m.name,
              status: isRead ? 'finish' : 'wait',
            };
          })}
        />
      </Card>

      {/* ---- 员工信息提示 ---- */}
      <Alert
        type="info"
        showIcon
        icon={<EyeOutlined />}
        style={{ marginBottom: 16 }}
        message={
          <span>
            以下为 <Text strong>{selectedEmployee?.chinese_name || '员工'}</Text> 的培训内容。
            培训任务卡将<Text strong>自动通知到员工本人</Text>，
            员工逐项阅读并确认后，HR 在此接收<Text strong>最终完成结果</Text>。
          </span>
        }
      />

      {/* ---- 培训模块内容（可展开阅读） ---- */}
      {TRAINING_MODULES.map((mod) => {
        const prog = progress.find((p: any) => p.module_order === mod.order);
        const isRead = prog?.is_read;
        const isUnlocked = mod.order === 1 || progress.find((p: any) => p.module_order === mod.order - 1)?.is_read;

        return (
          <Card
            key={mod.key}
            style={{
              marginBottom: 12,
              opacity: isUnlocked ? 1 : 0.55,
              borderLeft: isRead
                ? '4px solid #52c41a'
                : isUnlocked
                  ? '4px solid #1890ff'
                  : '4px solid #d9d9d9',
            }}
            title={
              <Space>
                {mod.icon}
                <Text strong style={{ fontSize: 15 }}>{mod.order}. {mod.name}</Text>
                {isRead && <Tag color="success">已阅读</Tag>}
                {!isUnlocked && <Tag color="default">请先完成前置模块</Tag>}
              </Space>
            }
            extra={
              isUnlocked && !isRead ? (
                <Button type="primary" size="small" icon={<CheckCircleOutlined />}
                  onClick={() => markAsRead(mod.order)}>
                  确认已阅读
                </Button>
              ) : isRead ? (
                <Tag color="success" icon={<CheckCircleOutlined />} style={{ padding: '2px 10px' }}>
                  已确认
                </Tag>
              ) : (
                <Tag color="default" icon={<ClockCircleOutlined />} style={{ padding: '2px 10px' }}>
                  未解锁
                </Tag>
              )
            }
          >
            {isUnlocked ? (
              <div style={{ padding: '8px 0' }}>
                {mod.renderContent()}
              </div>
            ) : (
              <Text type="secondary">
                请先完成第 {mod.order - 1} 模块「{TRAINING_MODULES[mod.order - 2]?.name}」
              </Text>
            )}
          </Card>
        );
      })}

      {/* ---- 全部完成提示 ---- */}
      {allCompleted && (
        <Alert
          type="success"
          showIcon
          icon={<TrophyOutlined />}
          message="全部培训模块已完成"
          description={
            <span>
              {selectedEmployee?.chinese_name || '该员工'} 已完成全部 {totalCount} 个入职培训模块，
              系统已自动通知 HR 部门。培训记录已归档。
            </span>
          }
          style={{ marginTop: 16 }}
        />
      )}

      {/* ---- 培训资料来源 ---- */}
      <Card style={{ marginTop: 16, background: '#fafafa' }}>
        <Space>
          <FileTextOutlined />
          <Text type="secondary">培训内容依据：</Text>
          <Text strong>《HRS-002-新员工入职培训-v20250324》</Text>
          <Tag color="blue">2025年3月24日版</Tag>
        </Space>
      </Card>

      {/* ---- 迎新公告 ---- */}
      <Card style={{ marginTop: 16 }}>
        <div className="page-header" style={{ paddingTop: 0 }}>
          <Title level={4}>迎新公告</Title>
          <Text type="secondary">为新员工生成欢迎卡片，可发布到公司群或邮件</Text>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {/* 左侧：编辑表单 */}
          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>姓名</Text>
                <Input
                  value={localAnnouncement.display_name}
                  onChange={(e) => handleAnnouncementChange('display_name', e.target.value)}
                  placeholder="新员工姓名"
                  style={{ marginTop: 4 }}
                />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>部门</Text>
                <Input
                  value={localAnnouncement.department_name}
                  onChange={(e) => handleAnnouncementChange('department_name', e.target.value)}
                  placeholder="如：技术部"
                  style={{ marginTop: 4 }}
                />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>岗位</Text>
                <Input
                  value={localAnnouncement.position_title}
                  onChange={(e) => handleAnnouncementChange('position_title', e.target.value)}
                  placeholder="如：Java开发工程师"
                  style={{ marginTop: 4 }}
                />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>入职日期</Text>
                <Input
                  value={localAnnouncement.onboard_date}
                  onChange={(e) => handleAnnouncementChange('onboard_date', e.target.value)}
                  placeholder="如：2026-06-15"
                  style={{ marginTop: 4 }}
                />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>学历背景</Text>
                <Input
                  value={localAnnouncement.education_bg}
                  onChange={(e) => handleAnnouncementChange('education_bg', e.target.value)}
                  placeholder="如：复旦大学 计算机 本科"
                  style={{ marginTop: 4 }}
                />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>头像URL</Text>
                <Input
                  value={localAnnouncement.avatar_url}
                  onChange={(e) => handleAnnouncementChange('avatar_url', e.target.value)}
                  placeholder="头像图片URL（可选）"
                  style={{ marginTop: 4 }}
                />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>个人简介/一句话介绍</Text>
              <Input.TextArea
                value={localAnnouncement.self_intro}
                onChange={(e) => handleAnnouncementChange('self_intro', e.target.value)}
                placeholder="如：热爱技术，喜欢骑行和摄影"
                rows={2}
                style={{ marginTop: 4 }}
              />
            </div>
            <Space style={{ marginTop: 12 }}>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveAnnouncement}>
                保存草稿
              </Button>
              <Button icon={<SendOutlined />} onClick={handlePublishAnnouncement}>
                发布公告
              </Button>
            </Space>
          </div>

          {/* 右侧：预览卡片 */}
          <div style={{ flex: '0 0 auto', paddingTop: 8 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>预览效果：</Text>
            <WelcomeCard data={localAnnouncement} />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StaffTraining;
