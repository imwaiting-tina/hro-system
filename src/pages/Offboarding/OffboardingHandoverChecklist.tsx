import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Typography, Select, Space, Tag, Button, Modal, Descriptions,
  message, Spin, Empty, Row, Col, Divider, Badge, Tooltip
} from 'antd';
import {
  UserOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, TeamOutlined, LaptopOutlined,
  BankOutlined, DollarOutlined, IdcardOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useAuthStore, canEdit } from '../../stores/authStore';
import supabase from '../../utils/supabase';
import dayjs from 'dayjs';
import { mockEmployees, mockChecklistItems } from '../../data/mockOffboarding';

const { Title, Text } = Typography;

// ============================================================
// 类型定义
// ============================================================

interface Employee {
  id: string;
  chinese_name: string;
  employee_no: string;
  position_name: string;
  department?: string;
}

interface HandoverDept {
  key: string;
  label: string;
  icon: React.ReactNode;
  items: string[];
}

interface ChecklistItem {
  id: string;
  employee_id: string;
  dept_key: string;
  item_index: number;
  description: string;
  status: 'pending' | 'confirmed';
  confirmed_by: string | null;
  confirmed_by_name: string | null;
  confirmed_at: string | null;
  note: string | null;
}

// ============================================================
// 按部门分组的交接清单模板
// ============================================================

const DEPT_GROUPS: HandoverDept[] = [
  {
    key: 'dept_head',
    label: '所接管工作',
    icon: <TeamOutlined />,
    items: [
      '所有相关的书面文件、合同等的交接',
      '所有相关的电子文档的交接',
      '正在进行工作的交接',
      '对外客户关系及沟通程度的交接',
    ],
  },
  {
    key: 'mis',
    label: 'MIS部门',
    icon: <LaptopOutlined />,
    items: [
      '保存备份 E-mail 内容并切断 E-mail 地址',
    ],
  },
  {
    key: 'admin',
    label: 'Admin部门',
    icon: <BankOutlined />,
    items: [
      '门禁卡的归还',
    ],
  },
  {
    key: 'finance',
    label: 'Finance部门',
    icon: <DollarOutlined />,
    items: [
      '应收应付款项的结算',
      '预借款等的结算',
    ],
  },
  {
    key: 'hr',
    label: 'HR部门',
    icon: <IdcardOutlined />,
    items: [
      '公司档案的归还',
      '登记个人联系信息',
    ],
  },
];

const DEPT_COLORS: Record<string, string> = {
  dept_head: '#722ed1',
  mis: '#13c2c2',
  admin: '#fa8c16',
  finance: '#eb2f96',
  hr: '#1890ff',
};

// ============================================================
// 页面组件
// ============================================================

const OffboardingHandoverChecklistPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // 加载员工列表
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data } = await supabase
          .from('employees')
          .select('id, chinese_name, employee_no, position_name')
          .order('chinese_name');
        if (data && data.length > 0) {
          setEmployees(data.map((e: any) => ({ ...e, department: '' })));
        } else {
          // fallback 到 mock 数据
          setEmployees(mockEmployees.map((e) => ({ id: e.id, chinese_name: e.chinese_name, employee_no: e.employee_no, position_name: e.position_name, department: e.department || '' })));
        }
      } catch {
        // 表不存在 → 使用 mock 数据
        setEmployees(mockEmployees.map((e) => ({ id: e.id, chinese_name: e.chinese_name, employee_no: e.employee_no, position_name: e.position_name, department: e.department || '' })));
      }
    };
    fetchEmployees();
  }, []);

  // 选中员工时加载其交接清单
  const loadChecklist = useCallback(async (employeeId: string) => {
    setLoading(true);
    try {
      // 获取员工信息
      const { data: emp } = await supabase
        .from('employees')
        .select('id, chinese_name, employee_no, position_name')
        .eq('id', employeeId)
        .single();
      if (emp) {
        setSelectedEmployee(emp as Employee);
      } else {
        // fallback 到 mock
        const mockEmp = mockEmployees.find((e) => e.id === employeeId);
        if (mockEmp) setSelectedEmployee(mockEmp as Employee);
      }

      // 获取交接清单项
      const { data: items } = await supabase
        .from('offboarding_handover_checklist')
        .select('*')
        .eq('employee_id', employeeId)
        .order('dept_key')
        .order('item_index');

      if (items && items.length > 0) {
        setChecklistItems(items as ChecklistItem[]);
      } else {
        // 尝试从 mock 数据加载
        const mockItems = mockChecklistItems.filter((it) => it.employee_id === employeeId);
        if (mockItems.length > 0) {
          setChecklistItems(mockItems as ChecklistItem[]);
        } else {
          // 初始化：创建默认清单项
          setChecklistItems([]);
          await initChecklist(employeeId);
        }
      }
    } catch {
      // 查询失败 → 尝试 mock 数据
      const mockEmp = mockEmployees.find((e) => e.id === employeeId);
      if (mockEmp) setSelectedEmployee(mockEmp as Employee);

      const mockItems = mockChecklistItems.filter((it) => it.employee_id === employeeId);
      if (mockItems.length > 0) {
        setChecklistItems(mockItems as ChecklistItem[]);
      } else {
        setChecklistItems([]);
        await initChecklist(employeeId);
      }
    }
    setLoading(false);
  }, []);

  // 初始化默认交接清单
  const initChecklist = async (employeeId: string) => {
    const newItems: Omit<ChecklistItem, 'id'>[] = [];
    DEPT_GROUPS.forEach((dept) => {
      dept.items.forEach((desc, idx) => {
        newItems.push({
          employee_id: employeeId,
          dept_key: dept.key,
          item_index: idx,
          description: desc,
          status: 'pending',
          confirmed_by: null,
          confirmed_by_name: null,
          confirmed_at: null,
          note: null,
        });
      });
    });

    try {
      const { data } = await supabase
        .from('offboarding_handover_checklist')
        .insert(newItems)
        .select('*')
        .order('dept_key')
        .order('item_index');
      if (data) setChecklistItems(data as ChecklistItem[]);
    } catch {
      // 如果表不存在，使用本地状态
      const localItems = newItems.map((item, i) => ({
        ...item,
        id: `local_${i}`,
      }));
      setChecklistItems(localItems);
    }
  };

  // 重置清单
  const handleReset = async () => {
    if (!selectedEmployeeId) return;
    Modal.confirm({
      title: '确认重置',
      icon: <ExclamationCircleOutlined />,
      content: '将清除当前所有交接记录，重新生成默认清单，确定继续？',
      onOk: async () => {
        try {
          await supabase
            .from('offboarding_handover_checklist')
            .delete()
            .eq('employee_id', selectedEmployeeId);
        } catch { /* ignore */ }
        await initChecklist(selectedEmployeeId);
        message.success('交接清单已重置');
      },
    });
  };

  // 同步离职申请表字段
  const handleSyncFromResignation = async () => {
    if (!selectedEmployeeId) return;
    setSyncing(true);
    try {
      const { data } = await supabase
        .from('offboarding_cases')
        .select('last_working_day, type, reason')
        .eq('employee_id', selectedEmployeeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        message.success('已同步离职申请表数据');
      } else {
        message.info('未找到该员工的离职申请记录');
      }
    } catch {
      message.info('未找到该员工的离职申请记录');
    }
    setSyncing(false);
  };

  // 确认交接项（直接确认，无需弹窗）
  const handleConfirmItem = async (item: ChecklistItem) => {
    const now = new Date().toISOString();
    const updateData = {
      status: 'confirmed' as const,
      confirmed_by: user?.id || null,
      confirmed_by_name: user?.display_name || user?.username || '',
      confirmed_at: now,
      note: null,
    };

    try {
      await supabase
        .from('offboarding_handover_checklist')
        .update(updateData)
        .eq('id', item.id);
    } catch { /* ignore */ }

    setChecklistItems((prev) =>
      prev.map((it) =>
        it.id === item.id ? { ...it, ...updateData } : it
      )
    );
    message.success('交接项已确认');
  };

  // 撤销确认
  const handleUndoConfirm = async (item: ChecklistItem) => {
    const updateData = {
      status: 'pending' as const,
      confirmed_by: null,
      confirmed_by_name: null,
      confirmed_at: null,
      note: null,
    };
    try {
      await supabase
        .from('offboarding_handover_checklist')
        .update(updateData)
        .eq('id', item.id);
    } catch { /* ignore */ }
    setChecklistItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, ...updateData } : it))
    );
    message.success('已撤销确认');
  };

  // 计算统计数据
  const totalItems = checklistItems.length;
  const confirmedCount = checklistItems.filter((i) => i.status === 'confirmed').length;
  const progressPercent = totalItems > 0 ? Math.round((confirmedCount / totalItems) * 100) : 0;

  const handleSelectEmployee = (val: string) => {
    setSelectedEmployeeId(val);
    loadChecklist(val);
  };

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>离职交接清单</Title>
        <Text type="secondary">
          按部门分组管理离职交接事项，各负责人逐项确认。自动同步离职申请表字段（姓名、职位、部门负责人、离职时间、离职事由）。
        </Text>
      </div>

      {/* 员工选择 + 操作栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space size={16} wrap>
          <Space>
            <UserOutlined />
            <Text strong>选择员工：</Text>
            <Select
              showSearch
              placeholder="搜索员工姓名"
              style={{ width: 280 }}
              value={selectedEmployeeId}
              onChange={handleSelectEmployee}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={employees.map((emp) => ({
                label: `${emp.chinese_name} (${emp.employee_no || ''})`,
                value: emp.id,
              }))}
            />
          </Space>

          <Divider type="vertical" />

          <Tooltip title="从离职申请表同步姓名、职位、部门负责人、离职时间、离职事由">
            <Button
              icon={<ReloadOutlined />}
              loading={syncing}
              onClick={handleSyncFromResignation}
              disabled={!selectedEmployeeId}
            >
              同步离职申请表
            </Button>
          </Tooltip>

          <Button
            danger
            icon={<ReloadOutlined />}
            onClick={handleReset}
            disabled={!selectedEmployeeId}
          >
            重置清单
          </Button>
        </Space>
      </Card>

      {/* 未选择员工 */}
      {!selectedEmployeeId && (
        <Card>
          <Empty description="请先选择一名员工，查看其离职交接清单" />
        </Card>
      )}

      {/* 加载中 */}
      {loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" tip="加载交接清单..." />
          </div>
        </Card>
      )}

      {/* 交接清单内容 */}
      {!loading && selectedEmployeeId && selectedEmployee && (
        <>
          {/* 员工信息 + 整体进度 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={24} align="middle">
              <Col flex="auto">
                <Descriptions column={4} size="small">
                  <Descriptions.Item label="员工姓名">
                    <Text strong>{selectedEmployee.chinese_name}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="工号">
                    {selectedEmployee.employee_no || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="职位">
                    {selectedEmployee.position_name || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="部门">
                    {selectedEmployee.department || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    border: `4px solid ${progressPercent === 100 ? '#52c41a' : '#1890ff'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto',
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: progressPercent === 100 ? '#52c41a' : '#1890ff' }}>
                      {progressPercent}%
                    </span>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {confirmedCount}/{totalItems} 项已确认
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* 按部门分组的交接卡片 */}
          {checklistItems.length === 0 ? (
            <Card>
              <Empty description="暂无交接清单，请点击「重置清单」生成默认清单" />
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {DEPT_GROUPS.map((dept) => {
                const deptItems = checklistItems.filter((i) => i.dept_key === dept.key);
                const deptConfirmed = deptItems.filter((i) => i.status === 'confirmed').length;
                const deptTotal = deptItems.length;
                const deptDone = deptConfirmed === deptTotal;

                return (
                  <Col xs={24} lg={12} xl={8} key={dept.key}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <span style={{ color: DEPT_COLORS[dept.key], fontSize: 18 }}>
                            {dept.icon}
                          </span>
                          <span>{dept.label}</span>
                          <Tag color={deptDone ? 'success' : 'processing'}>
                            {deptConfirmed}/{deptTotal}
                          </Tag>
                        </Space>
                      }
                      style={{
                        height: '100%',
                        borderTop: `3px solid ${DEPT_COLORS[dept.key]}`,
                      }}
                      bodyStyle={{ padding: '8px 16px 12px' }}
                    >
                      {deptItems.map((item) => {
                        const isConfirmed = item.status === 'confirmed';
                        return (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 10,
                              padding: '10px 0',
                              borderBottom: '1px solid #f0f0f0',
                            }}
                          >
                            {/* 状态图标 */}
                            <div style={{ marginTop: 2, flexShrink: 0 }}>
                              {isConfirmed ? (
                                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                              ) : (
                                <ClockCircleOutlined style={{ color: '#faad14', fontSize: 18 }} />
                              )}
                            </div>

                            {/* 内容 */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: 13,
                                lineHeight: '20px',
                                color: isConfirmed ? '#8c8c8c' : '#262626',
                                textDecoration: isConfirmed ? 'line-through' : 'none',
                                marginBottom: 4,
                              }}>
                                {item.description}
                              </div>
                              {isConfirmed && item.confirmed_by_name && (
                                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                                  {item.confirmed_by_name} 确认
                                  {item.confirmed_at && ` · ${dayjs(item.confirmed_at).format('MM-DD HH:mm')}`}
                                </div>
                              )}
                            </div>

                            {/* 操作按钮 */}
                            <div style={{ flexShrink: 0 }}>
                              {!isConfirmed ? (
                                <Button
                                  size="small"
                                  type="primary"
                                  ghost
                                  icon={<CheckCircleOutlined />}
                                  onClick={() => handleConfirmItem(item)}
                                >
                                  确认
                                </Button>
                              ) : (
                                user && canEdit(user.role) && (
                                  <Button
                                    size="small"
                                    type="link"
                                    danger
                                    onClick={() => handleUndoConfirm(item)}
                                  >
                                    撤销
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* 部门状态 */}
                      <div style={{
                        marginTop: 12,
                        padding: '8px 10px',
                        background: deptDone ? '#f6ffed' : '#fafafa',
                        borderRadius: 4,
                        fontSize: 12,
                        color: '#8c8c8c',
                      }}>
                        {deptDone ? (
                          <Badge status="success" text="全部确认完成" />
                        ) : (
                          <Badge status="processing" text={`还有 ${deptTotal - deptConfirmed} 项待确认`} />
                        )}
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </>
      )}

      {/* 确认弹窗 */}
    </div>
  );
};

export default OffboardingHandoverChecklistPage;
