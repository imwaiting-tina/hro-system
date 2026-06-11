// ============================================================
// HRO系统 - 类型定义
// ============================================================

export type UserRole = 'super_admin' | 'main_admin' | 'sub_admin' | 'bu_head' | 'employee';

export interface User {
  id: string;
  username: string;
  display_name: string;
  role: UserRole;
  email: string;
  phone: string;
  department: string;
  position: string;
  avatar_url: string;
  is_active: boolean;
}

export type RecruitmentStatus =
  | 'draft' | 'pending_dept' | 'pending_hr' | 'pending_final'
  | 'approved' | 'rejected' | 'published' | 'closed';

export type ResumeStatus =
  | 'new' | 'screening'
  | 'interviewing_first' | 'interviewing_second' | 'interviewing_final'
  | 'pending_offer'
  | 'offered' | 'accepted'
  | 'rejected' | 'withdrawn';

export type InterviewRound = 'first' | 'second' | 'final';
export type InterviewResult = 'pending' | 'passed' | 'failed' | 'cancelled';

export type ApplicationStatus =
  | 'draft' | 'submitted' | 'hr_reviewed' | 'dept_reviewed' | 'final_reviewed' | 'rejected';

export type OfferStatus =
  | 'draft' | 'pending_send' | 'sent' | 'delivered' | 'accepted' | 'rejected' | 'expired' | 'revoked';

export type EmployeeType = 'full_time' | 'intern' | 'retired_rehire' | 'security';
export type EmployeeStatus = 'active' | 'probation' | 'internship' | 'resigned' | 'suspended';

export type OnboardingDocType =
  | 'onboarding_guide' | 'offer_letter' | 'employee_info_form' | 'recruitment_approval'
  | 'intern_approval' | 'rehire_approval' | 'labor_contract' | 'internship_agreement'
  | 'service_agreement' | 'security_contract' | 'employee_handbook' | 'other';

export type DocStatus =
  | 'pending' | 'pending_sign' | 'pending_seal' | 'sealed' | 'delivered' | 'archived';

export type EvaluationStatus =
  | 'pending_employee' | 'pending_dept' | 'pending_bu' | 'pending_hr'
  | 'pending_final' | 'completed' | 'rejected';

export type RenewalStatus =
  | 'pending_employee' | 'pending_bu' | 'pending_hr' | 'pending_final' | 'approved' | 'rejected' | 'completed';

export type ResignationStatus =
  | 'pending' | 'in_progress' | 'pending_handover' | 'pending_clearance' | 'completed' | 'cancelled';

// 导航菜单项
export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  children?: MenuItem[];
  path?: string;
}

// 审批记录
export interface ApprovalRecord {
  id: string;
  module: string;
  record_id: string;
  step_order: number;
  step_name: string;
  approver_id: string;
  approver_name?: string;
  approver_role: string;
  status: 'pending' | 'approved' | 'rejected';
  opinion: string;
  approved_at: string;
}
