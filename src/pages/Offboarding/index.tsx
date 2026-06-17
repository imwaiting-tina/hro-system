import React, { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Typography, Select, Card, Space, Spin, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAuthStore, canEdit } from '../../stores/authStore';
import OffboardingNav from '../../components/OffboardingNav';
import supabase from '../../utils/supabase';

const { Title, Text } = Typography;

// 共享上下文：当前选中的员工
interface OffboardingContextType {
  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;
  employees: any[];
  refreshCases: () => void;
  caseRefreshKey: number;
}

export const OffboardingContext = createContext<OffboardingContextType>({
  selectedEmployeeId: null,
  setSelectedEmployeeId: () => {},
  employees: [],
  refreshCases: () => {},
  caseRefreshKey: 0,
});

export const useOffboardingContext = () => useContext(OffboardingContext);

const OffboardingPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [caseRefreshKey, setCaseRefreshKey] = useState(0);

  const refreshCases = () => setCaseRefreshKey((k) => k + 1);

  // 加载员工列表
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('id, chinese_name, employee_no, position_name, employee_type')
          .order('chinese_name');
        if (!error && data) {
          setEmployees(data.map((e: any) => ({ ...e, name: e.chinese_name, department: '' })));
          // 默认选中第一个
          if (!selectedEmployeeId && data.length > 0) {
            setSelectedEmployeeId(data[0].id);
          }
        }
      } catch {
        // 如果表不存在，使用mock数据
        setEmployees([]);
      }
      setLoading(false);
    };
    fetchEmployees();
  }, []);

  // 默认跳转到列表页
  useEffect(() => {
    if (location.pathname === '/offboarding') {
      navigate('/offboarding/list', { replace: true });
    }
  }, [location.pathname, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <OffboardingContext.Provider value={{ selectedEmployeeId, setSelectedEmployeeId, employees, refreshCases, caseRefreshKey }}>
      <div>
        <OffboardingNav />
        <div className="page-header">
          <Title level={2}>离职管理</Title>
          <Text type="secondary">管理员工主动离职、被动离职全流程：申请→审批→交接→结算</Text>
        </div>

        {/* 全局员工选择器 - 仅HR可见 */}
        {user && canEdit(user.role) && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space>
              <UserOutlined />
              <Text strong>选择员工：</Text>
              <Select
                showSearch
                placeholder="搜索员工姓名"
                style={{ width: 300 }}
                value={selectedEmployeeId}
                onChange={(val) => setSelectedEmployeeId(val)}
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                options={employees.map((emp) => ({
                  label: `${emp.name} (${emp.employee_no || ''}) - ${emp.department || ''}`,
                  value: emp.id,
                }))}
              />
            </Space>
          </Card>
        )}

        <Outlet />
      </div>
    </OffboardingContext.Provider>
  );
};

export default OffboardingPage;
