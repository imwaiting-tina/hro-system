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
        { key: 'interview', label: '面试审批', children: <ApprovalList user={user!} filter="interview" /> },
        { key: 'recruitment', label: '招聘审批', children: <ApprovalList user={user!} filter="recruitment" /> },
        { key: 'onboarding', label: '入职审批', children: <ApprovalList user={user!} filter="onboarding" /> },
        { key: 'employment', label: '在职审批', children: <ApprovalList user={user!} filter="employment" /> },
      ]} />
    </div>
  );
};

const roundLabel: Record<string, string> = { first: '一面', second: '二面', final: '终面' };

const ApprovalList: React.FC<{ user: any; filter: string }> = ({ user, filter }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [opinion, setOpinion] = useState('');

  // 辅助数据
  const [resumesMap, setResumesMap] = useState<Record<string, string>>({});
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  const fetchData = async () => {
    setLoading(true);
    const allItems: any[] = [];

    // ========== 面试审批（从 approval_records 表查询） ==========
    const { data: interviewApprovals } = await supabase
      .from('approval_records')
      .select('*')
      .eq('module', 'interview')
      .order('created_at', { ascending: false });
    if (interviewApprovals) {
      // 批量查询关联的面试和简历数据
      const interviewIds = interviewApprovals.map((a: any) => a.record_id);
      if (interviewIds.length > 0) {
        const { data: interviews } = await supabase
          .from('interviews')
          .select('id,resume_id,round,feedback,interviewer_notes,scheduled_at')
          .in('id', interviewIds);
        const interviewMap: Record<string, any> = {};
        if (interviews) {
          interviews.forEach((i: any) => { interviewMap[i.id] = i; });
          // 查简历
          const resumeIds = [...new Set(interviews.map((i: any) => i.resume_id))];
          const { data: resumes } = await supabase
            .from('resumes')
            .select('id,candidate_name')
            .in('id', resumeIds);
          const rMap: Record<string, string> = {};
          if (resumes) resumes.forEach((r: any) => { rMap[r.id] = r.candidate_name; });
          setResumesMap(prev => ({ ...prev, ...rMap }));
        }

        interviewApprovals.forEach((a: any) => {
          const interview = interviewMap[a.record_id];
          if (!interview) return;
          const name = resumesMap[interview.resume_id] || interview.resume_id?.slice(0, 8);
          const rLabel = roundLabel[interview.round] || interview.round;
          const proposed = interview.interviewer_notes ? (() => {
            try { return JSON.parse(interview.interviewer_notes).proposed_result; } catch { return null; }
          })() : null;

          allItems.push({
            id: a.id,
            approvalId: a.id,
            module: 'interview',
            moduleName: '面试审批',
            title: `${rLabel}结果 - ${name}`,
            status: a.status,
            step: a.step_name,
            created_at: a.created_at,
            rawData: a,
            interviewData: interview,
            proposedResult: proposed,
            candidateName: name,
          });
        });
      }
    }

    // ========== 招聘需求审批 ==========
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
          status: 'pending',
          step: r.status === 'pending_dept' ? '部门负责人审批' :
                r.status === 'pending_hr' ? '人事负责人审批' : 'Jenny终审',
          created_at: r.created_at,
          rawData: r,
        });
      });
    }

    // ========== 试用期评估审批 ==========
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

    // ========== 续签审批 ==========
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

    // ========== 入职审批（从 approval_records 表查询） ==========
    const { data: onboardingApprovals } = await supabase
      .from('approval_records')
      .select('*')
      .eq('module', 'onboarding')
      .order('created_at', { ascending: false });
    if (onboardingApprovals) {
      // 批量查询关联的入职文件数据
      const onboardingIds = onboardingApprovals.map((a: any) => a.record_id);
      if (onboardingIds.length > 0) {
        const { data: docs } = await supabase
          .from('onboarding_documents')
          .select('id,employee_id,doc_type,doc_name')
          .in('id', onboardingIds);
        const docMap: Record<string, any> = {};
        if (docs) docs.forEach((d: any) => { docMap[d.id] = d; });

        // 批量查询员工
        const employeeIds = [...new Set(docs?.map((d: any) => d.employee_id) || [])];
        const empMap: Record<string, string> = {};
        if (employeeIds.length > 0) {
          const { data: emps } = await supabase
            .from('employees').select('id,chinese_name').in('id', employeeIds);
          if (emps) emps.forEach((e: any) => { empMap[e.id] = e.chinese_name; });
        }

        const docTypeLabels: Record<string, string> = {
          recruitment_approval: '录用审批单',
          intern_approval: '应届生实习录用表',
          rehire_approval: '劳务录用审批单',
          labor_contract: '劳动合同',
          internship_agreement: '实习协议',
          service_agreement: '劳务协议',
          employee_handbook: '员工手册',
        };

        onboardingApprovals.forEach((a: any) => {
          const doc = docMap[a.record_id];
          const empName = empMap[doc?.employee_id] || '未知员工';
          const docLabel = docTypeLabels[doc?.doc_type] || doc?.doc_type || '入职文件';

          allItems.push({
            id: a.id,
            approvalId: a.id,
            module: 'onboarding',
            moduleName: '入职管理',
            title: `${docLabel} - ${empName}`,
            status: a.status,
            step: a.step_name,
            created_at: a.created_at,
            rawData: a,
            docData: doc,
          });
        });
      }
    }

    // ========== 离职审批 ==========
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

  // ========== 面试审批通过 ==========
  const handleInterviewApprove = async (record: any) => {
    const approvalId = record.approvalId;
    const interview = record.interviewData;
    const proposedResult = record.proposedResult;
    const round = interview?.round;
    const resumeId = interview?.resume_id;

    if (!proposedResult) {
      message.warning('无法获取面试提交的结果，请联系管理员');
      return;
    }

    // 1. 更新审批记录
    await supabase.from('approval_records').update({
      status: 'approved',
      opinion: opinion || '审批通过',
      approved_at: new Date().toISOString(),
    }).eq('id', approvalId);

    // 2. 更新面试记录结果
    const interviewNotes = interview?.interviewer_notes ? (() => {
      try { return JSON.parse(interview.interviewer_notes); } catch { return {}; }
    })() : {};
    interviewNotes.approved_by = user?.id;
    interviewNotes.approved_at = new Date().toISOString();
    interviewNotes.approval_opinion = opinion || '';

    await supabase.from('interviews').update({
      result: proposedResult,
      interviewer_notes: JSON.stringify(interviewNotes),
    }).eq('id', interview.id);

    // 3. 同步简历状态 + 通知
    const candidateName = record.candidateName || '未知';

    if (proposedResult === 'failed') {
      await supabase.from('resumes').update({ status: 'rejected' }).eq('id', resumeId);
      // 通知 Tina
      const { data: tinaUser } = await supabase.from('users').select('id').eq('username', 'tina').single();
      if (tinaUser) {
        await supabase.from('notifications').insert({
          interview_id: interview.id,
          user_id: tinaUser.id,
          title: '面试未通过（已审批）',
          content: `候选人【${candidateName}】${roundLabel[round]}未通过，简历已标记为"不录取"`,
        });
      }
    } else if (proposedResult === 'passed') {
      if (round === 'first') {
        await supabase.from('resumes').update({ status: 'interviewing_second' }).eq('id', resumeId);
        const { data: tinaUser } = await supabase.from('users').select('id').eq('username', 'tina').single();
        if (tinaUser) {
          await supabase.from('notifications').insert({
            interview_id: interview.id,
            user_id: tinaUser.id,
            title: '一面通过，请安排二面',
            content: `候选人【${candidateName}】一面已通过（审批完成），请安排二面`,
          });
        }
      } else if (round === 'second') {
        await supabase.from('resumes').update({ status: 'interviewing_final' }).eq('id', resumeId);
        const { data: tinaUser } = await supabase.from('users').select('id').eq('username', 'tina').single();
        if (tinaUser) {
          await supabase.from('notifications').insert({
            interview_id: interview.id,
            user_id: tinaUser.id,
            title: '二面通过，请安排终面',
            content: `候选人【${candidateName}】二面已通过（审批完成），请安排终面`,
          });
        }
      } else if (round === 'final') {
        await supabase.from('resumes').update({ status: 'pending_offer' }).eq('id', resumeId);
        const { data: tinaUser } = await supabase.from('users').select('id').eq('username', 'tina').single();
        if (tinaUser) {
          await supabase.from('notifications').insert({
            interview_id: interview.id,
            user_id: tinaUser.id,
            title: '终面通过，请发Offer',
            content: `候选人【${candidateName}】终面已通过（审批完成），请尽快发送Offer！`,
          });
        }
      }
    }

    message.success('审批通过，面试结果已生效');
    setDetailVisible(false);
    setOpinion('');
    fetchData();
  };

  // ========== 面试审批驳回 ==========
  const handleInterviewReject = async (record: any) => {
    const approvalId = record.approvalId;
    const interview = record.interviewData;
    const candidateName = record.candidateName || '未知';

    // 更新审批记录
    await supabase.from('approval_records').update({
      status: 'rejected',
      opinion: opinion || '审批驳回',
      approved_at: new Date().toISOString(),
    }).eq('id', approvalId);

    // 清除暂存结果
    const interviewNotes = interview?.interviewer_notes ? (() => {
      try { return JSON.parse(interview.interviewer_notes); } catch { return {}; }
    })() : {};
    interviewNotes.rejected_by = user?.id;
    interviewNotes.rejected_at = new Date().toISOString();
    interviewNotes.rejection_reason = opinion || '';
    await supabase.from('interviews').update({
      interviewer_notes: JSON.stringify(interviewNotes),
    }).eq('id', interview.id);

    // 通知 Tina（让提交人知道被驳回）
    const { data: tinaUser } = await supabase.from('users').select('id').eq('username', 'tina').single();
    if (tinaUser) {
      await supabase.from('notifications').insert({
        interview_id: interview.id,
        user_id: tinaUser.id,
        title: '面试结果审批被驳回',
        content: `候选人【${candidateName}】${roundLabel[interview.round]}结果审批被驳回。\n驳回原因：${opinion || '无'}`,
      });
    }

    message.success('已驳回');
    setDetailVisible(false);
    setOpinion('');
    fetchData();
  };

  // ========== 通用审批（招聘/在职/入职/离职） ==========
  const handleApprove = async (record: any) => {
    if (record.module === 'interview') {
      await handleInterviewApprove(record);
      return;
    }
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
    } else if (record.module === 'onboarding') {
      // 入职审批：更新 approval_records 状态
      await supabase.from('approval_records').update({
        status: 'approved',
        opinion: opinion || '审批通过',
        approved_at: new Date().toISOString(),
      }).eq('id', rawData.id);
      // 同时更新入职文件的用印审批状态
      if (record.docData) {
        await supabase.from('onboarding_documents').update({
          seal_approved: true,
          seal_approved_by: user?.id,
          seal_approved_at: new Date().toISOString(),
        }).eq('id', record.docData.id);
      }
    } else if (record.module === 'employment') {
      let newStatus = rawData.status;
      if (rawData.status === 'pending_bu') newStatus = 'pending_hr';
      else if (rawData.status === 'pending_hr') newStatus = 'pending_final';
      else if (rawData.status === 'pending_final') newStatus = 'completed';

      const tableName = rawData.evaluation_type ? 'probation_evaluations' : 'contract_renewals';
      await supabase.from(tableName).update({ status: newStatus }).eq('id', rawData.id);
    }

    message.success('审批完成');
    setDetailVisible(false);
    setOpinion('');
    fetchData();
  };

  const handleReject = async (record: any) => {
    if (record.module === 'interview') {
      await handleInterviewReject(record);
      return;
    }
    const { rawData } = record;
    if (record.module === 'recruitment') {
      await supabase.from('recruitment_requests').update({ status: 'rejected' }).eq('id', rawData.id);
    } else if (record.module === 'onboarding') {
      await supabase.from('approval_records').update({
        status: 'rejected',
        opinion: opinion || '审批驳回',
        approved_at: new Date().toISOString(),
      }).eq('id', rawData.id);
    }
    message.success('已驳回');
    setDetailVisible(false);
    setOpinion('');
    fetchData();
  };

  const columns = [
    { title: '模块', dataIndex: 'moduleName', width: 100,
      render: (v: string, record: any) => {
        const color = record.module === 'interview' ? 'purple' : 'blue';
        return <Tag color={color}>{v}</Tag>;
      } },
    { title: '审批事项', dataIndex: 'title', width: 300, ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => {
        if (v === 'approved') return <Tag color="success">已通过</Tag>;
        if (v === 'rejected') return <Tag color="error">已驳回</Tag>;
        return <Tag color="processing">待审批</Tag>;
      },
    },
    { title: '当前步骤', dataIndex: 'step', width: 200,
      render: (v: string) => <Tag color="orange">{v}</Tag> },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      width: 160,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      width: 220,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />}
            onClick={() => { setSelectedRecord(record); setOpinion(''); setDetailVisible(true); }}>
            查看详情
          </Button>
          {user && canApprove(user.role) && record.status === 'pending' && (
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

  // 面试审批详情渲染
  const renderInterviewDetail = (record: any) => {
    const interview = record.interviewData;
    const notes = interview?.interviewer_notes ? (() => {
      try { return JSON.parse(interview.interviewer_notes); } catch { return {}; }
    })() : {};
    return (
      <>
        <Descriptions.Item label="候选人">{record.candidateName}</Descriptions.Item>
        <Descriptions.Item label="面试轮次">{roundLabel[interview?.round] || '-'}</Descriptions.Item>
        <Descriptions.Item label="面试时间">
          {interview?.scheduled_at ? dayjs(interview.scheduled_at).format('YYYY-MM-DD HH:mm') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="提交结果">
          <Tag color={notes.proposed_result === 'passed' ? 'success' : notes.proposed_result === 'failed' ? 'error' : 'default'}>
            {notes.proposed_result === 'passed' ? '通过' : notes.proposed_result === 'failed' ? '未通过' : notes.proposed_result || '-'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="面试评价" span={2}>
          <div style={{ whiteSpace: 'pre-wrap', maxHeight: 150, overflow: 'auto' }}>
            {notes.evaluation || interview?.feedback || '-'}
          </div>
        </Descriptions.Item>
      </>
    );
  };

  return (
    <Card>
      <div className="table-toolbar">
        <Text strong>共 {data.length} 条审批记录</Text>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id"
        loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title="审批详情" open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={
          selectedRecord?.status === 'pending' && user && canApprove(user.role) ? [
            <Button key="reject" danger onClick={() => handleReject(selectedRecord)}>驳回</Button>,
            <Button key="approve" type="primary" onClick={() => handleApprove(selectedRecord)}>通过</Button>,
          ] : [
            <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
          ]
        }
        width={600}>
        {selectedRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="审批模块">{selectedRecord.moduleName}</Descriptions.Item>
            <Descriptions.Item label="审批事项">{selectedRecord.title}</Descriptions.Item>
            <Descriptions.Item label="当前步骤" span={2}>{selectedRecord.step}</Descriptions.Item>
            <Descriptions.Item label="提交时间" span={2}>
              {dayjs(selectedRecord.created_at).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            {selectedRecord.module === 'interview' && renderInterviewDetail(selectedRecord)}
            {selectedRecord.status === 'pending' && user && canApprove(user.role) && (
              <Descriptions.Item label="审批意见" span={2}>
                <TextArea rows={3} placeholder="请输入审批意见" value={opinion}
                  onChange={(e) => setOpinion(e.target.value)} />
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
};

export default ApprovalPage;
