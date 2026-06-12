import React, { useEffect, useState } from 'react';
import { Tabs, Select, Typography, Space, Tag, Card, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import supabase from '../../utils/supabase';
import OnboardingDocs from './OnboardingDocs';
import OnboardingGuide from './OnboardingGuide';
import AdminPrep from './AdminPrep';
import StaffTraining from './StaffTraining';
import EmployeeInfoForm from './EmployeeInfoForm';

const { Title, Text } = Typography;

const OnboardingPage: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('docs');
  const [announcementData, setAnnouncementData] = useState<any>({});

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees')
      .select('id,chinese_name,employee_no,employee_type,department_id,position_name')
      .order('created_at', { ascending: false });
    if (data) setEmployees(data);
  };

  // 选择员工时自动提取公告数据
  useEffect(() => {
    if (!selectedEmployeeId) return;
    const emp = employees.find((e: any) => e.id === selectedEmployeeId);
    if (emp) {
      setAnnouncementData({
        display_name: emp.chinese_name || '',
        department_name: '',
        position_title: emp.position_name || '',
        onboard_date: emp.onboard_date || '',
        avatar_url: '',
        self_intro: '',
        education_bg: '',
      });
    }
    // 尝试加载已有公告
    loadAnnouncement();
  }, [selectedEmployeeId]);

  const loadAnnouncement = async () => {
    if (!selectedEmployeeId) return;
    const { data } = await supabase.from('welcome_announcements')
      .select('*').eq('employee_id', selectedEmployeeId).maybeSingle();
    if (data) {
      setAnnouncementData({
        display_name: data.display_name,
        department_name: data.department_name,
        position_title: data.position_title,
        onboard_date: data.onboard_date,
        avatar_url: data.avatar_url,
        self_intro: data.self_intro,
        education_bg: data.education_bg,
      });
    }
  };

  const saveAnnouncement = async () => {
    if (!selectedEmployeeId) return;
    const { data: existing } = await supabase.from('welcome_announcements')
      .select('id').eq('employee_id', selectedEmployeeId).maybeSingle();

    if (existing) {
      await supabase.from('welcome_announcements').update(announcementData)
        .eq('id', existing.id);
    } else {
      await supabase.from('welcome_announcements').insert({
        ...announcementData,
        employee_id: selectedEmployeeId,
        status: 'draft',
      });
    }
    message.success('迎新公告已保存');
  };

  const handleTabChange = (key: string) => setActiveTab(key);

  const tabItems = [
    {
      key: 'docs',
      label: '入职文件',
      children: <OnboardingDocs employeeId={selectedEmployeeId} />,
    },
    {
      key: 'guide',
      label: '入职引导',
      children: <OnboardingGuide employeeId={selectedEmployeeId} />,
    },
    {
      key: 'admin',
      label: '行政准备',
      children: <AdminPrep
        employeeId={selectedEmployeeId}
        onJumpToAnnouncement={() => setActiveTab('training')}
      />,
    },
    {
      key: 'training',
      label: '员工培训',
      children: <StaffTraining
        employeeId={selectedEmployeeId}
        announcementData={announcementData}
        onAnnouncementChange={setAnnouncementData}
        onAnnouncementSave={saveAnnouncement}
      />,
    },
    {
      key: 'info',
      label: '信息登记',
      children: <EmployeeInfoForm employeeId={selectedEmployeeId} />,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={2}>入职管理</Title>
        <Text type="secondary">管理新员工入职全流程：文件准备、引导任务、行政安排、培训及信息登记</Text>
      </div>

      {/* 员工选择器 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <UserOutlined />
          <Text strong>选择员工：</Text>
          <Select
            showSearch
            allowClear
            placeholder="搜索员工姓名或工号"
            style={{ width: 320 }}
            value={selectedEmployeeId}
            onChange={(val) => setSelectedEmployeeId(val)}
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            options={employees.map((e: any) => ({
              label: `${e.chinese_name} (${e.employee_no})`,
              value: e.id,
            }))}
          />
          {selectedEmployeeId && (() => {
            const emp = employees.find((e: any) => e.id === selectedEmployeeId);
            return emp ? (
              <Tag color="blue">{emp.employee_type === 'full_time' ? '全日制' : emp.employee_type === 'intern' ? '实习生' : emp.employee_type === 'retired_rehire' ? '退休返聘' : emp.employee_type === 'security' ? '保安' : emp.employee_type}</Tag>
            ) : null;
          })()}
        </Space>
      </Card>

      {/* Tab页 */}
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />
    </div>
  );
};

export default OnboardingPage;
