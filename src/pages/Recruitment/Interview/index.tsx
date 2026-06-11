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
    interviewerRoles: ['super_admin'],  // Jenny / 高管
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
    if (interviews) setData(interviews);
    if (resumeList) setResumes(resumeList);
    if (userList) setUsers(userList);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Tina 才能安排面试
  const canArrange = isTina;

  // 判断当前用户是否能填该面试的结果
  const canFillResult = (interview: any) => {
    if (!interview || interview.result) return false; // 已有结果
    const decider = roundConfig[interview.round]?.resultDecider;
    if (decider === 'tina') return isTina;
    if (decider === 'interviewer') {
      // 面试官是当前用户
      return interview.interviewers?.includes(user?.id);
    }
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
      const roles = roundConfig[round]?.interviewerRoles || [];
      matched = users.filter((u: any) => roles.includes(u.role)).map((u: any) => u.id);
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

    // 创建面试记录
    const { data: inserted, error } = await supabase.from('interviews').insert({
      resume_id: values.resume_id,
      round,
      interviewers: values.interviewers || [],
      scheduled_at: values.scheduled_at?.toISOString(),
      location: values.location || '',
      feedback: values.feedback || '',
      result: 'pending',
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

    // 更新面试结果
    await supabase.from('interviews').update({
      result: values.result,
      result_note: values.result_note || '',
    }).eq('id', interview.id);

    if (values.result === 'failed') {
      // 不通过 → 简历状态"不录取"
      await supabase.from('resumes').update({ status: 'rejected' }).eq('id', resumeId);
      // 通知 Tina
      const tinaUser = users.find((u: any) => u.username === 'tina');
      if (tinaUser) {
        await supabase.from('notifications').insert({
          interview_id: interview.id,
          user_id: tinaUser.id,
          title: '面试未通过通知',
          content: `候选人【${resumes.find((r: any) => r.id === resumeId)?.candidate_name || '未知'}】${roundConfig[round]?.label}未通过，简历状态已标记为"不录取"`,
        });
      }
    } else if (values.result === 'passed') {
      const nextRound = nextRoundMap[round];
      if (nextRound) {
        // 进入下一轮
        const nextStatus = resumeStatusMap[nextRound];
        await supabase.from('resumes').update({ status: nextStatus }).eq('id', resumeId);
        // 通知 Tina 安排下一轮
        const tinaUser = users.find((u: any) => u.username === 'tina');
        if (tinaUser) {
          await supabase.from('notifications').insert({
            interview_id: interview.id,
            user_id: tinaUser.id,
            title: '请安排下一轮面试',
            content: `候选人【${resumes.find((r: any) => r.id === resumeId)?.candidate_name || '未知'}】${roundConfig[round]?.label}已通过，请安排${roundConfig[nextRound].label}`,
          });
        }
      } else {
        // 终面通过 → 待发Offer
        await supabase.from('resumes').update({ status: 'pending_offer' }).eq('id', resumeId);
        // 通知 Tina 发 Offer
        const tinaUser = users.find((u: any) => u.username === 'tina');
        if (tinaUser) {
          await supabase.from('notifications').insert({
            interview_id: interview.id,
            user_id: tinaUser.id,
            title: '终面通过，请发Offer',
            content: `候选人【${resumes.find((r: any) => r.id === resumeId)?.candidate_name || '未知'}】终面已通过，请尽快发送Offer！`,
          });
        }
      }
    }

    message.success('结果已保存');
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
      render: (r: string) => r ? <Tag color={statusColor[r]}>{r === 'passed' ? '通过' : r === 'failed' ? '未通过' : r === 'cancelled' ? '取消' : r}</Tag> : <Tag color="default">待评定</Tag>,
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
              填写结果
            </Button>
          )}
          {record.result && (
            <Tag color={statusColor[record.result]}>
              {record.result === 'passed' ? `${roundConfig[record.round]?.label}通过` : `${roundConfig[record.round]?.label}未通过`}
            </Tag>
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
                .filter((r: any) => ['new', 'screening', 'interviewing_first', 'interviewing_second'].includes(r.status))
                .map((r: any) => {
                  const statusLabel =
                    r.status === 'new' ? '新收→待一面' :
                    r.status === 'screening' ? '筛选中→待一面' :
                    r.status === 'interviewing_first' ? '待安排一面' :
                    r.status === 'interviewing_second' ? '一面已通过→待终面' : r.status;
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

      {/* 填写面试结果弹窗 */}
      <Modal title={`填写面试结果 —— ${selectedInterview ? roundConfig[selectedInterview.round]?.label : ''}`}
        open={resultModalVisible}
        onCancel={() => { setResultModalVisible(false); setSelectedInterview(null); }}
        onOk={() => resultForm.submit()} width={550}>
        <Form form={resultForm} layout="vertical" onFinish={handleResultSubmit}>
          <Form.Item name="result" label="面试结果" rules={[{ required: true }]}>
            <Select options={[
              { label: '✅ 通过', value: 'passed' },
              { label: '❌ 未通过', value: 'failed' },
              { label: '⚠️ 取消', value: 'cancelled' },
            ]} />
          </Form.Item>
          <Form.Item name="result_note" label="结果备注">
            <TextArea rows={3} placeholder="面试评价、不通过原因等" />
          </Form.Item>
          {selectedInterview && roundConfig[selectedInterview.round]?.resultDecider === 'interviewer' && (
            <Card size="small" style={{ background: '#fffbe6', border: '1px solid #ffe58f' }}>
              <Text type="warning">提示：面试结果由面试官填写，Tina 将收到通知。</Text>
            </Card>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default InterviewPage;
