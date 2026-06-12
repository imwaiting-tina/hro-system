import React, { useEffect, useState } from 'react';
import {
  Card, Form, Input, Select, DatePicker, Button, message, Radio, Divider,
  Typography, Row, Col, Upload,
} from 'antd';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import supabase from '../../utils/supabase';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Props {
  employeeId?: string;
}

const EmployeeInfoForm: React.FC<Props> = ({ employeeId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    if (!employeeId) return;
    fetchEmployee();
  }, [employeeId]);

  const fetchEmployee = async () => {
    const { data } = await supabase.from('employees').select('*').eq('id', employeeId).maybeSingle();
    if (data) {
      setEmployee(data);
      form.setFieldsValue({
        ...data,
        birthday: data.birthday ? dayjs(data.birthday) : null,
        first_work_date: data.first_work_date ? dayjs(data.first_work_date) : null,
        graduation_date: data.graduation_date ? dayjs(data.graduation_date) : null,
        declarations: data.declarations || {},
      });
    }
  };

  const handleSubmit = async (values: any) => {
    if (!employeeId) return;
    setLoading(true);
    const payload = {
      ...values,
      birthday: values.birthday?.format('YYYY-MM-DD'),
      first_work_date: values.first_work_date?.format('YYYY-MM-DD'),
      graduation_date: values.graduation_date?.format('YYYY-MM-DD'),
      info_form_completed: true,
      info_form_completed_at: new Date().toISOString(),
    };
    await supabase.from('employees').update(payload).eq('id', employeeId);
    message.success('员工信息登记表已保存');
    setLoading(false);
  };

  if (!employeeId) {
    return <Text type="secondary">请先在顶部选择员工</Text>;
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}
      initialValues={{ gender: '男', household_type: '城镇', marital_status: '未婚', political_status: '群众' }}>
      <Card title={<Title level={5}>一、员工基础信息</Title>} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 0]}>
          <Col span={8}>
            <Form.Item name="chinese_name" label="姓名" rules={[{ required: true, message: '必填' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
              <Select options={[{ label: '男', value: '男' }, { label: '女', value: '女' }]} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="birthday" label="出生年月" rules={[{ required: true, message: '必填' }]}>
              <DatePicker picker="month" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="birth_place" label="出生地" rules={[{ required: true, message: '必填' }]}>
              <Input placeholder="如：上海市" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="nation" label="民族" rules={[{ required: true, message: '必填' }]}>
              <Select options={['汉族', '回族', '满族', '蒙古族', '藏族', '维吾尔族', '苗族', '彝族', '壮族', '其他'].map(v => ({ label: v, value: v }))} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="political_status" label="政治面貌">
              <Select options={['群众', '中共党员', '共青团员', '民主党派', '无党派人士'].map(v => ({ label: v, value: v }))} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="highest_education" label="文化程度" rules={[{ required: true, message: '必填' }]}>
              <Select options={['博士', '硕士', '本科', '大专', '中专', '高中', '初中及以下'].map(v => ({ label: v, value: v }))} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="household_type" label="户口性质">
              <Select options={[{ label: '城镇', value: '城镇' }, { label: '农村', value: '农村' }]} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="id_card" label="身份证号码" rules={[{ required: true, message: '必填' }]}>
              <Input maxLength={18} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="household_address" label="户口所在地址" rules={[{ required: true, message: '必填' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="living_address" label="现居地址" rules={[{ required: true, message: '必填' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '必填' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '必填' }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title={<Title level={5}>二、个人现状信息</Title>} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 0]}>
          <Col span={8}>
            <Form.Item name="first_work_date" label="首次参加工作时间">
              <DatePicker picker="month" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="marital_status" label="婚姻状况" rules={[{ required: true, message: '必填' }]}>
              <Select options={['未婚', '已婚', '离异', '丧偶'].map(v => ({ label: v, value: v }))} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="children_status" label="子女状况" rules={[{ required: true, message: '必填' }]}>
              <Select options={['无子女', '1个', '2个', '3个及以上'].map(v => ({ label: v, value: v }))} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="family_info" label="家庭情况（直属）">
              <Input placeholder="如：父母、配偶、子女等" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="prev_employment_status" label="前期就业状态">
              <Select options={['在职', '离职', '应届毕业生', '自由职业', '其他'].map(v => ({ label: v, value: v }))} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="social_insurance_status" label="社会保险状况">
              <Input placeholder="如：已缴纳/未缴纳" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="archive_location" label="档案所在地">
              <Input placeholder="如：XX人才市场" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="graduate_school" label="毕业院校">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="graduation_date" label="毕业时间">
              <DatePicker picker="month" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="major" label="专业">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="work_history" label="工作履历">
              <TextArea rows={3} placeholder="请按时间顺序填写过往工作经历" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="technical_skills" label="技术特长">
              <TextArea rows={2} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title={<Title level={5}>三、个人声明确认</Title>} style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          请用"是"或"否"回答下列问题：
        </Text>

        <Form.Item name={['declarations', 'q1_infectious']} label="1. 是否有传染病、精神病及任何慢性病史？">
          <Radio.Group>
            <Radio value={true}>是</Radio>
            <Radio value={false}>否</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name={['declarations', 'q2_noncompete']} label='2. 是否与其它公司签订过"竞业禁止"协议？'>
          <Radio.Group>
            <Radio value={true}>是</Radio>
            <Radio value={false}>否</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name={['declarations', 'q3_misconduct']} label="3. 是否曾因个人行为不检而被其它公司解雇？">
          <Radio.Group>
            <Radio value={true}>是</Radio>
            <Radio value={false}>否</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name={['declarations', 'q4_shift_work']} label="4. 是否愿意接受轮班工作？">
          <Radio.Group>
            <Radio value={true}>是</Radio>
            <Radio value={false}>否</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name={['declarations', 'q5_rules_accept']} label="5. 是否愿意接受我公司及派至公司一切规章制度？">
          <Radio.Group>
            <Radio value={true}>是</Radio>
            <Radio value={false}>否</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name={['declarations', 'q6_other_employment']} label="6. 是否与其他单位存在劳动关系？（请出具相关证明）">
          <Radio.Group>
            <Radio value={true}>是</Radio>
            <Radio value={false}>否</Radio>
          </Radio.Group>
        </Form.Item>
      </Card>

      <Card title={<Title level={5}>四、需收取材料（上传）</Title>} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 8]}>
          <Col span={12}>
            <Upload><Button icon={<UploadOutlined />}>身份证复印件（正反面）</Button></Upload>
          </Col>
          <Col span={12}>
            <Upload><Button icon={<UploadOutlined />}>银行卡复印件（正反面）</Button></Upload>
          </Col>
          <Col span={12}>
            <Upload><Button icon={<UploadOutlined />}>户口本复印件（户主页+本人页）</Button></Upload>
          </Col>
          <Col span={12}>
            <Upload><Button icon={<UploadOutlined />}>学历证明复印件</Button></Upload>
          </Col>
          <Col span={12}>
            <Upload><Button icon={<UploadOutlined />}>一个月内体检报告</Button></Upload>
          </Col>
          <Col span={12}>
            <Upload><Button icon={<UploadOutlined />}>其它证明材料</Button></Upload>
          </Col>
        </Row>
        <Text type="secondary">执行人：黄燕婷 — 收取相关材料并进行原件验证</Text>
      </Card>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Button type="primary" size="large" icon={<SaveOutlined />}
          loading={loading} onClick={() => form.submit()}>
          提交信息登记表
        </Button>
      </div>
    </Form>
  );
};

export default EmployeeInfoForm;
