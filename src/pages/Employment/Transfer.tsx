import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Typography, Card, message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAuthStore, canEdit, canApprove } from '../../stores/authStore';
import supabase from '../../utils/supabase';

const { Title, Text } = Typography;

const TransferPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: result } = await supabase
      .from('employee_transfers')
      .select('*')
      .order('created_at', { ascending: false });
    if (result) setData(result);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const columns = [
    { title: '员工', dataIndex: 'employee_id', width: 120, ellipsis: true },
    { title: '变动类型', dataIndex: 'transfer_type', width: 100,
      render: (v: string) => {
        const map: Record<string, string> = { transfer: '调岗', promotion: '晋升', salary_adjust: '调薪', re_grade: '重新定级' };
        return map[v] || v;
      }},
    { title: '原职位→新职位', width: 160, render: (_: any, r: any) => `${r.from_position || '-'} → ${r.to_position || '-'}` },
    { title: '原薪资→新薪资', width: 160, render: (_: any, r: any) =>
      `${r.from_salary ? '¥' + r.from_salary : '-'} → ${r.to_salary ? '¥' + r.to_salary : '-'}` },
    { title: '生效日期', dataIndex: 'effective_date', width: 110 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: string) => v === 'completed' ? <Tag color="success">已完成</Tag> : <Tag color="warning">审批中</Tag>,
    },
    {
      title: '操作',
      width: 150,
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'pending' && user && canApprove(user.role) && (
            <Button size="small" type="primary" onClick={async () => {
              await supabase.from('employee_transfers').update({ status: 'completed' }).eq('id', record.id);
              message.success('已确认');
              fetchData();
            }}>确认</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={2}>员工流动</Title>
        <Text type="secondary">管理员工调岗、晋升、调薪、重新定级</Text>
      </div>
      <Card>
        <div className="table-toolbar">
          <Text strong>共 {data.length} 条流动记录</Text>
          {user && canEdit(user.role) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={async () => {
              await supabase.from('employee_transfers').insert({
                employee_id: 'new',
                transfer_type: 'transfer',
                status: 'pending',
              });
              message.success('创建成功');
              fetchData();
            }}>
              新建流动申请
            </Button>
          )}
        </div>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
};

export default TransferPage;
