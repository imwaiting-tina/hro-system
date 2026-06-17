import React, { useEffect, useState, useCallback } from 'react';
import { Select, Typography, Space, Tag, Card, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Outlet, useOutletContext } from 'react-router-dom';
import OnboardingNav from '../../components/OnboardingNav';
import supabase from '../../utils/supabase';

const { Title, Text } = Typography;

export interface OnboardingContext {
  selectedEmployeeId: string | undefined;
  selectedEmployee: any | undefined;
  employees: any[];
  announcementData: any;
  onAnnouncementChange: (data: any) => void;
  saveAnnouncement: () => Promise<void>;
}

const OnboardingPage: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>();
  const [announcementData, setAnnouncementData] = useState<any>({
    display_name: '', department_name: '', position_title: '',
    onboard_date: '', avatar_url: '', self_intro: '', education_bg: '',
  });

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

  const saveAnnouncement = useCallback(async () => {
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
  }, [selectedEmployeeId, announcementData]);

  const selectedEmployee = selectedEmployeeId
    ? employees.find((e: any) => e.id === selectedEmployeeId)
    : undefined;

  const context: OnboardingContext = {
    selectedEmployeeId,
    selectedEmployee,
    employees,
    announcementData,
    onAnnouncementChange: setAnnouncementData,
    saveAnnouncement,
  };

  return (
    <div>
      <OnboardingNav />
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
              <Tag color="blue">
                {emp.employee_type === 'full_time' ? '全日制'
                  : emp.employee_type === 'intern' ? '实习生'
                  : emp.employee_type === 'retired_rehire' ? '退休返聘'
                  : emp.employee_type === 'security' ? '保安'
                  : emp.employee_type}
              </Tag>
            ) : null;
          })()}
        </Space>
      </Card>

      {/* 子路由内容（5个模块） */}
      <Outlet context={context} />
    </div>
  );
};

export default OnboardingPage;
