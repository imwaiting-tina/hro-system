import React, { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Space, Modal, Form, Input, Select,
  DatePicker, message, Typography, Card, Upload, Descriptions, Steps, Radio,
  InputNumber, Divider,
} from 'antd';
import {
  PlusOutlined, BellOutlined, UploadOutlined, FilePdfOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../../stores/authStore';
import RecruitmentNav from '../../../components/RecruitmentNav';
import supabase from '../../../utils/supabase';
import type { ResumeStatus, InterviewRound } from '../../../types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 面试轮次定义
const roundConfig: Record<string, {
  label: string;
  resultDecider: 'tina' | 'interviewer';
  interviewerRoles: string[];
  extraInterviewers?: string[];
  pdfLabel: string; // 上传PDF的用途说明
}> = {
  first:  {
    label: '一面（人事面试）',
    resultDecider: 'tina',
    interviewerRoles: [],
    pdfLabel: '《求职申请表》第二页第一部分扫描件',
  },
  second: {
    label: '二面（用人部门面试）',
    resultDecider: 'interviewer',
    interviewerRoles: ['bu_head'],
    pdfLabel: '《求职申请表》第二页第二部分扫描件',
  },
  final:  {
    label: '终面（最高负责人面试）',
    resultDecider: 'interviewer',
    interviewerRoles: ['super_admin'],
    extraInterviewers: ['shaun'],
    pdfLabel: '',
  },
};

// 简历状态映射
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

const resultLabel: Record<string, string> = {
  passed: '推荐',
  failed: '放弃',
  cancelled: '取消',
};

// 拟录用信息字段
const hireInfoFields = [
  { key: 'hire_company', label: '录用公司', type: 'text', placeholder: '可不填，待最高负责人确认' },
  { key: 'hire_position', label: '录用岗位', type: 'text', placeholder: '实际录用的岗位名称' },
  { key: 'direct_leader', label: '直属领导', type: 'text', placeholder: '汇报上级' },
  { key: 'job_content', label: '工作内容', type: 'textarea', placeholder: '岗位职责描述' },
  { key: 'suggested_monthly_income', label: '建议每月税前收入', type: 'number', placeholder: '薪资建议' },
  { key: 'probation_income', label: '试用期税前收入', type: 'number', placeholder: '试用期薪资' },
  { key: 'welfare_items', label: '福利项目', type: 'select-multi', options: ['社会保险', '商业保险', '其他'], placeholder: '多选' },
  { key: 'start_work_date', label: '开始工作日期', type: 'date', placeholder: '预计入职日期' },
  { key: 'contract_term', label: '合同期限', type: 'text', placeholder: '劳动合同期限' },
  { key: 'probation_duration', label: '试用期时长', type: 'text', placeholder: '试用期月数' },
];

const InterviewPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [hireInfoModalVisible, setHireInfoModalVisible] = useState(false);
  const [finalApprovalModalVisible, setFinalApprovalModalVisible] = useState(false);
  const [communicationModalVisible, setCommunicationModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [form] = Form.useForm();
  const [resultForm] = Form.useForm();
  const [hireInfoForm] = Form.useForm();
  const [finalApprovalForm] = Form.useForm();
  const [communicationForm] = Form.useForm();

  const isTina = user?.username === 'tina';
  const isJenny = user?.role === 'super_admin';
  const isBuHead = user?.role === 'bu_head';

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
    if (interviews) {
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

  useEffect(() => { fetchData(); }, [modalVisible, resultModalVisible, hireInfoModalVisible, finalApprovalModalVisible, communicationModalVisible]);

  const canArrange = isTina;

  // 判断当前用户是否能填该面试的结果
  const canFillResult = (interview: any) => {
    if (!interview || (interview.result && ['passed', 'failed', 'cancelled'].includes(interview.result))) return false;
    if (interview.interviewers?.includes(user?.id)) return true;
    if (isTina && interview.round === 'first') return true;
    return false;
  };

  // 部门负责人可以填二面拟录用信息
  const canFillHireInfo = (interview: any) => {
    return interview?.round === 'second' && isBuHead && interview.result === 'passed' && !interview.hire_info;
  };

  // Jenny 可以做终面拟录用审批
  const canApproveHireInfo = (interview: any) => {
    return interview?.round === 'final' && isJenny && interview.result === 'passed' && interview.hire_info && !interview.hire_info_approved;
  };

  // Tina 可以安排入职前沟通
  const canArrangeCommunication = (interview: any) => {
    return isTina && interview?.round === 'final' && interview.result === 'passed' && interview.hire_info_approved && !interview.communication_arranged;
  };

  // 根据候选人已有面试记录确定可安排的轮次
  const getAvailableRounds = (resumeStatus: string, existingInterviews: any[]): InterviewRound[] => {
    const hasPassedRound = (r: string) => existingInterviews?.some((x: any) => x.round === r && x.result === 'passed');
    const hasPendingRound = (r: string) => existingInterviews?.some((x: any) => x.round === r && !x.result);
    const hasAnyRound = (r: string) => existingInterviews?.some((x: any) => x.round === r);

    if (hasPendingRound('first') || hasPendingRound('second') || hasPendingRound('final')) return [];
    if (!hasAnyRound('first')) return ['first'];
    if (hasPassedRound('first') && !hasAnyRound('second')) return ['second'];
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

  const matchInterviewers = (round: InterviewRound) => {
    let matched: string[] = [];
    if (round === 'first') {
      const tina = users.find((u: any) => u.username === 'tina');
      matched = tina ? [tina.id] : [];
    } else {
      const config = roundConfig[round];
      const roles = config?.interviewerRoles || [];
      matched = users.filter((u: any) => roles.includes(u.role)).map((u: any) => u.id);
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

    const { data: existing } = await supabase
      .from('interviews')
      .select('round,result')
      .eq('resume_id', values.resume_id);

    const hasRound = (r: string) => existing?.some((x: any) => x.round === r);
    const pendingRound = existing?.find((x: any) => !x.result)?.round;

    if (pendingRound) {
      message.warning(`该候选人还有${roundConfig[pendingRound]?.label}未进行结果评定，请先完成`);
      return;
    }

    if (round === 'second' && (!hasRound('first') || !existing?.find((x: any) => x.round === 'first' && x.result === 'passed'))) {
      message.warning('请先完成一面并推荐后再安排二面');
      return;
    }
    if (round === 'final' && (!hasRound('second') || !existing?.find((x: any) => x.round === 'second' && x.result === 'passed'))) {
      message.warning('请先完成二面并推荐后再安排终面');
      return;
    }

    if (hasRound(round)) {
      message.warning(`该候选人已完成${roundConfig[round]?.label}，不可重复安排`);
      return;
    }

    const { data: inserted, error } = await supabase.from('interviews').insert({
      resume_id: values.resume_id,
      round,
      interviewers: values.interviewers || [],
      scheduled_at: values.scheduled_at?.toISOString(),
      location: values.location || '',
      interview_method: values.interview_method || 'offline',
      meeting_link: values.meeting_link || '',
      meeting_id: values.meeting_id || '',
      feedback: values.feedback || '',
    }).select('id').single();

    if (error) {
      message.error('面试安排失败：' + error.message);
      return;
    }

    await supabase.from('resumes').update({ status: resumeStatusMap[round] })
      .eq('id', values.resume_id);

    const candidateName = resumes.find((r: any) => r.id === values.resume_id)?.candidate_name || '未知';
    if (values.interviewers?.length > 0) {
      for (const uid of values.interviewers) {
        await supabase.from('notifications').insert({
          interview_id: inserted?.id,
          user_id: uid,
          title: `新面试安排：${roundConfig[round].label}`,
          content: `候选人【${candidateName}】的${roundConfig[round].label}已安排，请准时参加。\n时间：${values.scheduled_at?.format('YYYY-MM-DD HH:mm')}\n方式：${values.interview_method === 'online' ? '线上面试（腾讯会议）' : '线下面试'}\n地点/链接：${values.interview_method === 'online' ? values.meeting_link || '待定' : values.location || '待定'}`,
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

  const openDetail = (record: any) => {
    setSelectedInterview(record);
    setDetailModalVisible(true);
  };

  const handleResultSubmit = async (values: any) => {
    if (!selectedInterview) return;
    const interview = selectedInterview;
    const resumeId = interview.resume_id;
    const round = interview.round;
    const config = roundConfig[round];
    const candidateName = resumes.find((r: any) => r.id === resumeId)?.candidate_name || '未知';

    // PDF文件引用
    let pdfUrl = values.pdf_url || '';

    // 如果上传了文件
    if (values.pdf_file?.fileList?.[0]?.originFileObj) {
      const file = values.pdf_file.fileList[0].originFileObj;
      const fileName = `interview-pdfs/${interview.id}-${round}-${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('interview-files')
        .upload(fileName, file);
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('interview-files')
          .getPublicUrl(fileName);
        pdfUrl = urlData?.publicUrl || '';
      }
    }

    // 更新面试记录
    await supabase.from('interviews').update({
      result: values.result,
      pdf_url: pdfUrl,
      result_note: values.result === 'passed' ? '推荐' : '放弃',
    }).eq('id', interview.id);

    // 如果一面推荐，自动触发二面安排流程
    if (round === 'first' && values.result === 'passed') {
      message.success('一面结果：推荐。系统已记录，请安排二面');
    }

    // 如果二面推荐，提示填写拟录用信息
    if (round === 'second' && values.result === 'passed') {
      await supabase.from('resumes').update({ status: 'interviewing_final' }).eq('id', resumeId);
      message.success('二面结果：推荐。请填写拟录用信息');
      setResultModalVisible(false);
      // 打开拟录用信息弹窗
      hireInfoForm.resetFields();
      setSelectedInterview({ ...interview, result: 'passed' });
      setHireInfoModalVisible(true);
      fetchData();
      return;
    }

    // 如果终面推荐，自动弹出拟录用信息审批弹窗（仅Jenny可操作）
    if (round === 'final' && values.result === 'passed') {
      setResultModalVisible(false);
      // 重新查询面试记录，获取二面填写的拟录用信息
      const { data: freshData } = await supabase.from('interviews').select('*').eq('id', interview.id).single();
      if (freshData?.hire_info) {
        finalApprovalForm.setFieldsValue(freshData.hire_info);
      } else {
        finalApprovalForm.resetFields();
        message.warning('未找到二面填写的拟录用信息，请先确认二面部门负责人已填写');
      }
      setSelectedInterview(freshData || { ...interview, result: 'passed' });
      setFinalApprovalModalVisible(true);
      fetchData();
      return;
    }

    // 如果放弃，更新简历状态
    if (values.result === 'failed') {
      await supabase.from('resumes').update({ status: 'rejected' }).eq('id', resumeId);
    }

    message.success(`面试结果已记录：${resultLabel[values.result]}`);
    setResultModalVisible(false);
    setSelectedInterview(null);
    resultForm.resetFields();
    fetchData();
  };

  // 提交拟录用信息
  const handleHireInfoSubmit = async (values: any) => {
    if (!selectedInterview) return;
    const { error } = await supabase.from('interviews').update({
      hire_info: values,
    }).eq('id', selectedInterview.id);

    if (error) {
      message.error('保存拟录用信息失败：' + error.message);
      return;
    }

    message.success('拟录用信息已保存，等待终面后由最高负责人审批');
    setHireInfoModalVisible(false);
    hireInfoForm.resetFields();
    setSelectedInterview(null);
    fetchData();
  };

  // Jenny 终面拟录用审批
  const handleFinalApproval = async (values: any) => {
    if (!selectedInterview) return;
    const { error } = await supabase.from('interviews').update({
      hire_info: values, // Jenny 可能修改后的信息
      hire_info_approved: true,
      hire_info_approved_at: new Date().toISOString(),
      hire_info_approved_by: user?.id,
    }).eq('id', selectedInterview.id);

    if (error) {
      message.error('审批失败：' + error.message);
      return;
    }

    message.success('拟录用信息已审批通过，可进入入职前沟通环节');
    setFinalApprovalModalVisible(false);
    finalApprovalForm.resetFields();
    setSelectedInterview(null);
    fetchData();
  };

  // 安排入职前沟通
  const handleCommunicationSubmit = async (values: any) => {
    if (!selectedInterview) return;
    const candidateName = resumes.find((r: any) => r.id === selectedInterview.resume_id)?.candidate_name || '未知';

    const { error } = await supabase.from('interviews').update({
      communication_arranged: true,
      communication_time: values.communication_time?.toISOString(),
      communication_participants: values.participants || [],
      communication_notes: values.notes || '',
    }).eq('id', selectedInterview.id);

    if (error) {
      message.error('安排沟通失败：' + error.message);
      return;
    }

    // 通知参与人
    if (values.participants?.length > 0) {
      for (const uid of values.participants) {
        await supabase.from('notifications').insert({
          interview_id: selectedInterview.id,
          user_id: uid,
          title: `入职前沟通安排：${candidateName}`,
          content: `候选人【${candidateName}】的入职前沟通已安排。\n时间：${values.communication_time?.format('YYYY-MM-DD HH:mm')}\n沟通内容：确认入职时间、薪资细节等`,
        });
      }
    }

    message.success('入职前沟通已安排，已通知参与人');
    setCommunicationModalVisible(false);
    communicationForm.resetFields();
    setSelectedInterview(null);
    fetchData();
  };

  const columns = [
    {
      title: '候选人',
      dataIndex: 'resume_id',
      width: 120,
      render: (id: string) => resumes.find((r: any) => r.id === id)?.candidate_name || id?.slice(0, 8),
    },
    {
      title: '轮次',
      dataIndex: 'round',
      width: 140,
      render: (r: string) => <Tag color="blue">{roundConfig[r]?.label || r}</Tag>,
    },
    {
      title: '面试方式',
      dataIndex: 'interview_method',
      width: 100,
      render: (m: string) => m === 'online' ? <Tag color="cyan">线上</Tag> : <Tag>线下</Tag>,
    },
    {
      title: '面试官',
      dataIndex: 'interviewers',
      width: 180,
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
      width: 150,
      render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-',
    },
    {
      title: '地点/会议',
      dataIndex: 'location',
      width: 160,
      ellipsis: true,
      render: (v: string, record: any) => {
        if (record.interview_method === 'online') {
          return record.meeting_link || record.meeting_id || '线上会议';
        }
        return v || '-';
      },
    },
    {
      title: '结果',
      dataIndex: 'result',
      width: 90,
      render: (r: string) => {
        if (!r) return <Tag color="processing">待评定</Tag>;
        return <Tag color={statusColor[r]}>{resultLabel[r] || r}</Tag>;
      },
    },
    {
      title: 'PDF附件',
      dataIndex: 'pdf_url',
      width: 80,
      render: (url: string) => url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button size="small" type="link" icon={<FilePdfOutlined />}>查看</Button>
        </a>
      ) : <Text type="secondary">-</Text>,
    },
    {
      title: '拟录用',
      width: 90,
      render: (_: any, record: any) => {
        if (record.round === 'second' && record.result === 'passed') {
          if (record.hire_info_approved) return <Tag color="success">已审批</Tag>;
          if (record.hire_info) return <Tag color="processing">待审批</Tag>;
          return <Tag color="warning">待填写</Tag>;
        }
        if (record.round === 'final' && record.result === 'passed') {
          if (record.hire_info_approved) return <Tag color="success">已审批</Tag>;
          if (record.hire_info) return <Tag color="processing">待Jenny审批</Tag>;
          return <Tag color="warning">待二面填写</Tag>;
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small" direction="vertical">
          <Space size="small">
            <Button size="small" onClick={() => openDetail(record)}>详情</Button>
            {canFillResult(record) && (
              <Button size="small" type="primary" icon={<BellOutlined />} onClick={() => openResult(record)}>
                填写结果
              </Button>
            )}
          </Space>
          {canFillHireInfo(record) && (
            <Button size="small" type="primary" onClick={() => {
              setSelectedInterview(record);
              hireInfoForm.resetFields();
              setHireInfoModalVisible(true);
            }}>
              填写拟录用信息
            </Button>
          )}
          {canApproveHireInfo(record) && (
            <Button size="small" type="primary" danger onClick={() => {
              setSelectedInterview(record);
              finalApprovalForm.setFieldsValue(record.hire_info || {});
              setFinalApprovalModalVisible(true);
            }}>
              审批拟录用信息
            </Button>
          )}
          {canArrangeCommunication(record) && (
            <Button size="small" type="primary" onClick={() => {
              setSelectedInterview(record);
              communicationForm.resetFields();
              setCommunicationModalVisible(true);
            }}>
              安排入职前沟通
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 渲染拟录用信息表单项
  const renderHireInfoField = (field: any) => {
    switch (field.type) {
      case 'textarea':
        return <TextArea rows={2} placeholder={field.placeholder} />;
      case 'number':
        return <InputNumber style={{ width: '100%' }} placeholder={field.placeholder} />;
      case 'date':
        return <DatePicker style={{ width: '100%' }} placeholder={field.placeholder} />;
      case 'select-multi':
        return (
          <Select mode="multiple" placeholder={field.placeholder}
            options={field.options?.map((o: string) => ({ label: o, value: o }))} />
        );
      default:
        return <Input placeholder={field.placeholder} />;
    }
  };

  // 详情弹窗渲染拟录用信息
  const renderHireInfoDetail = (hireInfo: any, approved: boolean) => {
    if (!hireInfo) return null;
    return (
      <Card size="small" title="拟录用信息" style={{ marginTop: 16 }}
        extra={approved ? <Tag color="success">已审批通过</Tag> : <Tag color="processing">待审批</Tag>}>
        <Descriptions column={2} size="small">
          {hireInfoFields.map((f) => (
            <Descriptions.Item key={f.key} label={f.label}>
              {hireInfo[f.key] ? String(hireInfo[f.key]) : '-'}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Card>
    );
  };

  return (
    <div>
      <RecruitmentNav />
      <div className="page-header">
        <Title level={2}>面试安排</Title>
        <Text type="secondary">
          面试流程：一面（人事面试）→ 二面（部门面试）→ 终面（Jenny终审）→ 入职前沟通 → Offer发放
        </Text>
      </div>

      {/* 面试流程说明卡片 */}
      <Card size="small" style={{ marginBottom: 16, background: '#f0f5ff', border: '1px solid #adc6ff' }}>
        <Paragraph style={{ margin: 0 }}>
          <Text strong>📋 面试流程说明</Text><br/>
          <Text type="secondary">
            1. <Text strong>一面（人事面试）</Text>：HR安排面试时间与方式（线下预约会议室 / 线上腾讯会议），面试完成后选择结果（推荐/放弃），上传《求职申请表》第二页第一部分扫描件。推荐→自动触发二面安排<br/>
            2. <Text strong>二面（用人部门面试）</Text>：部门负责人面试，选择结果（推荐/放弃），上传《求职申请表》第二页第二部分扫描件。推荐→填写拟录用信息<br/>
            3. <Text strong>终面（最高负责人面试）</Text>：Jenny及黄一萧参与，选择结果（推荐/放弃）。推荐→Jenny审批拟录用信息（可修改后确认）→进入Offer发放<br/>
            4. <Text strong>入职前沟通</Text>：终面通过后，HR发起入职前沟通，确认入职时间、薪资细节等
          </Text><br/>
          <Text type="warning" style={{ fontSize: 12 }}>
            📎 相关文件：《求职申请表》采用线下填写方式，纸质版由候选人手工填写后扫描为PDF上传。第一页为基础信息，第二页为各轮面试评价记录，第三页为建议薪资等录用信息。
          </Text>
        </Paragraph>
      </Card>

      <Card>
        <div className="table-toolbar">
          <Text strong>共 {data.length} 条面试记录</Text>
          {canArrange && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              安排面试
            </Button>
          )}
          {!canArrange && (
            <Text type="secondary">仅 HR 可安排面试；面试官可填写面试结果</Text>
          )}
        </div>

        <Table columns={columns} dataSource={data} rowKey="id"
          loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1400 }} />
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
                    r.status === 'interviewing_second' ? '一面已推荐→待二面' :
                    r.status === 'interviewing_final' ? '二面已推荐→待终面' : r.status;
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
                { label: '一面（人事面试）', value: 'first' },
                { label: '二面（用人部门面试）', value: 'second' },
                { label: '终面（最高负责人面试）', value: 'final' },
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

          <Form.Item name="interview_method" label="面试方式" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio.Button value="offline">线下面试</Radio.Button>
              <Radio.Button value="online">线上面试</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.interview_method !== cur.interview_method}
          >
            {({ getFieldValue }) => {
              const method = getFieldValue('interview_method');
              if (method === 'online') {
                return (
                  <>
                    <Form.Item name="meeting_link" label="腾讯会议链接" rules={[{ required: true, message: '请填写腾讯会议链接' }]}>
                      <Input placeholder="https://meeting.tencent.com/..." />
                    </Form.Item>
                    <Form.Item name="meeting_id" label="会议号" rules={[{ required: true, message: '请填写会议号' }]}>
                      <Input placeholder="例如：123-456-789" />
                    </Form.Item>
                  </>
                );
              }
              return (
                <Form.Item name="location" label="线下地点（会议室）" rules={[{ required: true, message: '请填写面试地点' }]}>
                  <Input placeholder="预约的会议室名称" />
                </Form.Item>
              );
            }}
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
        onOk={() => resultForm.submit()} width={650}>
        <Form form={resultForm} layout="vertical" onFinish={handleResultSubmit}>
          {selectedInterview && (
            <Card size="small" style={{ marginBottom: 16, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <Space>
                <Text strong>候选人：</Text>
                <Text>{resumes.find((r: any) => r.id === selectedInterview.resume_id)?.candidate_name || '未知'}</Text>
                <Divider type="vertical" />
                <Text strong>轮次：</Text>
                <Text>{roundConfig[selectedInterview.round]?.label}</Text>
                <Divider type="vertical" />
                <Text strong>时间：</Text>
                <Text>{selectedInterview.scheduled_at ? dayjs(selectedInterview.scheduled_at).format('YYYY-MM-DD HH:mm') : '-'}</Text>
              </Space>
            </Card>
          )}

          <Form.Item name="result" label="面试结果" rules={[{ required: true, message: '请选择面试结果' }]}>
            <Radio.Group>
              <Radio.Button value="passed"><CheckCircleOutlined /> 推荐</Radio.Button>
              <Radio.Button value="failed"><CloseCircleOutlined /> 放弃</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {/* PDF上传入口 */}
          {selectedInterview && roundConfig[selectedInterview.round]?.pdfLabel && (
            <Form.Item
              name="pdf_file"
              label={
                <span>
                  <FilePdfOutlined /> 上传{roundConfig[selectedInterview.round].pdfLabel}
                </span>
              }
              tooltip="PDF扫描件，上传后存档"
            >
              <Upload
                accept=".pdf"
                maxCount={1}
                beforeUpload={() => false}
              >
                <Button icon={<UploadOutlined />}>选择PDF文件上传</Button>
              </Upload>
            </Form.Item>
          )}

          {selectedInterview && (
            <Card size="small" style={{ background: '#fffbe6', border: '1px solid #ffe58f', marginBottom: 16 }}>
              <Text type="warning">
                {selectedInterview.round === 'first' && '提示：选择「推荐」后，系统将自动触发二面安排流程'}
                {selectedInterview.round === 'second' && '提示：选择「推荐」后，需填写拟录用信息（表3-1）'}
                {selectedInterview.round === 'final' && '提示：选择「推荐」后，最高负责人需对拟录用信息进行审批确认'}
              </Text>
            </Card>
          )}
        </Form>
      </Modal>

      {/* 拟录用信息弹窗 */}
      <Modal title="拟录用信息（表3-1）" open={hireInfoModalVisible}
        onCancel={() => { setHireInfoModalVisible(false); hireInfoForm.resetFields(); setSelectedInterview(null); }}
        onOk={() => hireInfoForm.submit()} width={800}>
        <Form form={hireInfoForm} layout="vertical" onFinish={handleHireInfoSubmit}>
          <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="候选人">
              {selectedInterview ? resumes.find((r: any) => r.id === selectedInterview.resume_id)?.candidate_name : '-'}
            </Descriptions.Item>
          </Descriptions>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {hireInfoFields.map((field) => (
              <Form.Item key={field.key} name={field.key} label={field.label}
                rules={field.key === 'hire_position' || field.key === 'start_work_date' ? [{ required: true }] : []}>
                {renderHireInfoField(field)}
              </Form.Item>
            ))}
          </div>
          <Card size="small" style={{ background: '#e6f4ff', border: '1px solid #91caff', marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              填写说明：录用公司可不填（待最高负责人确认）；福利项目为多选（社会保险、商业保险、其他）；其他字段请如实填写。终面通过后由最高负责人审批，可修改后确认。
            </Text>
          </Card>
        </Form>
      </Modal>

      {/* 终面拟录用审批弹窗 */}
      <Modal title="终面拟录用信息审批" open={finalApprovalModalVisible}
        onCancel={() => { setFinalApprovalModalVisible(false); finalApprovalForm.resetFields(); setSelectedInterview(null); }}
        onOk={() => finalApprovalForm.submit()} width={800}
        okText="审批通过" okButtonProps={{ type: 'primary' }}>
        <Card size="small" style={{ marginBottom: 16, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
          <Text>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            {' '}终面结果：推荐。请审核部门负责人填写的拟录用信息，可修改后确认。审批通过后进入Offer发放环节。
          </Text>
        </Card>
        <Form form={finalApprovalForm} layout="vertical" onFinish={handleFinalApproval}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {hireInfoFields.map((field) => (
              <Form.Item key={field.key} name={field.key} label={field.label}>
                {renderHireInfoField(field)}
              </Form.Item>
            ))}
          </div>
        </Form>
      </Modal>

      {/* 入职前沟通弹窗 */}
      <Modal title="安排入职前沟通" open={communicationModalVisible}
        onCancel={() => { setCommunicationModalVisible(false); communicationForm.resetFields(); setSelectedInterview(null); }}
        onOk={() => communicationForm.submit()} width={600}>
        <Form form={communicationForm} layout="vertical" onFinish={handleCommunicationSubmit}>
          <Card size="small" style={{ marginBottom: 16, background: '#f0f5ff', border: '1px solid #adc6ff' }}>
            <Text>
              终面已通过，拟录用信息已审批。请安排入职前沟通，通知参与人（HR和用人部门负责人）。
              <br/>沟通内容：确认入职时间、薪资细节等。
            </Text>
          </Card>
          <Form.Item name="communication_time" label="沟通时间" rules={[{ required: true, message: '请选择沟通时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="participants" label="参与人" rules={[{ required: true, message: '请选择参与人' }]}>
            <Select mode="multiple" placeholder="选择参与人（HR和用人部门负责人）"
              options={users.map((u: any) => ({
                label: `${u.display_name}（${u.department || u.role}）`,
                value: u.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="notes" label="沟通备注">
            <TextArea rows={3} placeholder="确认入职时间、薪资细节等" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal title="面试详情" open={detailModalVisible}
        onCancel={() => { setDetailModalVisible(false); setSelectedInterview(null); }}
        footer={null} width={800}>
        {selectedInterview && (
          <div>
            <Card size="small" title="面试基本信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="候选人">
                  {resumes.find((r: any) => r.id === selectedInterview.resume_id)?.candidate_name || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="轮次">
                  {roundConfig[selectedInterview.round]?.label || selectedInterview.round}
                </Descriptions.Item>
                <Descriptions.Item label="面试方式">
                  {selectedInterview.interview_method === 'online' ? '线上（腾讯会议）' : '线下面试'}
                </Descriptions.Item>
                <Descriptions.Item label="面试时间">
                  {selectedInterview.scheduled_at ? dayjs(selectedInterview.scheduled_at).format('YYYY-MM-DD HH:mm') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="面试官">
                  {(selectedInterview.interviewers || []).map((id: string) =>
                    users.find((u: any) => u.id === id)?.display_name || id.slice(0, 8)
                  ).join('、')}
                </Descriptions.Item>
                <Descriptions.Item label="地点/会议链接">
                  {selectedInterview.interview_method === 'online'
                    ? selectedInterview.meeting_link || selectedInterview.meeting_id || '-'
                    : selectedInterview.location || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="面试结果">
                  {selectedInterview.result
                    ? <Tag color={statusColor[selectedInterview.result]}>{resultLabel[selectedInterview.result]}</Tag>
                    : <Tag color="processing">待评定</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="PDF附件">
                  {selectedInterview.pdf_url
                    ? <a href={selectedInterview.pdf_url} target="_blank" rel="noopener noreferrer">
                        <Button size="small" type="link" icon={<FilePdfOutlined />}>查看PDF</Button>
                      </a>
                    : '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {selectedInterview.feedback && (
              <Card size="small" title="面试评价" style={{ marginBottom: 16 }}>
                <Paragraph>{selectedInterview.feedback}</Paragraph>
              </Card>
            )}

            {/* 面试流程进度 */}
            {selectedInterview.result && (
              <Card size="small" title="面试流程进度" style={{ marginBottom: 16 }}>
                <Steps
                  direction="vertical"
                  size="small"
                  current={
                    selectedInterview.round === 'first' ? 0 :
                    selectedInterview.round === 'second' ? 1 : 2
                  }
                  status={selectedInterview.result === 'passed' ? 'finish' : 'error'}
                  items={[
                    {
                      title: '一面（人事面试）',
                      description: 'HR面试，上传《求职申请表》第二页第一部分',
                      status: selectedInterview.round === 'first'
                        ? (selectedInterview.result === 'passed' ? 'finish' : 'error')
                        : 'finish',
                    },
                    {
                      title: '二面（用人部门面试）',
                      description: '部门负责人面试，上传《求职申请表》第二页第二部分，推荐后填写拟录用信息',
                      status: selectedInterview.round === 'second'
                        ? (selectedInterview.result === 'passed' ? 'finish' : 'error')
                        : ['final'].includes(selectedInterview.round) ? 'finish' : 'wait',
                    },
                    {
                      title: '终面（最高负责人面试）',
                      description: 'Jenny及黄一萧参与，推荐后审批拟录用信息',
                      status: selectedInterview.round === 'final'
                        ? (selectedInterview.result === 'passed' ? 'finish' : 'error')
                        : 'wait',
                    },
                    {
                      title: '入职前沟通',
                      description: '确认入职时间、薪资细节等',
                      status: selectedInterview.communication_arranged ? 'finish' : 'wait',
                    },
                  ]}
                />
              </Card>
            )}

            {/* 拟录用信息 */}
            {renderHireInfoDetail(selectedInterview.hire_info, selectedInterview.hire_info_approved)}

            {/* 入职前沟通信息 */}
            {selectedInterview.communication_arranged && (
              <Card size="small" title="入职前沟通" style={{ marginTop: 16 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="沟通时间">
                    {selectedInterview.communication_time
                      ? dayjs(selectedInterview.communication_time).format('YYYY-MM-DD HH:mm')
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="参与人">
                    {(selectedInterview.communication_participants || []).map((id: string) =>
                      users.find((u: any) => u.id === id)?.display_name || id.slice(0, 8)
                    ).join('、')}
                  </Descriptions.Item>
                  {selectedInterview.communication_notes && (
                    <Descriptions.Item label="备注">
                      {selectedInterview.communication_notes}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InterviewPage;
