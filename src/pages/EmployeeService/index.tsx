import React from 'react';
import { Result, Button, Tag, Space } from 'antd';
import {
  CustomerServiceOutlined,
  SolutionOutlined,
  UserOutlined,
  GiftOutlined,
  TeamOutlined,
  HomeOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';

const subPages = [
  { icon: <SolutionOutlined />, label: '座位/工牌/电脑', desc: '行政资产分配：工位、工牌制作、电脑设备领用与归还管理', color: '#1890ff' },
  { icon: <UserOutlined />, label: '系统账户', desc: '各系统账号开通、权限配置、账号注销管理（钉钉、邮箱、内部系统等）', color: '#52c41a' },
  { icon: <GiftOutlined />, label: '福利政策', desc: '公司福利制度文档查阅，各类福利规则说明', color: '#13c2c2' },
  { icon: <GiftOutlined />, label: '福利发放', desc: '节日福利、生日福利等一次性发放记录', color: '#faad14' },
  { icon: <GiftOutlined />, label: '福利执行', desc: '各类福利执行情况跟踪与确认', color: '#722ed1' },
  { icon: <GiftOutlined />, label: '福利管理', desc: '福利项目配置与管理，支持按部门/人员设置差异化方案', color: '#f5222d' },
  { icon: <TeamOutlined />, label: 'HRO运动卡', desc: '员工健康运动卡申请、开通与续费管理', color: '#eb2f96' },
  { icon: <HomeOutlined />, label: '人才公寓', desc: '人才公寓申请、分配、到期提醒管理', color: '#fa8c16' },
  { icon: <FileSearchOutlined />, label: '员工查询', desc: '员工自助查询：合同信息、薪酬记录、假期余额、福利状态等', color: '#1890ff' },
  { icon: <TeamOutlined />, label: '员工档案', desc: '已在"员工服务 > 员工档案"可用（原在职管理模块）', color: '#8c8c8c', path: '/employment/employees' },
];

const EmployeeServicePage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <CustomerServiceOutlined style={{ fontSize: 28, color: '#722ed1' }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#262626' }}>员工服务</div>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 2 }}>大后台行政服务 · 福利管理 · 员工查询 · 员工档案</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {subPages.map((item) => (
          <div
            key={item.label}
            style={{
              background: '#fff',
              borderRadius: 10,
              padding: '20px 20px 16px',
              border: '1px solid #f0f0f0',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22, color: item.color }}>{item.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: '#262626' }}>{item.label}</span>
              {item.path
                ? <Tag color="green" style={{ marginLeft: 'auto', fontSize: 11 }}>已可用</Tag>
                : <Tag color="orange" style={{ marginLeft: 'auto', fontSize: 11 }}>开发中</Tag>
              }
            </div>
            <div style={{ fontSize: 13, color: '#595959', lineHeight: '1.6' }}>{item.desc}</div>
          </div>
        ))}
      </div>

      <Result
        icon={<CustomerServiceOutlined style={{ color: '#722ed1' }} />}
        title="员工服务模块开发中"
        subTitle="座位/工牌/电脑、系统账户、福利系列、HRO运动卡、人才公寓、员工查询等功能正在开发。员工档案请通过左侧菜单访问。"
        extra={
          <Space>
            <Button type="primary" onClick={() => window.history.back()}>返回</Button>
          </Space>
        }
      />
    </div>
  );
};

export default EmployeeServicePage;
