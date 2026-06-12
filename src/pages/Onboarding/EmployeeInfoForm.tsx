import React, { useEffect, useState } from 'react';
import {
  Card, Form, Input, Select, DatePicker, Button, message, Radio, Divider,
  Typography, Row, Col, Upload, InputNumber, Cascader,
} from 'antd';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import supabase from '../../utils/supabase';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Props {
  employeeId?: string;
}

// 省市区数据（主要城市）
const regionOptions = [
  {
    value: '上海市', label: '上海市',
    children: [
      { value: '浦东新区', label: '浦东新区' }, { value: '黄浦区', label: '黄浦区' },
      { value: '徐汇区', label: '徐汇区' }, { value: '长宁区', label: '长宁区' },
      { value: '静安区', label: '静安区' }, { value: '普陀区', label: '普陀区' },
      { value: '虹口区', label: '虹口区' }, { value: '杨浦区', label: '杨浦区' },
      { value: '闵行区', label: '闵行区' }, { value: '宝山区', label: '宝山区' },
      { value: '嘉定区', label: '嘉定区' }, { value: '松江区', label: '松江区' },
      { value: '青浦区', label: '青浦区' }, { value: '奉贤区', label: '奉贤区' },
      { value: '金山区', label: '金山区' }, { value: '崇明区', label: '崇明区' },
    ],
  },
  {
    value: '北京市', label: '北京市',
    children: [
      { value: '朝阳区', label: '朝阳区' }, { value: '海淀区', label: '海淀区' },
      { value: '东城区', label: '东城区' }, { value: '西城区', label: '西城区' },
      { value: '丰台区', label: '丰台区' }, { value: '通州区', label: '通州区' },
    ],
  },
  {
    value: '江苏省', label: '江苏省',
    children: [
      { value: '南京市', label: '南京市' }, { value: '苏州市', label: '苏州市' },
      { value: '无锡市', label: '无锡市' }, { value: '常州市', label: '常州市' },
      { value: '南通市', label: '南通市' }, { value: '扬州市', label: '扬州市' },
      { value: '镇江市', label: '镇江市' }, { value: '泰州市', label: '泰州市' },
    ],
  },
  {
    value: '浙江省', label: '浙江省',
    children: [
      { value: '杭州市', label: '杭州市' }, { value: '宁波市', label: '宁波市' },
      { value: '温州市', label: '温州市' }, { value: '嘉兴市', label: '嘉兴市' },
      { value: '湖州市', label: '湖州市' }, { value: '绍兴市', label: '绍兴市' },
      { value: '金华市', label: '金华市' }, { value: '台州市', label: '台州市' },
    ],
  },
  {
    value: '广东省', label: '广东省',
    children: [
      { value: '广州市', label: '广州市' }, { value: '深圳市', label: '深圳市' },
      { value: '东莞市', label: '东莞市' }, { value: '佛山市', label: '佛山市' },
      { value: '珠海市', label: '珠海市' }, { value: '惠州市', label: '惠州市' },
    ],
  },
];

// 民族列表
const nationOptions = [
  '汉族', '回族', '满族', '蒙古族', '藏族', '维吾尔族',
  '苗族', '彝族', '壮族', '布依族', '朝鲜族', '侗族',
  '瑶族', '白族', '土家族', '哈尼族', '哈萨克族', '傣族',
  '黎族', '傈僳族', '畲族', '高山族', '其他',
];

// 学历选项
const educationOptions = ['博士', '硕士', '本科', '大专', '中专', '高中', '初中及以下'];

// 婚姻状况
const maritalOptions = ['未婚', '已婚', '离异', '丧偶'];

// 子女状况
const childrenOptions = ['无子女', '1个', '2个', '3个及以上'];

// 政治面貌
const politicalOptions = ['群众', '中共党员', '共青团员', '民主党派', '无党派人士'];

// 就业状态
const employmentStatusOptions = ['在职', '离职', '应届毕业生', '自由职业', '其他'];

// 社保状况
const socialInsuranceOptions = ['新参', '已缴纳-在职', '已缴纳-暂停', '未缴纳', '退休人员'];

// 户口性质
const householdOptions = [
  { label: '城镇', value: '城镇' },
  { label: '农村', value: '农村' },
];

// 性别
const genderOptions = [
  { label: '男', value: '男' },
  { label: '女', value: '女' },
];

// 员工类型
const employeeTypeOptions = [
  { label: '全职', value: 'full_time' },
  { label: '实习', value: 'intern' },
  { label: '劳务', value: 'labor' },
  { label: '外包', value: 'outsource' },
];

// 职级
const gradeOptions = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'];

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
      // 将日期字符串转为 dayjs，将 household_address 解析为省市区级联
      const householdParts = data.birth_place
        ? data.birth_place.replace(/省|市/g, (m: string) => m + ',').split(',').filter(Boolean)
        : undefined;
      form.setFieldsValue({
        ...data,
        birthday: data.birthday ? dayjs(data.birthday) : null,
        first_work_date: data.first_work_date ? dayjs(data.first_work_date) : null,
        graduation_date: data.graduation_date ? dayjs(data.graduation_date) : null,
        onboard_date: data.onboard_date ? dayjs(data.onboard_date) : null,
        contract_start: data.contract_start ? dayjs(data.contract_start) : null,
        contract_end: data.contract_end ? dayjs(data.contract_end) : null,
        probation_end: data.probation_end ? dayjs(data.probation_end) : null,
        birth_place: householdParts,
        declarations: data.declarations || {},
      });
    }
  };

  const handleSubmit = async (values: any) => {
    if (!employeeId) return;
    setLoading(true);

    // 将省市区级联值拼成字符串
    const birthPlaceStr = Array.isArray(values.birth_place)
      ? values.birth_place.join('')
      : values.birth_place;

    const payload = {
      ...values,
      birth_place: birthPlaceStr,
      birthday: values.birthday?.format('YYYY-MM-DD'),
      first_work_date: values.first_work_date?.format('YYYY-MM-DD'),
      graduation_date: values.graduation_date?.format('YYYY-MM-DD'),
      onboard_date: values.onboard_date?.format('YYYY-MM-DD'),
      contract_start: values.contract_start?.format('YYYY-MM-DD'),
      contract_end: values.contract_end?.format('YYYY-MM-DD'),
      probation_end: values.probation_end?.format('YYYY-MM-DD'),
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
      initialValues={{
        gender: '男',
        household_type: '城镇',
        marital_status: '未婚',
        political_status: '群众',
        nation: '汉族',
        employee_type: 'full_time',
        social_insurance_status: '新参',
        children_status: '无子女',
        prev_employment_status: '应届毕业生',
      }}>
      {/* ============================================================ */}
      {/* 一、员工基础信息 */}
      {/* ============================================================ */}
      <Card title={<Title level={5}>一、员工基础信息</Title>} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 0]}>
          <Col span={8}>
            <Form.Item name="chinese_name" label="姓名" rules={[{ required: true, message: '必填' }]}>
              <Input placeholder="请输入中文姓名" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="english_name" label="英文名">
              <Input placeholder="如：Li Ming" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="gender" label="性别" rules={[{ required: true, message: '必填' }]}>
              <Select options={genderOptions} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="birthday" label="出生日期" rules={[{ required: true, message: '必填' }]}>
              <DatePicker style={{ width: '100%' }} placeholder="请选择出生日期" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="birth_place" label="出生地" rules={[{ required: true, message: '必填' }]}>
              <Cascader
                options={regionOptions}
                placeholder="请选择省/市/区"
                changeOnSelect
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="nation" label="民族" rules={[{ required: true, message: '必填' }]}>
              <Select
                showSearch
                options={nationOptions.map(v => ({ label: v, value: v }))}
                placeholder="请选择民族"
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="political_status" label="政治面貌">
              <Select options={politicalOptions.map(v => ({ label: v, value: v }))} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="highest_education" label="文化程度" rules={[{ required: true, message: '必填' }]}>
              <Select options={educationOptions.map(v => ({ label: v, value: v }))} placeholder="请选择学历" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="household_type" label="户口性质">
              <Select options={householdOptions} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="id_card" label="身份证号码" rules={[
              { required: true, message: '必填' },
              { pattern: /^\d{17}[\dXx]$/, message: '身份证号码格式不正确' },
            ]}>
              <Input maxLength={18} placeholder="18位身份证号码" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="phone" label="联系电话" rules={[
              { required: true, message: '必填' },
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
            ]}>
              <Input maxLength={11} placeholder="11位手机号码" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="email" label="邮箱" rules={[
              { type: 'email', message: '邮箱格式不正确' },
            ]}>
              <Input placeholder="如：name@china-key.com" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="household_address" label="户口所在地址" rules={[{ required: true, message: '必填' }]}>
              <Input placeholder="详细到门牌号" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="living_address" label="现居地址" rules={[{ required: true, message: '必填' }]}>
              <Input placeholder="详细到门牌号" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* ============================================================ */}
      {/* 二、工作信息 */}
      {/* ============================================================ */}
      <Card title={<Title level={5}>二、工作信息</Title>} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 0]}>
          <Col span={8}>
            <Form.Item name="employee_type" label="员工类型">
              <Select options={employeeTypeOptions} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="position_name" label="岗位名称">
              <Input placeholder="如：Java开发实习生" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="grade" label="职级">
              <Select options={gradeOptions.map(v => ({ label: v, value: v }))} placeholder="请选择职级" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="onboard_date" label="入职日期">
              <DatePicker style={{ width: '100%' }} placeholder="请选择入职日期" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="contract_start" label="合同起始日期">
              <DatePicker style={{ width: '100%' }} placeholder="合同开始日期" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="contract_end" label="合同终止日期">
              <DatePicker style={{ width: '100%' }} placeholder="合同结束日期" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="probation_end" label="试用期截止日">
              <DatePicker style={{ width: '100%' }} placeholder="试用期结束日期" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="monthly_salary" label="月薪（元）">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={999999}
                precision={2}
                placeholder="如：12000.00"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value?.replace(/,/g, '') as any}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="bank_name" label="开户银行">
              <Select
                showSearch
                options={[
                  '工商银行', '建设银行', '农业银行', '中国银行', '交通银行',
                  '招商银行', '浦发银行', '兴业银行', '民生银行', '光大银行',
                  '平安银行', '中信银行', '华夏银行', '广发银行', '邮储银行',
                  '上海银行', '上海农商银行',
                ].map(v => ({ label: v, value: v }))}
                placeholder="请选择开户行"
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="bank_account" label="银行卡号" rules={[
              { pattern: /^\d{16,19}$/, message: '银行卡号格式不正确' },
            ]}>
              <Input maxLength={19} placeholder="16-19位银行卡号" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="social_insurance_status" label="社会保险状况">
              <Select options={socialInsuranceOptions.map(v => ({ label: v, value: v }))} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="commercial_insurance" label="商业保险" valuePropName="checked">
              <Select options={[
                { label: '是（已参保）', value: true },
                { label: '否（未参保）', value: false },
              ]} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* ============================================================ */}
      {/* 三、个人现状信息 */}
      {/* ============================================================ */}
      <Card title={<Title level={5}>三、个人现状信息</Title>} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 0]}>
          <Col span={8}>
            <Form.Item name="first_work_date" label="首次参加工作时间">
              <DatePicker style={{ width: '100%' }} placeholder="请选择日期" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="marital_status" label="婚姻状况" rules={[{ required: true, message: '必填' }]}>
              <Select options={maritalOptions.map(v => ({ label: v, value: v }))} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="children_status" label="子女状况" rules={[{ required: true, message: '必填' }]}>
              <Select options={childrenOptions.map(v => ({ label: v, value: v }))} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="family_info" label="家庭情况（直属）">
              <Input placeholder="如：父母、配偶、子女等" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="prev_employment_status" label="前期就业状态">
              <Select options={employmentStatusOptions.map(v => ({ label: v, value: v }))} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="archive_location" label="档案所在地">
              <Input placeholder="如：XX人才市场" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="graduate_school" label="毕业院校">
              <Input placeholder="学校全称" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="graduation_date" label="毕业时间">
              <DatePicker style={{ width: '100%' }} placeholder="请选择毕业时间" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="major" label="专业">
              <Input placeholder="所学专业全称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="technical_skills" label="技术特长">
              <Input placeholder="如：Java, Python, SQL" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item name="work_history" label="工作履历">
              <TextArea rows={3} placeholder="请按时间顺序填写过往工作经历，格式：YYYY.MM-YYYY.MM 公司名 职位" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="emergency_contact_name" label="紧急联系人">
              <Input placeholder="姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="emergency_contact_phone" label="紧急联系人电话" rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
            ]}>
              <Input maxLength={11} placeholder="11位手机号码" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* ============================================================ */}
      {/* 四、个人声明确认 */}
      {/* ============================================================ */}
      <Card title={<Title level={5}>四、个人声明确认</Title>} style={{ marginBottom: 16 }}>
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

      {/* ============================================================ */}
      {/* 五、需收取材料（上传） */}
      {/* ============================================================ */}
      <Card title={<Title level={5}>五、需收取材料（上传）</Title>} style={{ marginBottom: 16 }}>
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
