import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuthStore } from './stores/authStore';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/Login';
import WorkplacePage from './pages/Workplace';
import DemandPage from './pages/Recruitment/Demand';
import ResumeLibPage from './pages/Recruitment/ResumeLib';
import InterviewPage from './pages/Recruitment/Interview';
import OfferPage from './pages/Recruitment/Offer';
import OnboardingPage from './pages/Onboarding';
import EmploymentPage from './pages/Employment';
import DailyPage from './pages/Daily';
import ResignationPage from './pages/Resignation';
import ApprovalPage from './pages/Approval';

// 路由守卫
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  React.useEffect(() => {
    checkAuth();
  }, []);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
        },
      }}
    >
      <AntApp>
        <BrowserRouter basename="/hro-system">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/workplace" replace />} />
              <Route path="workplace" element={<WorkplacePage />} />
              <Route path="recruitment/demand" element={<DemandPage />} />
              <Route path="recruitment/resume" element={<ResumeLibPage />} />
              <Route path="recruitment/interview" element={<InterviewPage />} />
              <Route path="recruitment/offer" element={<OfferPage />} />
              <Route path="onboarding" element={<OnboardingPage />} />
              <Route path="employment" element={<EmploymentPage />} />
              <Route path="daily" element={<DailyPage />} />
              <Route path="resignation" element={<ResignationPage />} />
              <Route path="approval" element={<ApprovalPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
