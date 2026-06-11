import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Modal, Form, Input, Select,
  DatePicker, message, Typography, Card,
} from 'antd';
import { PlusOutlined, BellOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../../stores/authStore';
import supabase from '../../../utils/supabase';
import type { ResumeStatus, InterviewRound } from '../../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

// 面试轮次定义：key、标签、谁来决定结果、固定面试官匹配方式
const roundConfig: Record<string, {
  label: string;
  resultDecider: 'tina' | 'interviewer';
  interviewerRoles: string[];  // 固定面试官角色
  extraInterviewers?: string[]; // 额外面试官（按username匹配）
}> = {
  first:  {
    label: '一面',
    resultDecider: 'tina',
    interviewerRoles: [],  // 固定为tina本人，不按角色匹配
  },
  second: {
    label: '二面',
    resultDecider: 'interviewer',
    interviewerRoles: ['bu_head'],  // BU负责人
  },
  final:  {
    label: '终面',
    resultDecider: 'interviewer',
    interviewerRoles: ['super_admin'],  // Jenny
    extraInterviewers: ['shaun'], // 黄一萧（按username匹配）
  },
};

// 简历状态映射：面试轮次 → 对应简历状态
const resumeStatusMap: Record<string, ResumeStatus> = {
  first:  'interviewing_first',
  second: 'interviewing_second',
  final:  'interviewing_final',
};

// 下一轮映射
const nextRoundMap: Record<string, InterviewRound | null> = {
  first: 'second',
  second: 'final',
  final: null,
};

const statusColor: Record<string, string> = {
  pending: 'default',
  passed: 'success',
  failed: 'error',
  cancelled: 'warning',
};

const InterviewPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [form] = Form.useForm();
  const [resultForm] = Form.useForm();

  const isTina = user?.username === 'tina';

  const fetchData = async () => {
    setLoading(true);
    const [{ data: interviews }, { data: resumeList }, { data: userList }] = await Promise.all([
      supabase.from('interviews').select('*').order('scheduled_at', { ascending: true }),
      supabase.from('resumes').select('id,candidate_name,status').in('status', [
        'new', 'screening', 'interviewing_first', 'interviewing_second', 'interviewing_final',
      ]),
      supabase.from('users').select('id,username,display_name,role,department'),
    ]);
    if (resumeList) setResumes(resumeList);
    if (userList) setUsers(userList);
    // 非Tina用户只看分配给自己的面试
    if (interviews) {
      // 兼容旧数据：result='pending' 字符串统一视为 null（待评定）
      const cleaned = interviews.map((iv: any) => ({
        ...iv,
        result: iv.result === 'pending' ? null : iv.result,
      }));
      if (!isTina && user) {
        setData(cleaned.filter((iv: any) => iv.interviewers?.includes(user.id)));
      } else {
        setData(cleaned);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [modalVisible]);

  // Tina 才能安排面试
  const canArrange = isTina;

  // 终态结果（不可再填）
  const isFinalResult = (result: string | null) => result && ['passed', 'failed', 'cancelled'].includes(result);

  // 判断当前用户是否能填该面试的结果
  const canFillResult = (interview: any) => {
    if (!interview || isFinalResult(interview.result)) return false;
    // 当前用户是面试官之一
    if (interview.interviewers?.includes(user?.id)) return true;
    // Tina 只能填一面（她是固定面试官），不能越权填二面/终面
    if (isTina && interview.round === 'first') return true;
    return false;
  };

  // 根据候选人已有面试记录 + 简历状态，确定可安排的轮次
  const getAvailableRounds = (resumeStatus: string, existingInterviews: any[]): InterviewRound[] => {
    const hasPassedRound = (r: string) => existingInterviews?.some((x: any) => x.round === r && x.result === 'passed');
    const hasPendingRound = (r: string) => existingInterviews?.some((x: any) => x.round === r && !x.result);
    const hasAnyRound = (r: string) => existingInterviews?.some((x: any) => x.round === r);

    // 有待评定的一轮 → 不能安排新面试
    if (hasPendingRound('first') || hasPendingRound('second') || hasPendingRound('final')) {
      return [];
    }

    // 未安排过一面 → 可安排一面
    if (!hasAnyRound('first')) return ['first'];

    // 一面已通过 + 未安排二面 → 可安排二面
    if (hasPassedRound('first') && !hasAnyRound('second')) return ['second'];

    // 二面已通过 + 未安排终面 → 可安排终面
    if (hasPassedRound('second') && !hasAnyRound('final')) return ['final'];

    return [];
  };

  const openAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleResumeChange = async (resumeId: string) => {
    if (!resumeId) {
      form.setFieldsValue({ round: undefined, interviewers: undefined });
      return;
    }
    const resume = resumes.find((r: any) => r.id === resumeId);
    if (!resume) return;

    // 查该候选人已有面试记录
    const { data: existing } = await supabase
      .from('interviews')
      .select('round,result')
      .eq('resume_id', resumeId);

    const availableRounds = getAvailableRounds(resume.status, existing || []);
    if (availableRounds.length > 0) {
      const round = availableRounds[0];
      form.setFieldsValue({ round });
      matchInterviewers(round);
    } else {
      form.setFieldsValue({ round: undefined, interviewers: undefined });
      message.warning('该候选人暂无可安排的面试轮次');
    }
  };

  // 根据轮次自动匹配面试官
  const matchInterviewers = (round: InterviewRound) => {
    let matched: string[] = [];
    if (round === 'first') {
      // 一面固定为 tina
      const tina = users.find((u: any) => u.username === 'tina');
      matched = tina ? [tina.id] : [];
    } else {
      const config = roundConfig[round];
      const roles = config?.interviewerRoles || [];
      // 按角色匹配
      matched = users.filter((u: any) => roles.includes(u.role)).map((u: any) => u.id);
      // 额外面试官（按username匹配）
      const extras = config?.extraInterviewers || [];
      const extraIds = users.filter((u: any) => extras.includes(u.username)).map((u: any) => u.id);
      matched = [...matched, ...extraIds];
    }
    form.setFieldsValue({ interviewers: matched });
  };

  const handleSubmit = async (values: any) => {
    if (!values.resume_id) { message.warning('请选择候选人'); return; }
    if (!values.round) { message.warning('面试轮次未确定'); return; }

    const round: InterviewRound = values.round;

    // 查该候选人已有的面试
    const { data: existing } = await supabase
      .from('interviews')
      .select('round,result')
      .eq('resume_id', values.resume_id);

    const hasRound = (r: string) => existing?.some((x: any) => x.round === r);
    const pendingRound = existing?.find((x: any) => !x.result)?.round;

    // 检查是否有待评定的面试
    if (pendingRound) {
      message.warning(`该候选人还有${roundConfig[pendingRound]?.label}未进行结果评定，请先完成`);
      return;
    }

    // 不允许跳过轮次：查上一轮是否通过
    if (round === 'second' && (!hasRound('first') || !existing?.find((x: any) => x.round === 'first' && x.result === 'passed'))) {
      message.warning('请先完成一面并通过后再安排二面');
      return;
    }
    if (round === 'final' && (!hasRound('second') || !existing?.find((x: any) => x.round === 'second' && x.result === 'passed'))) {
      message.warning('请先完成二面并通过后再安排终面');
      return;
    }

    // 已有该轮次则不允许重复
    if (hasRound(round)) {
      message.warning(`该候选人已完成${roundConfig[round]?.label}，不可重复安排`);
      return;
    }

    // 创建面试记录（result 不设值，表示待评定）
    const { data: inserted, error } = await supabase.from('interviews').insert({
      resume_id: values.resume_id,
      round,
      interviewers: values.interviewers || [],
      scheduled_at: values.scheduled_at?.toISOString(),
      location: values.location || '',
      feedback: values.feedback || '',
    }).select('id').single();

    if (error) {
      message.error('面试安排失败：' + error.message);
      return;
    }

    // 更新简历状态为对应面试中
    await supabase.from('resumes').update({ status: resumeStatusMap[round] })
      .eq('id', values.resume_id);

    // 发通知给面试官
    const candidateName = resumes.find((r: any) => r.id === values.resume_id)?.candidate_name || '未知';
    if (values.interviewers?.length > 0) {
      for (const uid of values.interviewers) {
        await supabase.from('notifications').insert({
          interview_id: inserted?.id,
          user_id: uid,
          title: `新面试安排：${roundConfig[round].label}`,
          content: `候选人【${candidateName}】的${roundConfig[round].label}已安排，请准时参加。\n时间：${values.scheduled_at?.format('YYYY-MM-DD HH:mm')}\n地点：${values.location || '待定'}`,
        });
      }
    }

    message.success('面试安排成功');
    setModalVisible(false);
    form.resetFields();
    fetchData();
  };

  const openResult = (record: any) => {
    setSelectedInterview(record);
    resultForm.resetFields();
    setResultModalVisible(true);
  };

  const handleResultSubmit = async (values: any) => {
    if (!selectedInterview) return;
    const interview = selectedInterview;
    const resumeId = interview.resume_id;
    const round = interview.round;
    const config = roundConfig[round];
    const candidateName = resumes.find((r: any) => r.id === resumeId)?.candidate_name || '未知';

    // 确定审批人和审批步骤
    let approverRole: string;
    let stepName: string;
    if (round === 'first') {
      // 一面 → Tina 审批
      approverRole = 'main_admin';
      stepName = `一面结果审批（HR负责人）`;
    } else if (round === 'second') {
      // 二面 → BU负责人审批
      approverRole = 'bu_head';
      stepName = `二面结果审批（BU负责人）`;
    } else {
      // 终面 → 高管审批
      approverRole = 'super_admin';
      stepName = `终面结果审批（高管终审）`;
    }

    // 查找审批人
    const approver = users.find((u: any) => u.role === approverRole);
    if (!approver) {
      message.error(`未找到${stepName}的审批人`);
      return;
    }

    // 先更新面试记录：保存评价但状态仍为 pending（等审批）
    await supabase.from('interviews').update({
      feedback: values.feedback || '',
      // 暂存结果意向（审批通过后正式生效）
      interviewer_notes: JSON.stringify({
        proposed_result: values.result,
        evaluation: values.feedback || '',
        submitted_by: user?.id,
        submitted_at: new Date().toISOString(),
      }),
    }).eq('id', interview.id);

    // 创建审批记录
    const { error: approvalError } = await supabase.from('approval_records').insert({
      module: 'interview',
      record_id: interview.id,
      step_order: 1,
      step_name: stepName,
      approver_id: approver.id,
      approver_role: approverRole,
      status: 'pending',
      opinion: '',
    });

    if (approvalError) {
      message.error('提交审批失败：' + approvalError.message);
      return;
    }

    // 通知审批人
    await supabase.from('notifications').insert({
      interview_id: interview.id,
      user_id: approver.id,
      title: `${config.label}结果待审批`,
      content: `候选人【${candidateName}】的${config.label}结果已提交，请审批。\n提交结果：${values.result === 'passed' ? '通过' : '未通过'}\n评价：${values.feedback || '无'}`,
    });

    message.success('面试结果已提交审批，请等待审批完成');
    setResultModalVisible(false);
    setSelectedInterview(null);
    resultForm.resetFields();
    fetchData();
  };

  const columns = [
    { title: '候选人', dataIndex: 'resume_id', width: 120, render: (id: string) => resumes.find((r: any) => r.id === id)?.candidate_name || id?.slice(0, 8) },
    { title: '轮次', dataIndex: 'round', width: 100, render: (r: string) => <Tag color="blue">{roundConfig[r]?.label || r}</Tag> },
    {
      title: '面试官',
      dataIndex: 'interviewers',
      width: 200,
      render: (ids: string[]) => {
        if (!ids || ids.length === 0) return '-';
        return ids.map((id) => {
          const u = users.find((u: any) => u.id === id);
          return u?.display_name || id.slice(0, 8);
        }).join('、');
      },
    },
    {
      title: '面试时间',
      dataIndex: 'scheduled_at',
      width: 160,
      render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-',
    },
    {
      title: '地点',
      dataIndex: 'location',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: '结果',
      dataIndex: 'result',
      width: 100,
      render: (r: string) => {
        if (!r) return <Tag color="processing">待评定</Tag>;
        return <Tag color={statusColor[r]}>{r === 'passed' ? '通过' : r === 'failed' ? '未通过' : r === 'cancelled' ? '取消' : r}</Tag>;
      },
    },
    {
      title: '结果备注',
      dataIndex: 'result_note',
      width: 160,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      width: 160,
      render: (_: any, record: any) => (
        <Space size="small">
          {canFillResult(record) && (
            <Button size="small" type="primary" icon={<BellOutlined />} onClick={() => openResult(record)}>
              {!record.result ? '填写结果' : '修改结果'}
            </Button>
          )}
          {isFinalResult(record.result) && (
            <Tag color={statusColor[record.result]}>
              {record.result === 'passed' ? `${roundConfig[record.round]?.label}通过` : `${roundConfig[record.round]?.label}未通过`}
            </Tag>
          )}
          {!record.result && !canFillResult(record) && (
            <Tag color="processing">待评定</Tag>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={2}>面试安排</Title>
        <Text type="secondary">
          面试流程：一面(Tina决定) → 二面(面试官决定) → 终面(面试官决定) → 待发Offer
        </Text>
      </div>

      <Card>
        <div className="table-toolbar">
          <Text strong>共 {data.length} 条面试记录</Text>
          {canArrange && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              安排面试
            </Button>
          )}
          {!canArrange && (
            <Text type="secondary">仅 Tina 可安排面试；面试官可填写面试结果</Text>
          )}
        </div>

        <Table columns={columns} dataSource={data} rowKey="id"
          loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1100 }} />
      </Card>

      {/* 安排面试弹窗 */}
      <Modal title="安排面试" open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        onOk={() => form.submit()} width={700}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="resume_id" label="选择候选人" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="选择候选人（仅显示可安排面试的简历）"
              onChange={handleResumeChange}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={resumes
                .filter((r: any) => ['new', 'screening', 'interviewing_first', 'interviewing_second', 'interviewing_final'].includes(r.status))
                .map((r: any) => {
                  const statusLabel =
                    r.status === 'new' ? '新收→待一面' :
                    r.status === 'screening' ? '筛选中→待一面' :
                    r.status === 'interviewing_first' ? '待安排一面' :
                    r.status === 'interviewing_second' ? '一面已通过→待二面' :
                    r.status === 'interviewing_final' ? '二面已通过→待终面' : r.status;
                  return {
                    label: `${r.candidate_name}（${statusLabel}）`,
                    value: r.id,
                  };
                })}
            />
          </Form.Item>

          <Form.Item name="round" label="面试轮次" rules={[{ required: true }]}>
            <Select
              placeholder="选择候选人后自动确定轮次"
              options={[
                { label: '一面（HR面试）', value: 'first' },
                { label: '二面（BU负责人面试）', value: 'second' },
                { label: '终面（Jenny终审）', value: 'final' },
              ]}
              onChange={(value) => matchInterviewers(value as InterviewRound)}
            />
          </Form.Item>

          <Form.Item name="interviewers" label="面试官（自动匹配，不可修改）">
            <Select
              mode="multiple"
              disabled
              style={{ background: '#f5f5f5' }}
              placeholder="根据轮次自动匹配"
              options={users.map((u: any) => ({
                label: `${u.display_name}（${u.department || u.role}）`,
                value: u.id,
              }))}
            />
          </Form.Item>

          <Form.Item name="scheduled_at" label="面试时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="面试地点">
            <Input placeholder="线上/线下会议室" />
          </Form.Item>
          <Form.Item name="feedback" label="备注">
            <TextArea rows={3} placeholder="面试注意事项" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 填写面试结果弹窗 — 提交审批 */}
      <Modal title={`提交面试结果 —— ${selectedInterview ? roundConfig[selectedInterview.round]?.label : ''}`}
        open={resultModalVisible}
        onCancel={() => { setResultModalVisible(false); setSelectedInterview(null); }}
        onOk={() => resultForm.submit()} width={600}>
        <Form form={resultForm} layout="vertical" onFinish={handleResultSubmit}>
          <Form.Item name="result" label="面试结果" rules={[{ required: true, message: '请选择面试结果' }]}>
            <Select options={[
              { label: '✅ 通过', value: 'passed' },
              { label: '❌ 未通过', value: 'failed' },
              { label: '⚠️ 取消', value: 'cancelled' },
            ]} />
          </Form.Item>
          <Form.Item name="feedback" label="面试评价" rules={[{ required: true, message: '请填写面试评价' }]}>
            <TextArea rows={4} placeholder="请详细填写面试评价，包括：候选人表现、技能匹配度、沟通能力、建议等" />
          </Form.Item>
          {selectedInterview && (
            <Card size="small" style={{ background: '#fffbe6', border: '1px solid #ffe58f', marginBottom: 16 }}>
              <Text type="warning">
                提交后将进入审批流程：
                {selectedInterview.round === 'first' ? 'Tina（HR负责人）审批' :
                 selectedInterview.round === 'second' ? 'BU负责人审批' : '高管终审'}
                ，审批通过后结果正式生效。
              </Text>
            </Card>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default InterviewPage;
