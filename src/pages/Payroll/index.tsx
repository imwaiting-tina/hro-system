import React from 'react';
import { Result, Button, Tag, Space, Row, Col, Statistic } from 'antd';
import {
  DollarOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  FileTextOutlined,
  BankOutlined,
  SafetyOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';

const subPages = [
  { icon: <CalendarOutlined />, label: '月度Payroll', desc: '每月薪酬核算、发放管理，支持批量导入导出', color: '#1890ff' },
  { icon: <ScheduleOutlined />, label: '考勤记录', desc: '每工作日出勤/缺勤记录，支持钉钉数据导入', color: '#52c41a' },
  { icon: <FileTextOutlined />, label: '请假管理', desc: '年假、事假、病假、调休等各类假期管理', color: '#13c2c2' },
  { icon: <BankOutlined />, label: '社保/公积金', desc: '社保基数、公积金（含补充公积金）计算与台账', color: '#faad14' },
  { icon: <SafetyOutlined />, label: '商业保险', desc: '团体商业保险在保管理（已在保险模块可用）', color: '#722ed1', path: '/daily/insurance' },
  { icon: <FileDoneOutlined />, label: '工资单', desc: '电子工资单生成与分发，员工可查询个人工资明细', color: '#f5222d' },
];

const PayrollPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <DollarOutlined style={{ fontSize: 28, color: '#52c41a' }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#262626' }}>Payroll 薪酬管理</div>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 2 }}>月度薪酬 · 考勤 · 请假 · 社保公积金 · 商业保险 · 工资单</div>
        </div>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '16px 20px', border: '1px solid #f0f0f0' }}>
            <Statistic title="本月在职人员" value="--" suffix="人" valueStyle={{ color: '#1890ff' }} />
          </div>
        </Col>
        <Col span={6}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '16px 20px', border: '1px solid #f0f0f0' }}>
            <Statistic title="本月应发总额" value="--" prefix="¥" valueStyle={{ color: '#52c41a' }} />
          </div>
        </Col>
        <Col span={6}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '16px 20px', border: '1px solid #f0f0f0' }}>
            <Statistic title="待处理考勤异常" value="--" suffix="条" valueStyle={{ color: '#faad14' }} />
          </div>
        </Col>
        <Col span={6}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '16px 20px', border: '1px solid #f0f0f0' }}>
            <Statistic title="待审批请假" value="--" suffix="条" valueStyle={{ color: '#f5222d' }} />
          </div>
        </Col>
      </Row>

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
        icon={<DollarOutlined style={{ color: '#52c41a' }} />}
        title="Payroll 模块开发中"
        subTitle="月度薪酬、考勤记录、请假管理、社保/公积金、工资单功能正在开发，即将上线。商业保险管理请通过左侧菜单的 Payroll > 商业保险 访问。"
        extra={
          <Space>
            <Button type="primary" onClick={() => window.history.back()}>返回</Button>
          </Space>
        }
      />
    </div>
  );
};

export default PayrollPage;
