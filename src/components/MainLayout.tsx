import React from 'react';
import { Layout, Menu, Dropdown, Avatar, Space, Badge, Button, Typography } from 'antd';
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
  SwapOutlined,
  LeftOutlined,
  RightOutlined,
  BellOutlined,
  DollarOutlined,
  ContainerOutlined,
  CustomerServiceOutlined,
  FileDoneOutlined,
  SolutionOutlined,
  CrownOutlined,
  GiftOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '../types';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// ============================================================
// 菜单配置 - 六大模块 + 审批管理
// ============================================================
const menuConfig = [
  // 一、工作台
  {
    key: '/workplace',
    icon: <HomeOutlined />,
    label: '工作台',
    roles: ['super_admin', 'main_admin', 'sub_admin', 'bu_head', 'employee'] as UserRole[],
  },

  // 二、员工流程
  {
    key: 'hr-core',
    icon: <TeamOutlined />,
    label: '员工流程',
    roles: ['super_admin', 'main_admin', 'sub_admin', 'bu_head'] as UserRole[],
    children: [
      { key: '/recruitment/resume', icon: <FileSearchOutlined />, label: '招聘管理' },
      { key: '/onboarding/docs', icon: <UserAddOutlined />, label: '入职管理' },
      { key: '/employment/transfer', icon: <SwapOutlined />, label: '员工流动' },
      { key: '/daily', icon: <ScheduleOutlined />, label: '日常管理' },
      { key: '/offboarding/list', icon: <LogoutOutlined />, label: '离职管理' },
    ],
  },

  // 三、员工合同管理
  {
    key: 'contract',
    icon: <ContainerOutlined />,
    label: '员工合同管理',
    roles: ['super_admin', 'main_admin', 'sub_admin', 'bu_head'] as UserRole[],
    children: [
      { key: '/employment/employees', icon: <TeamOutlined />, label: '员工档案' },
      { key: '/employment/evaluation', icon: <AuditOutlined />, label: '试用期/实习评估' },
      { key: '/employment/renewal', icon: <FileDoneOutlined />, label: '续签管理' },
    ],
  },

  // 四、Payroll（薪酬管理）
  {
    key: 'payroll',
    icon: <DollarOutlined />,
    label: 'Payroll',
    roles: ['super_admin', 'main_admin', 'sub_admin'] as UserRole[],
    children: [
      { key: '/payroll/monthly', icon: <CalendarOutlined />, label: '月度Payroll' },
      { key: '/payroll/attendance', icon: <ScheduleOutlined />, label: '考勤记录' },
      { key: '/payroll/leave', icon: <FileTextOutlined />, label: '请假管理' },
      { key: '/payroll/social-insurance', icon: <BankOutlined />, label: '社保/公积金' },
      { key: '/daily/insurance', icon: <SafetyOutlined />, label: '商业保险' },
      { key: '/payroll/payslip', icon: <FileDoneOutlined />, label: '工资单' },
    ],
  },

  // 五、员工服务（含大后台行政服务）
  {
    key: 'employee-service',
    icon: <CustomerServiceOutlined />,
    label: '员工服务',
    roles: ['super_admin', 'main_admin', 'sub_admin', 'bu_head', 'employee'] as UserRole[],
    children: [
      { key: '/employee-service/assets', icon: <SolutionOutlined />, label: '座位/工牌/电脑' },
      { key: '/employee-service/accounts', icon: <UserOutlined />, label: '系统账户' },
      { key: '/employee-service/benefits-policy', icon: <GiftOutlined />, label: '福利政策' },
      { key: '/employee-service/benefits-issue', icon: <GiftOutlined />, label: '福利发放' },
      { key: '/employee-service/benefits-exec', icon: <GiftOutlined />, label: '福利执行' },
      { key: '/employee-service/benefits-mgmt', icon: <GiftOutlined />, label: '福利管理' },
      { key: '/employee-service/sport-card', icon: <TeamOutlined />, label: 'HRO运动卡' },
      { key: '/employee-service/apartment', icon: <HomeOutlined />, label: '人才公寓' },
      { key: '/employee-service/query', icon: <FileSearchOutlined />, label: '员工查询' },
    ],
  },

  // 六、审批管理
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
    .filter((item) => {
      // group 类型没有 roles，始终保留
      if (item.type === 'group') return true;
      return item.roles?.includes(role);
    })
    .map((item) => {
      const { roles, ...rest } = item;
      if (rest.children) {
        rest.children = rest.children.filter((child: any) => {
          if (child.type === 'group') return true;
          return child.roles ? child.roles.includes(role) : true;
        });
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
  const [openKeys, setOpenKeys] = React.useState<string[]>(['hr-core', 'contract', 'payroll', 'employee-service']);
  const [collapsed, setCollapsed] = React.useState(false);

  // 根据当前路径自动展开对应的父菜单
  React.useEffect(() => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0) {
      const parentKey = segments[0];
      // 映射旧路由段到新父菜单 key
      const parentMap: Record<string, string> = {
        recruitment: 'hr-core',
        onboarding: 'hr-core',
        offboarding: 'hr-core',
        daily: 'hr-core',
        employment: 'contract',
        contract: 'contract',
        payroll: 'payroll',
        'employee-service': 'employee-service',
      };
      const mappedKey = parentMap[parentKey] || parentKey;
      setOpenKeys((prev) => {
        if (!prev.includes(mappedKey)) {
          return [...prev, mappedKey];
        }
        return prev;
      });
    }
  }, [location.pathname]);

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
            selectedKeys={[location.pathname]}
            openKeys={collapsed ? [] : openKeys}
            onOpenChange={setOpenKeys}
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
