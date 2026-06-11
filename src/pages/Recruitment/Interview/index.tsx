import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Modal, Form, Input, Select, DatePicker, message,
  Typography, Card, Steps, Descriptions
} from 'antd';
import { PlusOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useAuthStore, canEdit, canApprove } from '../../../stores/authStore';
import supabase from '../../../utils/supabase';
import type { InterviewRound, InterviewResult } from '../../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const roundMap: Record<InterviewRound, string> = {
  first: '一面(HR)',
  second: '二面(BU负责人)',
  final: '终面(Jenny+黄一萧)',
};

const resultMap: Record<InterviewResult, { label: string; color: string }> = {
  pending: { label: '待面试', color: 'default' },
  passed: { label: '通过', color: 'success' },
  failed: { label: '未通过', color: 'error' },
  cancelled: { label: '已取消', color: 'default' },
};

const InterviewPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    const [{ data: interviews }, { data: resumeList }] = await Promise.all([
      supabase.from('interviews').select('*').order('scheduled_at', { ascending: true }),
      supabase.from('resumes').select('id,candidate_name').in('status', ['screening', 'interviewing']),
    ]);
    if (interviews) setData(interviews);
    if (resumeList) setResumes(resumeList);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (values: any) => {
    const payload = {
      ...values,
      scheduled_at: values.scheduled_at?.toISOString(),
      created_by: user?.id,
    };

    const { error } = await supabase.from('interviews').insert(payload);
    if (error) {
      message.error('创建失败: ' + error.message);
    } else {
      message.success('面试安排成功');
      setModalVisible(false);
      form.resetFields();
      fetchData();

      // 更新简历状态
      await supabase.from('resumes').update({ status: 'interviewing' }).eq('id', values.resume_id);
    }
  };

  const handleResult = async (id: string, result: InterviewResult, feedback?: string) => {
    await supabase.from('interviews').update({
      result,
      feedback: feedback || '',
    }).eq('id', id);
    message.success('结果已更新');
    fetchData();
  };

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
      render: (round: InterviewRound) => <Tag color="blue">{roundMap[round]}</Tag>,
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
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />}
            onClick={() => { setSelectedRecord(record); setDetailVisible(true); }}>
            详情
          </Button>
          {record.result === 'pending' && canApprove(user!.role) && (
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

  return (
    <div>
      <div className="page-header">
        <Title level={2}>面试安排</Title>
        <Text type="secondary">管理招聘全流程面试：一面(HR) → 二面(BU负责人) → 终面(Jenny+黄一萧)</Text>
      </div>

      <Card>
        <div className="table-toolbar">
          <Text strong>共 {data.length} 条面试记录</Text>
          {canEdit(user!.role) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              form.resetFields();
              setModalVisible(true);
            }}>
              安排面试
            </Button>
          )}
        </div>

        {/* 面试流程说明 */}
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
          loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1000 }} />
      </Card>

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
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={resumes.map((r: any) => ({
                label: r.candidate_name,
                value: r.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="round" label="面试轮次" rules={[{ required: true }]}>
            <Select options={[
              { label: '一面(HR)', value: 'first' },
              { label: '二面(BU负责人)', value: 'second' },
              { label: '终面(Jenny+黄一萧)', value: 'final' },
            ]} />
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

      <Modal title="面试详情" open={detailVisible} onCancel={() => setDetailVisible(false)}
        footer={null} width={500}>
        {selectedRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="候选人">
              {resumes.find((r: any) => r.id === selectedRecord.resume_id)?.candidate_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="面试轮次">
              <Tag color="blue">{roundMap[selectedRecord.round as InterviewRound]}</Tag>
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
    </div>
  );
};

export default InterviewPage;
