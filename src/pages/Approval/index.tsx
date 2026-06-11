import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Modal, Input, message, Typography, Card, Tabs, Descriptions
} from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useAuthStore, canApprove } from '../../stores/authStore';
import supabase from '../../utils/supabase';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ApprovalPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div>
      <div className="page-header">
        <Title level={2}>审批管理</Title>
        <Text type="secondary">统一审批工作台，查看和处理所有待审批事项</Text>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'all', label: '全部审批', children: <ApprovalList user={user!} filter="" /> },
        { key: 'pending', label: '待审批', children: <ApprovalList user={user!} filter="pending" /> },
        { key: 'recruitment', label: '招聘审批', children: <ApprovalList user={user!} filter="recruitment" /> },
        { key: 'onboarding', label: '入职审批', children: <ApprovalList user={user!} filter="onboarding" /> },
        { key: 'employment', label: '在职审批', children: <ApprovalList user={user!} filter="employment" /> },
      ]} />
    </div>
  );
};

const ApprovalList: React.FC<{ user: any; filter: string }> = ({ user, filter }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [opinion, setOpinion] = useState('');

  const fetchData = async () => {
    setLoading(true);
    // 收集各模块的待审批项
    const allItems: any[] = [];

    // 招聘需求审批
    const { data: recruitments } = await supabase
      .from('recruitment_requests')
      .select('*')
      .in('status', ['pending_dept', 'pending_hr', 'pending_final']);
    if (recruitments) {
      recruitments.forEach((r: any) => {
        allItems.push({
          id: r.id,
          module: 'recruitment',
          moduleName: '招聘需求',
          title: `《聘用员工申请表》- ${r.position_name}`,
          status: r.status === 'pending_dept' ? 'pending' :
                  r.status === 'pending_hr' ? 'pending' : 'pending',
          step: r.status === 'pending_dept' ? '部门负责人审批' :
                r.status === 'pending_hr' ? '人事负责人审批' : 'Jenny终审',
          created_at: r.created_at,
          rawData: r,
        });
      });
    }

    // 试用期评估审批
    const { data: evaluations } = await supabase
      .from('probation_evaluations')
      .select('*')
      .in('status', ['pending_bu', 'pending_hr', 'pending_final']);
    if (evaluations) {
      evaluations.forEach((e: any) => {
        allItems.push({
          id: e.id,
          module: 'employment',
          moduleName: '在职管理',
          title: `${e.evaluation_type === 'internship' ? '实习评估' : '试用期评估'} - ${e.employee_id}`,
          status: 'pending',
          step: e.status === 'pending_bu' ? 'BU负责人审批' :
                e.status === 'pending_hr' ? '人事负责人审批' : 'Jenny终审',
          created_at: e.created_at,
          rawData: e,
        });
      });
    }

    // 续签审批
    const { data: renewals } = await supabase
      .from('contract_renewals')
      .select('*')
      .in('status', ['pending_bu', 'pending_hr', 'pending_final']);
    if (renewals) {
      renewals.forEach((r: any) => {
        allItems.push({
          id: r.id,
          module: 'employment',
          moduleName: '在职管理',
          title: `续签申请 - ${r.employee_id}`,
          status: 'pending',
          step: r.status === 'pending_bu' ? 'BU负责人审批' :
                r.status === 'pending_hr' ? '人事负责人审批' : 'Jenny终审',
          created_at: r.created_at,
          rawData: r,
        });
      });
    }

    // 离职审批
    const { data: resignations } = await supabase
      .from('resignations')
      .select('*')
      .eq('status', 'pending');
    if (resignations) {
      resignations.forEach((r: any) => {
        allItems.push({
          id: r.id,
          module: 'resignation',
          moduleName: '离职管理',
          title: `离职申请 - ${r.employee_id}`,
          status: 'pending',
          step: '三级审批',
          created_at: r.created_at,
          rawData: r,
        });
      });
    }

    // 筛选
    let filtered = allItems;
    if (filter === 'pending') filtered = allItems.filter((i: any) => i.status === 'pending');
    else if (filter && filter !== 'all') filtered = allItems.filter((i: any) => i.module === filter);

    setData(filtered.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleApprove = async (record: any) => {
    // 根据模块和步骤执行不同审批逻辑
    const { rawData } = record;
    if (record.module === 'recruitment') {
      let newStatus = rawData.status;
      if (rawData.status === 'pending_dept') newStatus = 'pending_hr';
      else if (rawData.status === 'pending_hr') newStatus = 'pending_final';
      else if (rawData.status === 'pending_final') newStatus = 'approved';

      await supabase.from('recruitment_requests').update({
        status: newStatus,
        ...(rawData.status === 'pending_final' ? { final_approved_at: new Date().toISOString() } : {}),
      }).eq('id', rawData.id);
    } else if (record.module === 'employment') {
      let newStatus = rawData.status;
      if (rawData.status === 'pending_bu') newStatus = 'pending_hr';
      else if (rawData.status === 'pending_hr') newStatus = 'pending_final';
      else if (rawData.status === 'pending_final') newStatus = 'completed';

      // 判断是评估还是续签
      const tableName = rawData.evaluation_type ? 'probation_evaluations' : 'contract_renewals';
      await supabase.from(tableName).update({ status: newStatus }).eq('id', rawData.id);
    }

    message.success('审批完成');
    setDetailVisible(false);
    fetchData();
  };

  const handleReject = async (record: any) => {
    const { rawData } = record;
    if (record.module === 'recruitment') {
      await supabase.from('recruitment_requests').update({ status: 'rejected' }).eq('id', rawData.id);
    }
    message.success('已驳回');
    setDetailVisible(false);
    fetchData();
  };

  const columns = [
    { title: '模块', dataIndex: 'moduleName', width: 100,
      render: (v: string, record: any) => <Tag color="blue">{v}</Tag> },
    { title: '审批事项', dataIndex: 'title', width: 280, ellipsis: true },
    { title: '当前步骤', dataIndex: 'step', width: 150,
      render: (v: string) => <Tag color="orange">{v}</Tag> },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      width: 160,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />}
            onClick={() => { setSelectedRecord(record); setDetailVisible(true); }}>
            查看详情
          </Button>
          {canApprove(user.role) && record.status === 'pending' && (
            <>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record)}>
                通过
              </Button>
              <Button size="small" danger icon={<CloseCircleOutlined />}
                onClick={() => handleReject(record)}>
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div className="table-toolbar">
        <Text strong>共 {data.length} 条审批记录</Text>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id"
        loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title="审批详情" open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="reject" danger onClick={() => handleReject(selectedRecord)}>驳回</Button>,
          <Button key="approve" type="primary" onClick={() => handleApprove(selectedRecord)}>通过</Button>,
        ]}
        width={500}>
        {selectedRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="审批模块">{selectedRecord.moduleName}</Descriptions.Item>
            <Descriptions.Item label="审批事项">{selectedRecord.title}</Descriptions.Item>
            <Descriptions.Item label="当前步骤">{selectedRecord.step}</Descriptions.Item>
            <Descriptions.Item label="提交时间">
              {dayjs(selectedRecord.created_at).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="审批意见">
              <TextArea rows={3} placeholder="请输入审批意见" value={opinion}
                onChange={(e) => setOpinion(e.target.value)} />
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
};

export default ApprovalPage;
