import React from 'react';
import { Layout, Menu, Dropdown, Avatar, Space, Button, Typography } from 'antd';
import {
  HomeOutlined,
  TeamOutlined,
  UserAddOutlined,
  IdcardOutlined,
  ScheduleOutlined,
  LogoutOutlined,
  AuditOutlined,
  SettingOutlined,
  FileSearchOutlined,
  CalendarOutlined,
  SendOutlined,
  FileTextOutlined,
  SafetyOutlined,
  DownOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '../types';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// 菜单配置 - 基于角色的可见性
const menuConfig = [
  {
    key: '/workplace',
    icon: <HomeOutlined />,
    label: '工作台',
    roles: ['super_admin', 'main_admin', 'sub_admin', 'bu_head', 'employee'] as UserRole[],
  },
  {
    key: 'recruitment',
    icon: <TeamOutlined />,
    label: '招聘管理',
    roles: ['super_admin', 'main_admin', 'sub_admin', 'bu_head'] as UserRole[],
    children: [
      { key: '/recruitment/resume', icon: <FileSearchOutlined />, label: '简历库' },
      { key: '/recruitment/demand', icon: <FileTextOutlined />, label: '招聘需求' },
      { key: '/recruitment/interview', icon: <CalendarOutlined />, label: '面试安排' },
      { key: '/recruitment/offer', icon: <SendOutlined />, label: 'Offer管理' },
    ],
  },
  {
    key: '/onboarding',
    icon: <UserAddOutlined />,
    label: '入职管理',
    roles: ['super_admin', 'main_admin', 'sub_admin', 'bu_head'] as UserRole[],
  },
  {
    key: '/employment',
    icon: <IdcardOutlined />,
    label: '在职管理',
    roles: ['super_admin', 'main_admin', 'sub_admin', 'bu_head'] as UserRole[],
  },
  {
    key: '/daily',
    icon: <ScheduleOutlined />,
    label: '日常管理',
    roles: ['super_admin', 'main_admin', 'sub_admin', 'bu_head', 'employee'] as UserRole[],
  },
  {
    key: '/resignation',
    icon: <LogoutOutlined />,
    label: '离职板块',
    roles: ['super_admin', 'main_admin', 'sub_admin', 'bu_head'] as UserRole[],
  },
  {
    key: '/approval',
    icon: <AuditOutlined />,
    label: '审批管理',
    roles: ['super_admin', 'main_admin', 'sub_admin', 'bu_head'] as UserRole[],
  },
];

// 根据角色过滤菜单
function filterMenuByRole(items: any[], role: UserRole): any[] {
  return items
    .filter((item) => item.roles?.includes(role))
    .map((item) => {
      const { roles, ...rest } = item;
      if (rest.children) {
        rest.children = rest.children.filter((child: any) =>
          child.roles ? child.roles.includes(role) : true
        );
      }
      return rest;
    });
}

const roleLabels: Record<UserRole, string> = {
  super_admin: '超级管理员',
  main_admin: '系统主管理员',
  sub_admin: '系统子管理员',
  bu_head: 'BU负责人',
  employee: '普通员工',
};

const roleColors: Record<UserRole, string> = {
  super_admin: '#f50',
  main_admin: '#2db7f5',
  sub_admin: '#87d068',
  bu_head: '#108ee9',
  employee: '#8c8c8c',
};

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const filteredMenu = filterMenuByRole(menuConfig, user.role);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: `${user.display_name} (${roleLabels[user.role]})`,
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  return (
    <Layout className="layout-container">
      <Header className="layout-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <SafetyOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <span className="logo">HRO人事管理系统</span>
        </div>

        <div className="user-info">
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: ({ key }) => {
                if (key === 'logout') handleLogout();
              },
            }}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: roleColors[user.role] }}>
                {user.display_name[0]}
              </Avatar>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, lineHeight: '20px' }}>
                  {user.display_name}
                </div>
                <div style={{ fontSize: 12, color: roleColors[user.role], lineHeight: '16px' }}>
                  {roleLabels[user.role]}
                </div>
              </div>
              <DownOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
            </Space>
          </Dropdown>
        </div>
      </Header>

      <Layout className="layout-content">
        <Sider className="layout-sider" width={220}>
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[location.pathname]}
            defaultOpenKeys={['recruitment']}
            items={filteredMenu}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0, paddingTop: 8 }}
          />
        </Sider>

        <Content className="layout-main">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
