import React from 'react';
import { Outlet } from 'react-router-dom';

// 在职管理容器 - 渲染子路由
const EmploymentPage: React.FC = () => {
  return <Outlet />;
};

export default EmploymentPage;
