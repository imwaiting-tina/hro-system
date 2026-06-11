import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Timeline, Tag, List, Typography, Badge, Spin } from 'antd';
import {
  TeamOutlined,
  UserAddOutlined,
  FileTextOutlined,
  AuditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SendOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import supabase from '../../utils/supabase';

const { Title, Text, Paragraph } = Typography;

const WorkplacePage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecruitment: 0,
    activeInterviews: 0,
    pendingOffers: 0,
    pendingApprovals: 0,
    onboardingCount: 0,
    totalEmployees: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 统计数据
      const [
        { count: recruitmentCount },
        { count: interviewCount },
        { count: offerCount },
        { count: employeeCount },
      ] = await Promise.all([
        supabase.from('recruitment_requests').select('*', { count: 'exact', head: true }).in('status', ['published', 'approved']),
        supabase.from('interviews').select('*', { count: 'exact', head: true }).eq('result', 'pending'),
        supabase.from('offers').select('*', { count: 'exact', head: true }).in('status', ['sent', 'pending_send']),
        supabase.from('employees').select('*', { count: 'exact', head: true }).in('status', ['active', 'probation']),
      ]);

      setStats({
        totalRecruitment: recruitmentCount || 0,
        activeInterviews: interviewCount || 0,
        pendingOffers: offerCount || 0,
        pendingApprovals: 0,
        onboardingCount: 0,
        totalEmployees: employeeCount || 0,
      });

      // 模拟近期活动
      setRecentActivities([
        { time: '2026-06-11 14:30', content: '收到财务助理岗位简历3份', type: 'resume' },
        { time: '2026-06-11 10:00', content: 'CS/AI技术实习生岗位需求已发布', type: 'demand' },
        { time: '2026-06-10 16:00', content: '法务助理候选人张三通过二面', type: 'interview' },
        { time: '2026-06-10 09:30', content: '新员工入职引导表已归档', type: 'onboarding' },
      ]);

      setPendingTasks([
        { key: '1', title: '待审批：法务助理录用审批单', module: '审批管理', priority: 'high' },
        { key: '2', title: '待安排：财务助理候选人二面', module: '面试安排', priority: 'medium' },
        { key: '3', title: '待发送：CS/AI实习生Offer', module: 'Offer管理', priority: 'medium' },
      ]);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <Title level={2}>
          欢迎回来，{user?.display_name}
        </Title>
        <Text type="secondary">
          当前角色：{user?.role === 'super_admin' ? '超级管理员' :
            user?.role === 'main_admin' ? '系统主管理员' :
            user?.role === 'sub_admin' ? '系统子管理员' :
            user?.role === 'bu_head' ? 'BU负责人' : '普通员工'}
          &nbsp;|&nbsp;部门：{user?.department || '-'}
          &nbsp;|&nbsp;职位：{user?.position || '-'}
        </Text>
      </div>

      <Spin spinning={loading}>
        {/* 统计卡片 */}
        <div className="stats-row">
          <Card className="stat-card">
            <Statistic
              title="招聘需求"
              value={stats.totalRecruitment}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
          <Card className="stat-card">
            <Statistic
              title="待面试"
              value={stats.activeInterviews}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
          <Card className="stat-card">
            <Statistic
              title="Offer待处理"
              value={stats.pendingOffers}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
          <Card className="stat-card">
            <Statistic
              title="在职员工"
              value={stats.totalEmployees}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </div>

        <Row gutter={16}>
          {/* 待办任务 */}
          <Col xs={24} lg={14}>
            <Card title="待办任务" style={{ marginBottom: 16 }}>
              {pendingTasks.length === 0 ? (
                <Text type="secondary">暂无待办任务</Text>
              ) : (
                <List
                  dataSource={pendingTasks}
                  renderItem={(item: any) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          item.priority === 'high' ?
                            <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} /> :
                            <ClockCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />
                        }
                        title={item.title}
                        description={<Tag color="blue">{item.module}</Tag>}
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          {/* 近期动态 */}
          <Col xs={24} lg={10}>
            <Card title="近期动态" style={{ marginBottom: 16 }}>
              <Timeline
                items={recentActivities.map((activity: any, idx: number) => ({
                  key: idx,
                  color: activity.type === 'resume' ? 'blue' :
                         activity.type === 'demand' ? 'green' :
                         activity.type === 'interview' ? 'orange' : 'purple',
                  children: (
                    <div>
                      <Text style={{ fontSize: 12, color: '#8c8c8c' }}>{activity.time}</Text>
                      <br />
                      <Text>{activity.content}</Text>
                    </div>
                  ),
                }))}
              />
            </Card>

            {/* 快捷操作 */}
            <Card title="快捷操作">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Tag color="blue" style={{ cursor: 'pointer', padding: '4px 12px' }}>
                  + 发布招聘需求
                </Tag>
                <Tag color="green" style={{ cursor: 'pointer', padding: '4px 12px' }}>
                  + 录入简历
                </Tag>
                <Tag color="orange" style={{ cursor: 'pointer', padding: '4px 12px' }}>
                  + 安排面试
                </Tag>
                <Tag color="purple" style={{ cursor: 'pointer', padding: '4px 12px' }}>
                  + 发送Offer
                </Tag>
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default WorkplacePage;
