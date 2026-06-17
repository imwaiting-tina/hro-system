import React from 'react';
import { Space, Card, Typography } from 'antd';
import {
  FileTextOutlined,
  IdcardOutlined,
  ScheduleOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Text } = Typography;

const navItems = [
  { key: '/onboarding/docs', label: '入职文件', icon: <FileTextOutlined /> },
  { key: '/onboarding/info', label: '信息登记', icon: <IdcardOutlined /> },
  { key: '/onboarding/guide', label: '入职引导', icon: <ScheduleOutlined /> },
  { key: '/onboarding/admin', label: '行政准备', icon: <SettingOutlined /> },
  { key: '/onboarding/training', label: '员工培训', icon: <TeamOutlined /> },
];

const OnboardingNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ marginBottom: 16 }}>
      <Space size={12} wrap>
        {navItems.map((item) => {
          const isActive = location.pathname === item.key;
          return (
            <Card
              key={item.key}
              size="small"
              hoverable
              onClick={() => navigate(item.key)}
              style={{
                cursor: 'pointer',
                borderColor: isActive ? '#1890ff' : '#d9d9d9',
                backgroundColor: isActive ? '#e6f7ff' : '#fff',
                boxShadow: isActive ? '0 2px 8px rgba(24,144,255,0.15)' : 'none',
                transition: 'all 0.2s',
              }}
              bodyStyle={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span style={{ fontSize: 16, color: isActive ? '#1890ff' : '#8c8c8c' }}>{item.icon}</span>
              <Text strong={isActive} style={{ color: isActive ? '#1890ff' : '#595959', fontSize: 13 }}>
                {item.label}
              </Text>
            </Card>
          );
        })}
      </Space>
    </div>
  );
};

export default OnboardingNav;