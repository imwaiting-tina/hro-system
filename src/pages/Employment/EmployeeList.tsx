import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Typography, Card, message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAuthStore, canEdit } from '../../stores/authStore';
import supabase from '../../utils/supabase';

const { Title, Text } = Typography;

const EmployeeListPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: result } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    if (result) setData(result);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const columns = [
    { title: '工号', dataIndex: 'employee_no', width: 100 },
    { title: '姓名', dataIndex: 'chinese_name', width: 100 },
    { title: '英文名', dataIndex: 'english_name', width: 100 },
    { title: '类型', dataIndex: 'employee_type', width: 80,
      render: (v: string) => {
        const map: Record<string, string> = { full_time: '全日制', intern: '实习生', retired_rehire: '退休返聘', security: '保安' };
        return map[v] || v;
      }},
    { title: '部门', dataIndex: 'department_id', width: 80, ellipsis: true },
    { title: '职位', dataIndex: 'position_name', width: 120 },
    { title: '入职日期', dataIndex: 'onboard_date', width: 110 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: string) => {
        const map: Record<string, { label: string; color: string }> = {
          active: { label: '在职', color: 'success' },
          probation: { label: '试用期', color: 'processing' },
          internship: { label: '实习期', color: 'warning' },
          resigned: { label: '已离职', color: 'default' },
        };
        return <Tag color={map[v]?.color}>{map[v]?.label || v}</Tag>;
      },
    },
    { title: '合同到期', dataIndex: 'contract_end', width: 110 },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={2}>员工档案</Title>
        <Text type="secondary">查看和维护所有员工的档案信息</Text>
      </div>
      <Card>
        <div className="table-toolbar">
          <Text strong>共 {data.length} 名员工</Text>
          {user && canEdit(user.role) && (
            <Button type="primary" icon={<PlusOutlined />}>新增员工</Button>
          )}
        </div>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
          pagination={{ pageSize: 10 }} scroll={{ x: 1000 }} />
      </Card>
    </div>
  );
};

export default EmployeeListPage;
