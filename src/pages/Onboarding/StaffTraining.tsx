import React, { useEffect, useState } from 'react';
import { Card, Button, Tag, Typography, Steps, Space, message, Modal, Input, Row, Col } from 'antd';
import {
  CheckCircleOutlined, ReadOutlined, TrophyOutlined,
  BankOutlined, HistoryOutlined, SafetyCertificateOutlined,
  FileProtectOutlined, TeamOutlined, DollarOutlined,
  AuditOutlined, FileTextOutlined,
} from '@ant-design/icons';
import supabase from '../../utils/supabase';
import WelcomeCard from './WelcomeCard';

const { Title, Text } = Typography;

const TRAINING_MODULES = [
  { key: 'company_intro', name: '公司简介', icon: <BankOutlined />, order: 1,
    content: '成立年份、业务板块、服务理念、城市分布（100+城市）' },
  { key: 'history', name: '发展史', icon: <HistoryOutlined />, order: 2,
    content: '年份 + 关键事件时间轴' },
  { key: 'honors', name: '荣誉资质', icon: <SafetyCertificateOutlined />, order: 3,
    content: '年份 + 荣誉名称列表' },
  { key: 'admin_rules', name: '行政制度', icon: <FileProtectOutlined />, order: 4,
    content: '用品申购、卫生、安全4条规范' },
  { key: 'hr_rules', name: '人事制度-入离职', icon: <TeamOutlined />, order: 5,
    content: '续签时间节点、离职提前期（提前30天）、交接要求' },
  { key: 'salary', name: '人事制度-薪酬福利', icon: <DollarOutlined />, order: 6,
    content: '薪酬构成、发薪日、8项福利清单' },
  { key: 'finance', name: '财务报销', icon: <AuditOutlined />, order: 7,
    content: '交通/招待/出差/加班4类规则，限额数字加粗' },
  { key: 'seal', name: '印章制度', icon: <FileTextOutlined />, order: 8,
    content: '违规后果（1条核心）- 警示色卡片' },
  { key: 'obligations', name: '员工义务', icon: <CheckCircleOutlined />, order: 9,
    content: '8项责任 - 可勾选清单' },
];

interface Props {
  employeeId?: string;
  announcementData: any;
  onAnnouncementChange: (data: any) => void;
  onAnnouncementSave: () => void;
}

const StaffTraining: React.FC<Props> = ({
  employeeId, announcementData, onAnnouncementChange, onAnnouncementSave,
}) => {
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentModule, setCurrentModule] = useState<number>(1);
  const [showAnnouncementEdit, setShowAnnouncementEdit] = useState(false);

  const fetchProgress = async () => {
    if (!employeeId) return;
    setLoading(true);
    let { data } = await supabase.from('employee_training_progress')
      .select('*').eq('employee_id', employeeId).order('module_order');

    if (!data || data.length === 0) {
      // 初始化
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

    // 找到第一个未读的模块
    const nextUnread = data.find((m: any) => !m.is_read);
    setCurrentModule(nextUnread ? nextUnread.module_order : 10); // 10 = 全部完成
    setLoading(false);
  };

  useEffect(() => { fetchProgress(); }, [employeeId]);

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

  if (!employeeId) {
    return <Text type="secondary">请先在顶部选择员工</Text>;
  }

  return (
    <div>
      {/* 进度总览 */}
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Title level={5} style={{ margin: 0 }}>
              <ReadOutlined /> 入职培训任务卡
            </Title>
            <Text type="secondary">
              入职第1天自动推送 · 共9个模块 · 已完成 {completedCount}/9
            </Text>
          </div>
          {allCompleted && (
            <Tag color="success" icon={<TrophyOutlined />} style={{ fontSize: 14, padding: '4px 12px' }}>
              全部完成！
            </Tag>
          )}
        </Space>

        <Steps
          current={currentModule - 1}
          size="small"
          style={{ marginTop: 16 }}
          items={TRAINING_MODULES.map((m) => {
            const isRead = progress.find((p: any) => p.module_order === m.order)?.is_read;
            return {
              title: m.name,
              status: isRead ? 'finish' : (m.order === currentModule ? 'process' : 'wait'),
            };
          })}
        />
      </Card>

      {/* 模块内容卡片 */}
      <Row gutter={[16, 16]}>
        {TRAINING_MODULES.map((mod) => {
          const prog = progress.find((p: any) => p.module_order === mod.order);
          const isRead = prog?.is_read;
          const isUnlocked = mod.order === 1 || progress.find((p: any) => p.module_order === mod.order - 1)?.is_read;

          return (
            <Col span={8} key={mod.key}>
              <Card
                size="small"
                hoverable={isUnlocked && !isRead}
                style={{
                  opacity: isUnlocked ? 1 : 0.5,
                  borderLeft: isRead ? '3px solid #52c41a' : isUnlocked ? '3px solid #1890ff' : '3px solid #d9d9d9',
                }}
                title={
                  <Space>
                    {mod.icon}
                    <span>{mod.name}</span>
                    {isRead && <Tag color="success">已阅读</Tag>}
                    {!isUnlocked && <Tag>需先完成前置模块</Tag>}
                  </Space>
                }
              >
                <Text type="secondary">{mod.content}</Text>
                <div style={{ marginTop: 12 }}>
                  {isUnlocked && !isRead && (
                    <Button type="primary" size="small" block onClick={() => markAsRead(mod.order)}>
                      确认已阅读
                    </Button>
                  )}
                  {isRead && (
                    <Tag color="success" icon={<CheckCircleOutlined />} style={{ width: '100%', textAlign: 'center', padding: '4px 0' }}>
                      已确认阅读
                    </Tag>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* PPT下载 */}
      <Card style={{ marginTop: 16 }}>
        <Space>
          <FileTextOutlined />
          <Text>原培训PPT附件：</Text>
          <Button type="link" size="small">新员工入职培训PPT-20250324版.pdf</Button>
        </Space>
      </Card>

      {/* 迎新公告卡片 */}
      <Card
        title={<Space><Text>📢</Text><span>迎新公告</span></Space>}
        extra={
          <Space>
            <Button size="small" onClick={() => setShowAnnouncementEdit(true)}>
              编辑公告
            </Button>
            <Button size="small" type="primary" onClick={onAnnouncementSave}>
              保存发布
            </Button>
          </Space>
        }
        style={{ marginTop: 16 }}
      >
        <Row gutter={24}>
          <Col span={12}>
            <WelcomeCard data={announcementData} />
          </Col>
          <Col span={12}>
            <Text type="secondary">
              公告将自动提取员工信息生成卡片，HR 审核后可发布到微信工作群。
            </Text>
          </Col>
        </Row>
      </Card>

      {/* 公告编辑弹窗 */}
      <Modal
        title="编辑迎新公告"
        open={showAnnouncementEdit}
        onCancel={() => setShowAnnouncementEdit(false)}
        onOk={() => { onAnnouncementSave(); setShowAnnouncementEdit(false); }}
        width={600}
      >
        <Row gutter={[16, 12]}>
          <Col span={12}>
            <Text strong>姓名</Text>
            <Input value={announcementData.display_name}
              onChange={(e) => onAnnouncementChange({ ...announcementData, display_name: e.target.value })} />
          </Col>
          <Col span={12}>
            <Text strong>部门</Text>
            <Input value={announcementData.department_name}
              onChange={(e) => onAnnouncementChange({ ...announcementData, department_name: e.target.value })} />
          </Col>
          <Col span={12}>
            <Text strong>岗位</Text>
            <Input value={announcementData.position_title}
              onChange={(e) => onAnnouncementChange({ ...announcementData, position_title: e.target.value })} />
          </Col>
          <Col span={12}>
            <Text strong>入职日期</Text>
            <Input value={announcementData.onboard_date}
              onChange={(e) => onAnnouncementChange({ ...announcementData, onboard_date: e.target.value })} />
          </Col>
          <Col span={24}>
            <Text strong>学历/毕业</Text>
            <Input value={announcementData.education_bg}
              onChange={(e) => onAnnouncementChange({ ...announcementData, education_bg: e.target.value })} />
          </Col>
          <Col span={24}>
            <Text strong>自我介绍</Text>
            <Input.TextArea rows={3} value={announcementData.self_intro}
              onChange={(e) => onAnnouncementChange({ ...announcementData, self_intro: e.target.value })} />
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default StaffTraining;
