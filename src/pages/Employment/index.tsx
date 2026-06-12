import React from 'react';
import { Navigate } from 'react-router-dom';

// 在职管理入口，重定向到试用期评估
const EmploymentPage: React.FC = () => {
  return <Navigate to="/employment/evaluation" replace />;
};

export default EmploymentPage;
