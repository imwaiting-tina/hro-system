import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Typography, Card, message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAuthStore, canEdit, canApprove } from '../../stores/authStore';
import supabase from '../../utils/supabase';
import type { RenewalStatus } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const RenewalPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: result } = await supabase
      .from('contract_renewals')
      .select('*')
      .order('created_at', { ascending: false });
    if (result) setData(result);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (id: string, level: string) => {
    const updates: any = {};
    if (level === 'bu') { updates.bu_head_signed = true; updates.bu_head_signed_at = new Date().toISOString(); updates.status = 'pending_hr'; }
    else if (level === 'hr') { updates.hr_signed = true; updates.hr_signed_at = new Date().toISOString(); updates.status = 'pending_final'; }
    else if (level === 'final') { updates.final_signed = true; updates.final_signed_at = new Date().toISOString(); updates.status = 'approved'; }

    await supabase.from('contract_renewals').update(updates).eq('id', id);
    message.success('审批完成');
    fetchData();
  };

  const columns = [
    { title: '员工', dataIndex: 'employee_id', width: 120, ellipsis: true },
    { title: '续签类型', dataIndex: 'renewal_type', width: 120,
      render: (v: string) => v === 'labor_contract' ? '劳动合同续签' : '劳务协议续签' },
    { title: '原合同到期', dataIndex: 'original_contract_end', width: 110 },
    { title: '新合同开始', dataIndex: 'new_contract_start', width: 110 },
    { title: '新合同结束', dataIndex: 'new_contract_end', width: 110 },
    { title: '新薪资', dataIndex: 'new_salary', width: 100,
      render: (v: number) => v ? `¥${v.toLocaleString()}` : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: RenewalStatus) => {
        const map: Record<string, { label: string; color: string }> = {
          pending_employee: { label: '待员工确认', color: 'default' },
          pending_bu: { label: '待BU审批', color: 'warning' },
          pending_hr: { label: '待HR审批', color: 'warning' },
          pending_final: { label: '待终审', color: 'warning' },
          approved: { label: '已批准', color: 'success' },
          completed: { label: '已完成', color: 'success' },
        };
        return <Tag color={map[status]?.color}>{map[status]?.label}</Tag>;
      },
    },
    {
      title: '操作',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'pending_bu' && user && canApprove(user.role) && (
            <Button size="small" type="primary" onClick={() => handleApprove(record.id, 'bu')}>BU审批</Button>
          )}
          {record.status === 'pending_hr' && user && canApprove(user.role) && (
            <Button size="small" type="primary" onClick={() => handleApprove(record.id, 'hr')}>HR审批</Button>
          )}
          {record.status === 'pending_final' && user && user.role === 'super_admin' && (
            <Button size="small" type="primary" onClick={() => handleApprove(record.id, 'final')}>终审通过</Button>
          )}
          {record.status === 'approved' && user && canEdit(user.role) && (
            <Button size="small" onClick={() => { handleApprove(record.id, 'completed'); }}>完成</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={2}>续签管理</Title>
        <Text type="secondary">管理员工合同续签和劳务协议续签</Text>
      </div>
      <Card>
        <div className="table-toolbar">
          <Text strong>共 {data.length} 条续签记录</Text>
          {user && canEdit(user.role) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={async () => {
              await supabase.from('contract_renewals').insert({
                employee_id: 'new',
                renewal_type: 'labor_contract',
                status: 'pending_employee',
              });
              message.success('创建成功');
              fetchData();
            }}>
              新建续签
            </Button>
          )}
        </div>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
};

export default RenewalPage;
