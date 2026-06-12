import React, { useEffect, useState } from 'react';
import {
  Form, Input, Button, Card, Typography, Space, message, Upload,
} from 'antd';
import { UploadOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import supabase from '../../utils/supabase';
import WelcomeCard from './WelcomeCard';
import type { OnboardingContext } from './index';

const { Title, Text } = Typography;

const WelcomeAnnouncement: React.FC = () => {
  const { selectedEmployeeId, selectedEmployee, announcementData, onAnnouncementChange, saveAnnouncement } =
    useOutletContext<OnboardingContext>();
  const [previewData, setPreviewData] = useState<any>(announcementData);

  useEffect(() => {
    setPreviewData(announcementData);
  }, [announcementData]);

  const handleFieldChange = (field: string, value: string) => {
    const updated = { ...announcementData, [field]: value };
    onAnnouncementChange(updated);
    setPreviewData(updated);
  };

  const handleSave = async () => {
    await saveAnnouncement();
  };

  const handlePublish = async () => {
    if (!selectedEmployeeId) return;
    await saveAnnouncement();
    await supabase.from('welcome_announcements')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('employee_id', selectedEmployeeId);
    message.success('迎新公告已发布！');
  };

  if (!selectedEmployeeId) {
    return (
      <Card>
        <Text type="secondary">请先在上方选择一名员工，再编辑迎新公告。</Text>
      </Card>
    );
  }

  return (
    <div>
      <div className="page-header">
        <Title level={2}>迎新公告</Title>
        <Text type="secondary">为新员工生成欢迎卡片，可发布到公司群或邮件</Text>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* 左侧：编辑表单 */}
        <Card title="编辑公告内容" style={{ flex: 1, minWidth: 320 }}>
          <Form layout="vertical">
            <Form.Item label="姓名">
              <Input
                value={announcementData.display_name}
                onChange={(e) => handleFieldChange('display_name', e.target.value)}
                placeholder="新员工姓名"
              />
            </Form.Item>
            <Form.Item label="部门">
              <Input
                value={announcementData.department_name}
                onChange={(e) => handleFieldChange('department_name', e.target.value)}
                placeholder="如：技术部"
              />
            </Form.Item>
            <Form.Item label="岗位">
              <Input
                value={announcementData.position_title}
                onChange={(e) => handleFieldChange('position_title', e.target.value)}
                placeholder="如：Java开发工程师"
              />
            </Form.Item>
            <Form.Item label="入职日期">
              <Input
                value={announcementData.onboard_date}
                onChange={(e) => handleFieldChange('onboard_date', e.target.value)}
                placeholder="如：2026-06-15"
              />
            </Form.Item>
            <Form.Item label="学历背景">
              <Input
                value={announcementData.education_bg}
                onChange={(e) => handleFieldChange('education_bg', e.target.value)}
                placeholder="如：复旦大学 计算机科学与技术 本科"
              />
            </Form.Item>
            <Form.Item label="个人简介/一句话介绍">
              <Input.TextArea
                value={announcementData.self_intro}
                onChange={(e) => handleFieldChange('self_intro', e.target.value)}
                placeholder="如：热爱技术，喜欢骑行和摄影"
                rows={3}
              />
            </Form.Item>
            <Form.Item label="头像">
              <Input
                value={announcementData.avatar_url}
                onChange={(e) => handleFieldChange('avatar_url', e.target.value)}
                placeholder="头像图片URL"
              />
            </Form.Item>

            <Space>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                保存草稿
              </Button>
              <Button icon={<SendOutlined />} onClick={handlePublish}>
                发布公告
              </Button>
            </Space>
          </Form>
        </Card>

        {/* 右侧：预览卡片 */}
        <div style={{ flex: '0 0 auto', paddingTop: 48 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>预览效果：</Text>
          <WelcomeCard data={previewData} />
        </div>
      </div>
    </div>
  );
};

export default WelcomeAnnouncement;
