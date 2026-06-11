import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Modal, Form, Input, Select, DatePicker, message,
  Typography, Card, Steps, Descriptions, Badge, Tabs, Empty
} from 'antd';
import {
  PlusOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined,
  BellOutlined, ScheduleOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../../stores/authStore';
import supabase from '../../../utils/supabase';
import type { InterviewRound, InterviewResult } from '../../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

// 面试轮次定义（带顺序）
const roundOrder: InterviewRound[] = ['first', 'second', 'final'];

const roundMap: Record<InterviewRound, { label: string; order: number; nextRound: InterviewRound | null }> = {
  first: { label: '一面(HR)', order: 1, nextRound: 'second' },
  second: { label: '二面(BU负责人)', order: 2, nextRound: 'final' },
  final: { label: '终面(Jenny+黄一萧)', order: 3, nextRound: null },
};

// 简历状态细化
const resumeInterviewStatusMap: Record<InterviewRound, string> = {
  first: 'interviewing_first',
  second: 'interviewing_second',
  final: 'interviewing_final',
};

const resultMap: Record<InterviewResult, { label: string; color: string }> = {
  pending: { label: '待面试', color: 'default' },
  passed: { label: '通过', color: 'success' },
  failed: { label: '未通过', color: 'error' },
  cancelled: { label: '已取消', color: 'default' },
};

// 通知类型
interface Notification {
  id: string;
  interview_id: string;
  user_id: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  interview?: any;
}

const InterviewPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [form] = Form.useForm();

  // 通知相关
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('interviews');

  // 仅 tina(sub_admin) 可安排面试
  const isTina = user?.username === 'tina';

  const fetchData = async () => {
    setLoading(true);
    const [{ data: interviews }, { data: resumeList }, { data: userList }] = await Promise.all([
      supabase.from('interviews').select('*').order('scheduled_at', { ascending: true }),
      supabase.from('resumes').select('id,candidate_name,status').in('status', ['screening', 'interviewing_first', 'interviewing_second', 'interviewing_final']),
      supabase.from('users').select('id,display_name,role,department,username'),
    ]);
    if (interviews) setData(interviews);
    if (resumeList) setResumes(resumeList);
    if (userList) setUsers(userList);

    // 拉取通知
    if (user) {
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (notifData) setNotifications(notifData);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // 获取候选人已完成的面试轮次（用于判断可安排的下一轮）
  const getCandidateInterviewStatus = (resumeId: string): { completedRounds: InterviewRound[]; hasFailed: boolean; currentRound: InterviewRound | null } => {
    const candidateInterviews = data.filter((i: any) => i.resume_id === resumeId);
    const completedRounds: InterviewRound[] = [];
    let hasFailed = false;

    for (const iv of candidateInterviews) {
      if (iv.result === 'passed') {
        completedRounds.push(iv.round);
      }
      if (iv.result === 'failed') {
        hasFailed = true;
      }
    }

    // 判断当前应该安排的轮次
    let currentRound: InterviewRound | null = 'first';
    if (completedRounds.includes('first') && !completedRounds.includes('second')) {
      currentRound = 'second';
    } else if (completedRounds.includes('second') && !completedRounds.includes('final')) {
      currentRound = 'final';
    } else if (completedRounds.includes('final')) {
      currentRound = null; // 所有轮次完成
    }

    return { completedRounds, hasFailed, currentRound };
  };

  // 检查某候选人某轮是否已存在pending面试
  const hasPendingInterview = (resumeId: string, round: InterviewRound): boolean => {
    return data.some((i: any) => i.resume_id === resumeId && i.round === round && i.result === 'pending');
  };

  const handleSubmit = async (values: any) => {
    const resumeId = values.resume_id;
    const round = values.round as InterviewRound;

    // 校验：该候选人该轮不能已有待面试的记录
    if (hasPendingInterview(resumeId, round)) {
      message.error(`该候选人已有待进行的${roundMap[round].label}，请先完成当前面试`);
      return;
    }

    // 校验：必须按顺序，不能跳过
    const { completedRounds, hasFailed } = getCandidateInterviewStatus(resumeId);
    if (hasFailed) {
      message.error('该候选人面试未通过，不能继续安排面试');
      return;
    }

    const expectedRound = getCandidateInterviewStatus(resumeId).currentRound;
    if (expectedRound !== round) {
      message.error(`请按顺序安排面试，当前应为${expectedRound ? roundMap[expectedRound].label : '无'}`);
      return;
    }

    const payload = {
      ...values,
      scheduled_at: values.scheduled_at?.toISOString(),
      created_by: user?.id,
    };

    const { data: insertedData, error } = await supabase.from('interviews').insert(payload).select().single();
    if (error) {
      message.error('创建失败: ' + error.message);
    } else {
      message.success('面试安排成功');
      setModalVisible(false);
      form.resetFields();

      // 更新简历状态为对应轮次
      const resumeStatus = resumeInterviewStatusMap[round];
      await supabase.from('resumes').update({ status: resumeStatus }).eq('id', resumeId);

      // 发送通知给面试官
      if (values.interviewers && values.interviewers.length > 0 && insertedData) {
        const notifPayload = values.interviewers.map((interviewerId: string) => ({
          interview_id: insertedData.id,
          user_id: interviewerId,
          title: '新面试安排',
          content: `您被安排为候选人【${resumes.find((r: any) => r.id === resumeId)?.candidate_name || '未知'}】的${roundMap[round].label}面试官，面试时间：${values.scheduled_at?.format('YYYY-MM-DD HH:mm')}，地点：${values.location || '待定'}`,
        }));
        await supabase.from('notifications').insert(notifPayload);
      }

      fetchData();
    }
  };

  const handleResult = async (id: string, result: InterviewResult, feedback?: string) => {
    const interview = data.find((i: any) => i.id === id);
    if (!interview) return;

    await supabase.from('interviews').update({
      result,
      feedback: feedback || '',
    }).eq('id', id);

    message.success('结果已更新');

    // 更新简历状态
    if (result === 'failed') {
      // 面试失败，简历状态改为已淘汰
      await supabase.from('resumes').update({ status: 'rejected' }).eq('id', interview.resume_id);
      // 发送通知给tina
      const tinaUser = users.find((u: any) => u.username === 'tina');
      const roundLabel = roundMap[interview.round as InterviewRound]?.label || '';
      if (tinaUser) {
        await supabase.from('notifications').insert({
          interview_id: id,
          user_id: tinaUser.id,
          title: '面试结果通知',
          content: `候选人【${resumes.find((r: any) => r.id === interview.resume_id)?.candidate_name || '未知'}】${roundLabel}未通过`,
        });
      }
    } else if (result === 'passed') {
      const roundInfo = roundMap[interview.round as InterviewRound];
      const nextRound = roundInfo?.nextRound;
      if (nextRound) {
        // 进入下一轮，状态更新为下一轮面试中
        const nextStatus = resumeInterviewStatusMap[nextRound];
        await supabase.from('resumes').update({ status: nextStatus }).eq('id', interview.resume_id);
        // 通知tina安排下一轮
        const tinaUser = users.find((u: any) => u.username === 'tina');
        const nextRoundLabel = roundMap[nextRound]?.label || '';
        if (tinaUser) {
          await supabase.from('notifications').insert({
            interview_id: id,
            user_id: tinaUser.id,
            title: '请安排下一轮面试',
            content: `候选人【${resumes.find((r: any) => r.id === interview.resume_id)?.candidate_name || '未知'}】${roundInfo?.label || ''}已通过，请安排${nextRoundLabel}`,
          });
        }
      } else {
        // 终面通过，更新为可发offer
        await supabase.from('resumes').update({ status: 'offered' }).eq('id', interview.resume_id);
      }
    }

    fetchData();
  };

  // 标记通知已读
  const markNotifRead = async (notifId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    fetchData();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const columns = [
    {
      title: '候选人',
      dataIndex: 'resume_id',
      width: 100,
      render: (id: string) => {
        const r = resumes.find((r: any) => r.id === id);
        return r?.candidate_name || id?.slice(0, 8);
      },
    },
    {
      title: '面试轮次',
      dataIndex: 'round',
      width: 130,
      render: (round: InterviewRound) => <Tag color="blue">{roundMap[round]?.label}</Tag>,
    },
    {
      title: '面试官',
      dataIndex: 'interviewers',
      width: 150,
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
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '待定',
    },
    {
      title: '地点',
      dataIndex: 'location',
      width: 140,
      ellipsis: true,
    },
    {
      title: '结果',
      dataIndex: 'result',
      width: 100,
      render: (result: InterviewResult) => (
        <Tag color={resultMap[result]?.color}>{resultMap[result]?.label}</Tag>
      ),
    },
    {
      title: '反馈',
      dataIndex: 'feedback',
      width: 200,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      width: 220,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />}
            onClick={() => { setSelectedRecord(record); setDetailVisible(true); }}>
            详情
          </Button>
          {record.result === 'pending' && (
            <>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />}
                onClick={() => handleResult(record.id, 'passed', '面试通过')}>
                通过
              </Button>
              <Button size="small" danger icon={<CloseCircleOutlined />}
                onClick={() => handleResult(record.id, 'failed', '面试未通过')}>
                不通过
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  // 候选人选择：根据当前状态过滤可选轮次
  const handleResumeChange = (resumeId: string) => {
    if (!resumeId) return;
    const status = getCandidateInterviewStatus(resumeId);
    if (status.hasFailed) {
      message.warning('该候选人面试未通过，无法继续安排');
      form.setFieldValue('resume_id', undefined);
      return;
    }
    if (!status.currentRound) {
      message.info('该候选人已完成全部面试');
      form.setFieldValue('resume_id', undefined);
      return;
    }
    form.setFieldValue('round', status.currentRound);
  };

  return (
    <div>
      <div className="page-header">
        <Title level={2}>面试安排</Title>
        <Text type="secondary">管理招聘全流程面试：一面(HR) → 二面(BU负责人) → 终面(Jenny+黄一萧)</Text>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}
        tabBarExtraContent={
          isTina && (
            <Badge count={unreadCount} size="small" offset={[-5, 0]}>
              <Button icon={<BellOutlined />} onClick={() => setNotificationVisible(true)}>
                消息通知
              </Button>
            </Badge>
          )
        }
        items={[
          {
            key: 'interviews',
            label: '面试列表',
            children: (
              <Card>
                <div className="table-toolbar">
                  <Text strong>共 {data.length} 条面试记录</Text>
                  {isTina && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                      form.resetFields();
                      setModalVisible(true);
                    }}>
                      安排面试
                    </Button>
                  )}
                  {!isTina && (
                    <Text type="secondary">仅黄燕婷(Tina)可安排面试</Text>
                  )}
                </div>

                <Steps
                  current={-1}
                  size="small"
                  style={{ marginBottom: 24 }}
                  items={[
                    { title: '一面(HR)', description: '黄燕婷初筛面试' },
                    { title: '二面(BU负责人)', description: '部门负责人评估' },
                    { title: '终面', description: 'Jenny+黄一萧终审' },
                  ]}
                />

                <Table columns={columns} dataSource={data} rowKey="id"
                  loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1100 }} />
              </Card>
            ),
          },
        ]}
      />

      {/* 安排面试弹窗 */}
      <Modal
        title="安排面试"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="resume_id" label="选择候选人" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="搜索候选人"
              onChange={handleResumeChange}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={resumes
                .filter((r: any) => {
                  const status = getCandidateInterviewStatus(r.id);
                  return status.currentRound !== null && !status.hasFailed;
                })
                .map((r: any) => ({
                  label: `${r.candidate_name} (${(() => {
                    const s = getCandidateInterviewStatus(r.id);
                    return s.currentRound ? roundMap[s.currentRound].label : '已完成';
                  })()})`,
                  value: r.id,
                }))}
            />
          </Form.Item>
          <Form.Item name="round" label="面试轮次" rules={[{ required: true }]}>
            <Select options={[
              { label: '一面(HR)', value: 'first' },
              { label: '二面(BU负责人)', value: 'second' },
              { label: '终面(Jenny+黄一萧)', value: 'final' },
            ]} disabled />
          </Form.Item>
          <Form.Item name="interviewers" label="面试官" rules={[{ required: true, message: '请选择面试官' }]}>
            <Select
              mode="multiple"
              placeholder="选择面试官"
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={users
                .filter((u: any) => ['super_admin', 'main_admin', 'sub_admin', 'bu_head'].includes(u.role))
                .map((u: any) => ({
                  label: `${u.display_name} (${u.department || '-'})`,
                  value: u.id,
                }))}
            />
          </Form.Item>
          <Form.Item name="scheduled_at" label="面试时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="面试地点">
            <Input placeholder="如：公司会议室A" />
          </Form.Item>
          <Form.Item name="feedback" label="备注">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 面试详情弹窗 */}
      <Modal title="面试详情" open={detailVisible} onCancel={() => setDetailVisible(false)}
        footer={null} width={500}>
        {selectedRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="候选人">
              {resumes.find((r: any) => r.id === selectedRecord.resume_id)?.candidate_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="面试轮次">
              <Tag color="blue">{roundMap[selectedRecord.round as InterviewRound]?.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="面试官">
              {(selectedRecord.interviewers || []).map((id: string) => {
                const u = users.find((u: any) => u.id === id);
                return u?.display_name || id.slice(0, 8);
              }).join('、') || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="面试时间">
              {selectedRecord.scheduled_at ? dayjs(selectedRecord.scheduled_at).format('YYYY-MM-DD HH:mm') : '待定'}
            </Descriptions.Item>
            <Descriptions.Item label="地点">{selectedRecord.location || '-'}</Descriptions.Item>
            <Descriptions.Item label="结果">
              <Tag color={resultMap[selectedRecord.result as InterviewResult]?.color}>
                {resultMap[selectedRecord.result as InterviewResult]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="反馈">{selectedRecord.feedback || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 消息通知弹窗 */}
      <Modal
        title="消息通知"
        open={notificationVisible}
        onCancel={() => setNotificationVisible(false)}
        footer={null}
        width={600}
      >
        {notifications.length === 0 ? (
          <Empty description="暂无通知" />
        ) : (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {notifications.map((n) => (
              <Card
                key={n.id}
                size="small"
                style={{ marginBottom: 8, background: n.is_read ? '#fff' : '#e6f7ff' }}
                onClick={() => markNotifRead(n.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong={!n.is_read}>{n.title}</Text>
                  <Space>
                    {!n.is_read && <Badge status="processing" />}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(n.created_at).format('MM-DD HH:mm')}
                    </Text>
                  </Space>
                </div>
                <div style={{ marginTop: 4 }}>{n.content}</div>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InterviewPage;
