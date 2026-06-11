import React from 'react';
import { Card, Typography, Row, Col, Statistic, List, Tag } from 'antd';
import {
  ClockCircleOutlined, CheckCircleOutlined, FileTextOutlined,
  TeamOutlined, CalendarOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const DailyPage: React.FC = () => {
  return (
    <div>
      <div className="page-header">
        <Title level={2}>日常管理</Title>
        <Text type="secondary">考勤查看、请假管理、用印申请、日常事务处理</Text>
      </div>

      <div className="stats-row">
        <Card className="stat-card">
          <Statistic title="今日考勤" value={219} suffix="人" prefix={<ClockCircleOutlined />} />
          <Text type="secondary" style={{ fontSize: 12 }}>正常出勤</Text>
        </Card>
        <Card className="stat-card">
          <Statistic title="待审批请假" value={3} prefix={<CalendarOutlined />} valueStyle={{ color: '#faad14' }} />
        </Card>
        <Card className="stat-card">
          <Statistic title="用印申请" value={5} prefix={<FileTextOutlined />} valueStyle={{ color: '#1890ff' }} />
        </Card>
        <Card className="stat-card">
          <Statistic title="本月入职" value={8} prefix={<TeamOutlined />} valueStyle={{ color: '#52c41a' }} />
        </Card>
      </div>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="用印申请列表" style={{ marginBottom: 16 }}>
            <List
              dataSource={[
                { title: '劳动合同用印 - 张三', status: 'pending', time: '2026-06-11' },
                { title: '实习协议用印 - 李四', status: 'approved', time: '2026-06-10' },
                { title: '员工手册用印 - 王五', status: 'pending', time: '2026-06-09' },
              ]}
              renderItem={(item: any) => (
                <List.Item extra={
                  <Tag color={item.status === 'approved' ? 'success' : 'warning'}>
                    {item.status === 'approved' ? '已通过' : '待审批'}
                  </Tag>
                }>
                  <List.Item.Meta title={item.title} description={item.time} />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card title="请假申请列表" style={{ marginBottom: 16 }}>
            <List
              dataSource={[
                { title: '年假申请 - 赵六', type: '年假', days: 3, status: 'approved' },
                { title: '事假申请 - 钱七', type: '事假', days: 1, status: 'pending' },
                { title: '病假申请 - 孙八', type: '病假', days: 2, status: 'pending' },
              ]}
              renderItem={(item: any) => (
                <List.Item extra={
                  <Tag color={item.status === 'approved' ? 'success' : 'warning'}>
                    {item.status === 'approved' ? '已批准' : '待审批'}
                  </Tag>
                }>
                  <List.Item.Meta
                    title={item.title}
                    description={`${item.type} | ${item.days}天`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="快捷功能">
        <Row gutter={16}>
          <Col span={6}>
            <Card size="small" hoverable style={{ textAlign: 'center' }}>
              <ClockCircleOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
              <div>考勤打卡</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" hoverable style={{ textAlign: 'center' }}>
              <CalendarOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
              <div>请假申请</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" hoverable style={{ textAlign: 'center' }}>
              <FileTextOutlined style={{ fontSize: 32, color: '#faad14', marginBottom: 8 }} />
              <div>用印申请</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" hoverable style={{ textAlign: 'center' }}>
              <TeamOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 8 }} />
              <div>通讯录</div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default DailyPage;
