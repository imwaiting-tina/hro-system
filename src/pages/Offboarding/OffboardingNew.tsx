import React, { useEffect, useState } from 'react';
import {
  Form, Select, DatePicker, Input, Button, Card, Typography, Steps, Alert, message, Result
} from 'antd';
import { SendOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import supabase from '../../utils/supabase';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const typeConfig: Record<string, string> = {
  resignation: '主动辞职',
  termination: '辞退/解雇',
  retirement: '退休',
};

const reasonCodeMap: Record<string, string> = {
  salary: '薪酬待遇',
  career_growth: '职业发展',
  environment: '工作环境',
  management: '管理问题',
  personal: '个人原因',
  discipline: '违纪违规',
  layoff: '裁员优化',
  other: '其他',
};

const OffboardingNewPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [form] = Form.useForm();
  const [submitted, setSubmitted] = useState(false);
  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null);
  const [existingCase, setExistingCase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 查找当前用户对应的员工记录
  useEffect(() => {
    const findEmployee = async () => {
      if (!user) return;
      try {
        // 通过email匹配employees表（分步查询避免join 400错误）
        const { data } = await supabase
          .from('employees')
          .select('id, chinese_name, employee_no, position_name')
          .eq('email', user.email)
          .limit(1);

        if (data && data.length > 0) {
          setMyEmployeeId(data[0].id);

          // 检查是否有进行中的离职单
          const { data: cases } = await supabase
            .from('offboarding_cases')
            .select('*')
            .eq('employee_id', data[0].id)
            .neq('status', 'closed')
            .order('submitted_at', { ascending: false })
            .limit(1);

          if (cases && cases.length > 0) {
            setExistingCase(cases[0]);
          }
        }
      } catch {
        // 表不存在时忽略
      }
      setLoading(false);
    };
    findEmployee();
  }, [user]);

  const handleSubmit = async (values: any) => {
    if (!myEmployeeId) {
      message.error('无法识别您的员工身份，请联系HR');
      return;
    }

    const insertData = {
      employee_id: myEmployeeId,
      initiator_type: 'employee',
      type: values.type,
      reason_code: values.reason_code,
      reason_detail: values.reason_detail,
      last_working_day: values.last_working_day?.format('YYYY-MM-DD'),
      status: 'pending',
      submitted_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('offboarding_cases').insert(insertData);
    if (error) {
      message.error('提交失败：' + error.message);
      return;
    }
    message.success('离职申请已提交，请等待HR审批');
    setSubmitted(true);
  };

  if (loading) return null;

  // 已有进行中的离职单
  if (existingCase) {
    return (
      <Card style={{ maxWidth: 600, margin: '40px auto' }}>
        <Result
          icon={<CheckCircleOutlined style={{ color: '#faad14' }} />}
          title="您已有进行中的离职流程"
          subTitle={`当前状态：${existingCase.status === 'pending' ? '待审批' : existingCase.status === 'approved' ? '已批准' : existingCase.status}`}
          extra={
            <div>
              <Paragraph type="secondary">
                最后工作日：{existingCase.last_working_day ? dayjs(existingCase.last_working_day).format('YYYY-MM-DD') : '-'}
              </Paragraph>
              <Paragraph type="secondary">
                提交时间：{existingCase.submitted_at ? dayjs(existingCase.submitted_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Paragraph>
            </div>
          }
        />
      </Card>
    );
  }

  // 提交成功
  if (submitted) {
    return (
      <Card style={{ maxWidth: 600, margin: '40px auto' }}>
        <Result
          status="success"
          title="离职申请已提交成功"
          subTitle="您的离职申请已提交，请等待HR审批。审批通过后将通知您完成工作交接。"
          extra={
            <Button type="primary" onClick={() => setSubmitted(false)}>
              查看我的离职单
            </Button>
          }
        />
      </Card>
    );
  }

  // 未找到员工身份
  if (!myEmployeeId) {
    return (
      <Card style={{ maxWidth: 600, margin: '40px auto' }}>
        <Result
          status="warning"
          title="无法识别您的员工身份"
          subTitle="请联系HR确认您的员工档案信息"
        />
      </Card>
    );
  }

  return (
    <Card style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={3}>员工离职申请</Title>
        <Text type="secondary">请仔细填写以下信息，提交后将进入审批流程</Text>
      </div>

      <Steps
        current={0}
        size="small"
        style={{ marginBottom: 32 }}
        items={[
          { title: '提交申请' },
          { title: 'HR审批' },
          { title: '工作交接' },
          { title: '离职结算' },
          { title: '流程完成' },
        ]}
      />

      <Alert
        message="温馨提示"
        description="根据《劳动合同法》规定，员工提前三十日书面通知用人单位，可以解除劳动合同。最后工作日需在提交申请30天后。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ type: 'resignation' }}
      >
        <Form.Item name="type" label="离职类型" rules={[{ required: true, message: '请选择离职类型' }]}>
          <Select
            options={[
              { label: '主动辞职', value: 'resignation' },
              { label: '辞退/解雇', value: 'termination' },
              { label: '退休', value: 'retirement' },
            ]}
          />
        </Form.Item>

        <Form.Item name="reason_code" label="离职原因" rules={[{ required: true, message: '请选择离职原因' }]}>
          <Select
            options={Object.entries(reasonCodeMap).map(([k, v]) => ({ label: v, value: k }))}
          />
        </Form.Item>

        <Form.Item name="reason_detail" label="详细说明">
          <TextArea rows={4} placeholder="请详细说明离职原因，以便公司了解并改进..." />
        </Form.Item>

        <Form.Item
          name="last_working_day"
          label="最后工作日"
          rules={[
            { required: true, message: '请选择最后工作日' },
            {
              validator: (_, value) => {
                if (value && value.isBefore(dayjs().add(30, 'day'), 'day')) {
                  return Promise.reject(new Error('最后工作日必须在提交日期30天之后'));
                }
                return Promise.resolve();
              },
            },
          ]}
          extra="根据《劳动合同法》，最后工作日需在提交申请后至少30天"
        >
          <DatePicker
            style={{ width: '100%' }}
            disabledDate={(current) => current && current < dayjs().add(30, 'day').startOf('day')}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<SendOutlined />} size="large" block>
            提交离职申请
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default OffboardingNewPage;
