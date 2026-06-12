import React, { useEffect, useState } from 'react';
import { Card, Checkbox, Tag, Typography, Button, Space, Input, Modal, message } from 'antd';
import { CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import supabase from '../../utils/supabase';
import { useAuthStore } from '../../stores/authStore';

const { Title, Text } = Typography;

import { useOutletContext } from 'react-router-dom';
import type { OnboardingContext } from './index';

const AdminPrep: React.FC = () => {
  const { selectedEmployeeId: employeeId } = useOutletContext<OnboardingContext>();
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 黄欢欢需要填写的员工信息
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState({
    chinese_name: '', english_name: '', onboard_date: '',
    company: '', id_card: '',
  });

  const fetchData = async () => {
    if (!employeeId) return;
    setLoading(true);
    let { data: prep } = await supabase.from('admin_preparations')
      .select('*').eq('employee_id', employeeId).maybeSingle();
    if (!prep) {
      await supabase.from('admin_preparations').insert({ employee_id: employeeId });
      const { data: newPrep } = await supabase.from('admin_preparations')
        .select('*').eq('employee_id', employeeId).maybeSingle();
      prep = newPrep;
    }
    // 获取员工信息
    const { data: emp } = await supabase.from('employees')
      .select('chinese_name,english_name,onboard_date,id_card')
      .eq('id', employeeId).maybeSingle();
    if (emp) {
      setEmployeeInfo({
        chinese_name: emp.chinese_name || '',
        english_name: emp.english_name || '',
        onboard_date: emp.onboard_date || '',
        company: '上海羿工分信息科技有限公司',
        id_card: emp.id_card || '',
      });
    }
    setData(prep);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [employeeId]);

  const updateField = async (field: string, value: any) => {
    if (!data) return;
    await supabase.from('admin_preparations').update({ [field]: value }).eq('id', data.id);
    setData({ ...data, [field]: value });
  };

  const items = [
    {
      group: '物业行政 — 程璐',
      color: '#fa8c16',
      fields: [
        { key: 'access_card_issued', label: '开设门禁卡', value: data?.access_card_issued },
        { key: 'workstation_assigned', label: `安排工位${data?.workstation_assigned ? '：' + data.workstation_assigned : ''}`, value: !!data?.workstation_assigned },
        { key: 'computer_assigned', label: `安排电脑${data?.computer_assigned ? '：' + data.computer_assigned : ''}`, value: !!data?.computer_assigned },
        { key: 'stationery_provided', label: '发放办公用品包（签字笔、记事本）', value: data?.stationery_provided },
      ],
    },
    {
      group: 'IT系统 — 黄欢欢',
      color: '#722ed1',
      fields: [
        { key: 'email_created', label: '邮箱帐户开设', value: data?.email_created },
        { key: 'hkms_account_created', label: 'HKMS系统账户权限开设', value: data?.hkms_account_created },
      ],
      extra: (
        <Button size="small" type="link" icon={<EditOutlined />} onClick={() => setInfoModalVisible(true)}
          style={{ padding: 0, marginTop: 4 }}>
          查看需提供信息
        </Button>
      ),
    },
    {
      group: '人事行政 — 黄燕婷',
      color: '#1890ff',
      fields: [
        { key: 'dingtalk_added', label: '钉钉添加员工、设置考勤组、协助首次打卡', value: data?.dingtalk_added },
        { key: 'wechat_group_added', label: '拉入微信工作群、发送迎新公告', value: data?.wechat_group_added },
      ],
      extra: (
        <span style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4, display: 'block' }}>
          迎新公告请前往「员工培训」模块编辑
        </span>
      ),
    },
  ];

  if (!employeeId) {
    return <Text type="secondary">请先在顶部选择员工</Text>;
  }

  return (
    <div>
      {items.map((group) => (
        <Card
          key={group.group}
          title={<Tag color={group.color} style={{ fontSize: 14, padding: '2px 12px' }}>{group.group}</Tag>}
          style={{ marginBottom: 12 }}
          loading={loading}
        >
          {group.fields.map((field) => (
            <div key={field.key} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Checkbox
                checked={field.value}
                onChange={(e) => updateField(field.key, e.target.checked)}
              >
                {field.label}
              </Checkbox>
              {field.value && <Tag color="success" icon={<CheckCircleOutlined />}>已完成</Tag>}
            </div>
          ))}
          {group.extra && <div style={{ marginTop: 8 }}>{group.extra}</div>}
        </Card>
      ))}

      <Modal
        title="HKMS/邮箱开设所需信息"
        open={infoModalVisible}
        onCancel={() => setInfoModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ lineHeight: 2.5 }}>
          <p><Text strong>需提供给黄欢欢的信息：</Text></p>
          <p>中文名：<Tag>{employeeInfo.chinese_name}</Tag></p>
          <p>英文名：<Tag>{employeeInfo.english_name || '（待填写）'}</Tag></p>
          <p>入职时间：<Tag>{employeeInfo.onboard_date || '（待填写）'}</Tag></p>
          <p>入职公司：<Tag>{employeeInfo.company}</Tag></p>
          <p>身份证号码：<Tag>{employeeInfo.id_card || '（待填写）'}</Tag></p>
          <p style={{ marginTop: 16, color: '#999' }}>
            请确认以上信息无误后提供给黄欢欢，用于开设邮箱和HKMS系统账户。
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPrep;
