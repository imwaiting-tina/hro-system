import React from 'react';
import { Result, Button, Tag, Space } from 'antd';
import { ContainerOutlined, FileTextOutlined, AuditOutlined, FileDoneOutlined } from '@ant-design/icons';

const subPages = [
  { icon: <FileTextOutlined />, label: '合同台账', desc: '管理全员劳动合同、实习协议、劳务协议台账，按合同期限、用工类型筛选查询', color: '#1890ff' },
  { icon: <AuditOutlined />, label: '试用期/实习评估', desc: '已在"HR核心流程"中可用，此处为合同管理视角的快捷入口', color: '#52c41a', path: '/employment/evaluation' },
  { icon: <FileDoneOutlined />, label: '续签管理', desc: '已在"HR核心流程"中可用，此处为合同管理视角的快捷入口', color: '#faad14', path: '/employment/renewal' },
];

const ContractPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <ContainerOutlined style={{ fontSize: 28, color: '#1890ff' }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#262626' }}>员工合同管理</div>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 2 }}>合同台账 · 试用期评估 · 续签管理</div>
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
              cursor: 'default',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22, color: item.color }}>{item.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: '#262626' }}>{item.label}</span>
              {!item.path && <Tag color="orange" style={{ marginLeft: 'auto', fontSize: 11 }}>开发中</Tag>}
              {item.path && <Tag color="green" style={{ marginLeft: 'auto', fontSize: 11 }}>已可用</Tag>}
            </div>
            <div style={{ fontSize: 13, color: '#595959', lineHeight: '1.6' }}>{item.desc}</div>
          </div>
        ))}
      </div>

      <Result
        icon={<ContainerOutlined style={{ color: '#1890ff' }} />}
        title="合同台账开发中"
        subTitle="合同台账（含合同期限、必要字段、用工类型管理）功能正在开发，即将上线。试用期/实习评估与续签管理请通过左侧菜单的 HR核心流程 访问。"
        extra={
          <Space>
            <Button type="primary" onClick={() => window.history.back()}>返回</Button>
          </Space>
        }
      />
    </div>
  );
};

export default ContractPage;
