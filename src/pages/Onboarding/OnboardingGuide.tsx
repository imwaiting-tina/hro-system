import React, { useEffect, useState } from 'react';
import { Card, Checkbox, Tag, Typography, message, Button, Space, Progress } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import supabase from '../../utils/supabase';
import type { OnboardingGuideStatus } from '../../types';

const { Title, Text } = Typography;

// 预设13项引导任务
const DEFAULT_GUIDE_TASKS = [
  { task_name: '发送录用通知书', executor_name: '黄燕婷', task_category: '文件准备', sort_order: 1 },
  { task_name: '沟通跟踪动态，保证到岗', executor_name: '黄燕婷', task_category: '沟通协调', sort_order: 2 },
  { task_name: '安排座位', executor_name: '汪顺', task_category: '行政安排', sort_order: 3 },
  { task_name: '安排电脑', executor_name: '汪顺', task_category: '行政安排', sort_order: 4 },
  { task_name: '邮箱帐户开设、HKMS系统账户权限开设', executor_name: '黄欢欢', task_category: '系统设置', sort_order: 5 },
  { task_name: '准备并发放办公用品包（签字笔、记事本）', executor_name: '程璐', task_category: '行政安排', sort_order: 6 },
  { task_name: '设置门卡门禁', executor_name: '王力', task_category: '行政安排', sort_order: 7 },
  { task_name: '收取相关材料并进行原件验证', executor_name: '黄燕婷', task_category: '文件准备', sort_order: 8 },
  { task_name: '带领员工参观公司办公场所', executor_name: '黄燕婷', task_category: '沟通协调', sort_order: 9 },
  { task_name: '介绍公司同事姓名、职务', executor_name: '黄燕婷', task_category: '沟通协调', sort_order: 10 },
  { task_name: '中午带领新员工午餐吃饭', executor_name: '黄燕婷', task_category: '沟通协调', sort_order: 11 },
  { task_name: '加入微信群并跟进更名事宜', executor_name: '黄燕婷', task_category: '系统设置', sort_order: 12 },
  { task_name: '加入钉钉，设置考勤组', executor_name: '黄燕婷', task_category: '系统设置', sort_order: 13 },
  { task_name: '签订劳动合同/录用通知书/员工登记表/员工手册等', executor_name: '黄燕婷', task_category: '文件准备', sort_order: 14 },
  { task_name: '办理用工、商保、社保以及公积金', executor_name: '社保部', task_category: '文件准备', sort_order: 15 },
  { task_name: '员工培训', executor_name: '黄燕婷', task_category: '培训', sort_order: 16 },
];

const statusConfig: Record<OnboardingGuideStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待执行', color: 'default', icon: <ClockCircleOutlined /> },
  in_progress: { label: '进行中', color: 'processing', icon: <ClockCircleOutlined /> },
  completed: { label: '已完成', color: 'success', icon: <CheckCircleOutlined /> },
};

// 执行人分组颜色
const executorColors: Record<string, string> = {
  '黄燕婷': '#1890ff',
  '汪顺': '#52c41a',
  '黄欢欢': '#722ed1',
  '程璐': '#fa8c16',
  '王力': '#eb2f96',
  '社保部': '#13c2c2',
};

import { useOutletContext } from 'react-router-dom';
import type { OnboardingContext } from './index';

const OnboardingGuide: React.FC = () => {
  const { selectedEmployeeId: employeeId } = useOutletContext<OnboardingContext>();
  const user = useAuthStore((s) => s.user);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    if (!employeeId) return;
    setLoading(true);
    const { data } = await supabase.from('onboarding_guide_tasks')
      .select('*').eq('employee_id', employeeId).order('sort_order');
    setLoading(false);

    if (data && data.length > 0) {
      setTasks(data);
    } else {
      // 自动初始化引导任务
      await initTasks();
    }
  };

  const initTasks = async () => {
    if (!employeeId || !user) return;
    const inserts = DEFAULT_GUIDE_TASKS.map((t) => ({
      employee_id: employeeId,
      task_name: t.task_name,
      executor_name: t.executor_name,
      task_category: t.task_category,
      sort_order: t.sort_order,
      status: 'pending',
    }));
    await supabase.from('onboarding_guide_tasks').insert(inserts);
    const { data } = await supabase.from('onboarding_guide_tasks')
      .select('*').eq('employee_id', employeeId).order('sort_order');
    if (data) setTasks(data);
  };

  useEffect(() => { fetchTasks(); }, [employeeId]);

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus: OnboardingGuideStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await supabase.from('onboarding_guide_tasks').update({
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      completed_by: newStatus === 'completed' ? user?.id : null,
    }).eq('id', taskId);
    fetchTasks();
  };

  // 按执行人分组
  const grouped = tasks.reduce((acc: Record<string, any[]>, task: any) => {
    const key = task.executor_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  const completedCount = tasks.filter((t: any) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (!employeeId) {
    return <Text type="secondary">请先在顶部选择员工</Text>;
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Title level={5} style={{ margin: 0 }}>入职引导任务</Title>
            <Text type="secondary">共 {totalCount} 项任务，已完成 {completedCount} 项</Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchTasks}>刷新</Button>
        </Space>
        <Progress percent={progress} style={{ marginTop: 12 }} status={progress === 100 ? 'success' : 'active'} />
      </Card>

      {Object.entries(grouped).map(([executor, items]) => (
        <Card
          key={executor}
          title={
            <Space>
              <Tag color={executorColors[executor] || 'blue'}>{executor}</Tag>
              <Text type="secondary">
                {items.filter((t: any) => t.status === 'completed').length}/{items.length} 完成
              </Text>
            </Space>
          }
          style={{ marginBottom: 12 }}
        >
          {items.map((task: any) => (
            <div key={task.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 0', borderBottom: '1px solid #f0f0f0',
            }}>
              <Checkbox
                checked={task.status === 'completed'}
                onChange={() => toggleTask(task.id, task.status)}
              >
                <span style={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: task.status === 'completed' ? '#999' : '#333' }}>
                  {task.task_name}
                </span>
              </Checkbox>
              <Space>
                {task.status !== 'pending' && (
                  <Tag color={statusConfig[task.status as OnboardingGuideStatus]?.color}>
                    {statusConfig[task.status as OnboardingGuideStatus]?.icon}
                    <span style={{ marginLeft: 4 }}>{statusConfig[task.status as OnboardingGuideStatus]?.label}</span>
                  </Tag>
                )}
                {task.completed_at && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(task.completed_at).toLocaleDateString('zh-CN')}
                  </Text>
                )}
              </Space>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
};

export default OnboardingGuide;
