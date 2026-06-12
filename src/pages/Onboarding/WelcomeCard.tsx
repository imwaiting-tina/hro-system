import React from 'react';
import { Card, Avatar, Tag, Typography, Row, Col } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Props {
  data: {
    display_name?: string;
    department_name?: string;
    position_title?: string;
    onboard_date?: string;
    avatar_url?: string;
    self_intro?: string;
    education_bg?: string;
  };
}

const WelcomeCard: React.FC<Props> = ({ data }) => {
  const name = data.display_name || '新同事';
  const initial = name.charAt(0);

  return (
    <Card
      style={{
        maxWidth: 420,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      }}
      bodyStyle={{ padding: 0 }}
    >
      {/* 头部 */}
      <div style={{
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
        padding: '24px 24px 40px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <Title level={4} style={{ color: '#fff', marginBottom: 4 }}>
          🎉 欢迎新同事
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
          加入开弈大家庭
        </Text>
      </div>

      {/* 头像 + 姓名 */}
      <div style={{ textAlign: 'center', marginTop: -36, marginBottom: 8 }}>
        {data.avatar_url ? (
          <Avatar src={data.avatar_url} size={72}
            style={{ border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
        ) : (
          <Avatar size={72} style={{
            backgroundColor: '#1890ff', border: '3px solid #fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: 28,
          }}>{initial}</Avatar>
        )}
      </div>

      <Title level={4} style={{ textAlign: 'center', marginBottom: 4 }}>{name}</Title>
      {data.self_intro && (
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '0 24px', marginBottom: 16 }}>
          "{data.self_intro}"
        </Text>
      )}

      {/* 信息标签 */}
      <div style={{ padding: '0 24px 20px' }}>
        <Row gutter={[8, 8]}>
          {data.department_name && (
            <Col span={12}>
              <div style={{ background: '#f0f5ff', borderRadius: 8, padding: '8px 12px' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>部门</Text>
                <div><Text strong style={{ fontSize: 13 }}>{data.department_name}</Text></div>
              </div>
            </Col>
          )}
          {data.position_title && (
            <Col span={12}>
              <div style={{ background: '#f0f5ff', borderRadius: 8, padding: '8px 12px' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>岗位</Text>
                <div><Text strong style={{ fontSize: 13 }}>{data.position_title}</Text></div>
              </div>
            </Col>
          )}
          {data.onboard_date && (
            <Col span={12}>
              <div style={{ background: '#fff7e6', borderRadius: 8, padding: '8px 12px' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>入职日期</Text>
                <div><Text strong style={{ fontSize: 13 }}>{data.onboard_date}</Text></div>
              </div>
            </Col>
          )}
          {data.education_bg && (
            <Col span={12}>
              <div style={{ background: '#fff7e6', borderRadius: 8, padding: '8px 12px' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>学历</Text>
                <div><Text strong style={{ fontSize: 13 }}>{data.education_bg}</Text></div>
              </div>
            </Col>
          )}
        </Row>
      </div>
    </Card>
  );
};

export default WelcomeCard;
