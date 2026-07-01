import React from 'react';
import { Layout, Menu, Dropdown, Avatar, Space, Badge, Button, Typography } from 'antd';
import {
  UserAddOutlined,
  IdcardOutlined,
  LogoutOutlined,
  AuditOutlined,
  SettingOutlined,
  FileSearchOutlined,
  SendOutlined,
  FileTextOutlined,
  SafetyOutlined,
  DownOutlined,
  UserOutlined,
  SwapOutlined,
  LeftOutlined,
  RightOutlined,
  BellOutlined,
  FileDoneOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '../types';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// ============================================================
// 菜单配置 - 四大生命周期板块平铺（招聘→入职→员工流动→离职）
// ============================================================
const menuConfig = [
  // ── 招聘管理 ──
  {
    key: 'recruitment-group',
    type: 'group' as const,
    label: '招聘管理',
    roles: ['super_admin', 'main_admin', 'sub_admin', 'bu_head'] as UserRole[],
    children: [
      { key: '/recruitment/demand', icon: <FileSearchOutlined />, label: '招聘需求' },
      { key: '/recruitment/resume', icon: <FileTextOutlined />, label: '简历库' },
      { key: '/recruitment/interview', icon: <AuditOutlined />, label: '面试安排' },
      { key: '/recruitment/offer', icon: <SendOutlined />, label: 'Offer发放' },
    ],
  },
  // ── 入职管理 ──
  {
    key: 'onboarding-group',
    type: 'group' as const,
    label: '入职管理',
    roles: ['super_admin', 'main_admin', 'sub_admin', 'bu_head'] as UserRole[],
    children: [
      { key: '/onboarding/docs', icon: <UserAddOutlined />, label: '入职文件清单' },
      { key: '/onboarding/guide', icon: <SolutionOutlined />, label: '入职指引' },
      { key: '/onboarding/admin', icon: <SettingOutlined />, label: '行政准备' },
      { key: '/onboarding/training', icon: <SafetyOutlined />, label: '新员工培训' },
      { key: '/onboarding/info', icon: <IdcardOutlined />, label: '信息登记表' },
    ],
  },
  // ── 员工流动 ──
  {
    key: 'employment-group',
    type: 'group' as const,
    label: '员工流动',
    roles: ['super_admin', 'main_admin', 'sub_admin', 'bu_head'] as UserRole[],
    children: [
      { key: '/employment/transfer', icon: <SwapOutlined />, label: '员工流动' },
    ],
  },
  // ── 离职管理 ──
  {
    key: 'offboarding-group',
    type: 'group' as const,
    label: '离职管理',
    roles: ['super_admin', 'main_admin', 'sub_admin', 'bu_head'] as UserRole[],
    children: [
      { key: '/resignation', icon: <LogoutOutlined />, label: '辞退管理' },
      { key: '/offboarding/list', icon: <LogoutOutlined />, label: '离职办理' },
      { key: '/offboarding/handover-checklist', icon: <FileDoneOutlined />, label: '离职交接' },
    ],
  },
];

// 根据角色过滤菜单（group 类型按 roles 字段过滤，子项无 roles 则始终保留）
function filterMenuByRole(items: any[], role: UserRole): any[] {
  return items
    .filter((item) => {
      if (item.roles) return item.roles.includes(role);
      return true;
    })
    .map((item) => {
      const { roles, ...rest } = item;
      if (rest.children) {
        rest.children = rest.children.filter((child: any) =>
          child.roles ? child.roles.includes(role) : true,
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
  const [collapsed, setCollapsed] = React.useState(false);

  // 计算当前选中的菜单key（支持 query 参数匹配）
  const currentPath = location.pathname;
  const currentSearch = location.search;
  const currentFullKey = currentPath + currentSearch;
  
  // 对于 contract/payroll/employee-service 页面，如果没有 search，尝试从 state 获取
  const tabFromState = (location.state as any)?.tab;
  const effectiveSelectedKey = tabFromState 
    ? `${currentPath}?tab=${tabFromState}` 
    : currentFullKey;

  if (!user) return null;

  const filteredMenu = filterMenuByRole(menuConfig, user.role);

  const handleMenuClick = ({ key }: { key: string }) => {
    // 支持 query 参数形式的路由（如 /contract?tab=profile）
    if (key.includes('?')) {
      const [path, query] = key.split('?');
      const params = new URLSearchParams(query);
      const search = {};
      params.forEach((v, k) => { (search as any)[k] = v; });
      navigate(path, { state: search });
    } else {
      navigate(key);
    }
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

        <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* 消息通知 */}
          <Badge count={0} showZero={false}>
            <Button
              type="text"
              icon={<BellOutlined style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)' }} />}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }}
              onClick={() => {}}
            />
          </Badge>

          {/* 账号管理 */}
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
        <Sider
          className="layout-sider"
          width={220}
          collapsedWidth={56}
          collapsed={collapsed}
          onCollapse={setCollapsed}
          collapsible
          trigger={collapsed ? <RightOutlined style={{ fontSize: 12 }} /> : <LeftOutlined style={{ fontSize: 12 }} />}
          style={{ position: 'relative' }}
        >
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[effectiveSelectedKey]}
            items={filteredMenu}
            onClick={handleMenuClick}
            inlineCollapsed={collapsed}
            style={{ height: 'calc(100% - 40px)', borderRight: 0, paddingTop: 8, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            className="layout-sider-menu"
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
