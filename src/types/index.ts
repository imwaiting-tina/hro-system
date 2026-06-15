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
  | 'pending' | 'pending_sign' | 'pending_seal' | 'sealed'
  | 'company_archived' | 'returned_to_employee' | 'archived';

export type OnboardingGuideStatus = 'pending' | 'in_progress' | 'completed';

export interface OnboardingGuideTask {
  id: string;
  employee_id: string;
  task_name: string;
  task_category: string;
  executor_name: string;
  status: OnboardingGuideStatus;
  completed_at: string;
  completed_by: string;
  sort_order: number;
  notes: string;
}

export interface WelcomeAnnouncement {
  id: string;
  employee_id: string;
  display_name: string;
  department_name: string;
  position_title: string;
  onboard_date: string;
  avatar_url: string;
  self_intro: string;
  education_bg: string;
  status: 'draft' | 'pending_review' | 'approved' | 'published';
  reviewed_by: string;
  published_at: string;
}

export interface TrainingModuleProgress {
  id: string;
  employee_id: string;
  module_key: string;
  module_name: string;
  module_order: number;
  is_read: boolean;
  read_at: string;
}

export interface EmployeeDeclarations {
  q1_infectious: boolean;
  q2_noncompete: boolean;
  q3_misconduct: boolean;
  q4_shift_work: boolean;
  q5_rules_accept: boolean;
  q6_other_employment: boolean;
}

export type EvaluationStatus =
  | 'pending_employee' | 'pending_dept' | 'pending_bu' | 'pending_hr'
  | 'pending_final' | 'completed' | 'rejected';

export type RenewalStatus =
  | 'pending_employee' | 'pending_bu' | 'pending_hr' | 'pending_final' | 'approved' | 'rejected' | 'completed';

export type ResignationStatus =
  | 'pending' | 'in_progress' | 'pending_handover' | 'pending_clearance' | 'completed' | 'cancelled';

// ============================================================
// 离职管理V3 - Offboarding 类型定义
// ============================================================

export type OffboardingInitiatorType = 'employee' | 'company';
export type OffboardingType = 'resignation' | 'termination' | 'retirement';
export type OffboardingCaseStatus = 'pending' | 'approved' | 'handovering' | 'settled' | 'closed';
export type HandoverItemType = 'asset' | 'knowledge' | 'finance';
export type HandoverItemStatus = 'pending' | 'confirmed';

export interface OffboardingCase {
  id: string;
  employee_id: string;
  initiator_type: OffboardingInitiatorType;
  type: OffboardingType;
  status: OffboardingCaseStatus;
  reason_code: string;
  reason_detail: string;
  last_working_day: string;
  submitted_at: string;
  approved_at: string;
  approver_id: string;
  compensation_amount: number;
  settlement_data: OffboardingSettlement | null;
  settlement_by: string;
  settled_at: string;
  notes: string;
  created_at: string;
  updated_at: string;
  // joined fields
  employee_name?: string;
  employee_department?: string;
  employee_position?: string;
  employee_no?: string;
  approver_name?: string;
}

export interface OffboardingHandoverItem {
  id: string;
  case_id: string;
  item_type: HandoverItemType;
  description: string;
  assigned_to: string;
  status: HandoverItemStatus;
  confirmed_at: string;
  confirmed_by: string;
  sort_order: number;
  created_at: string;
  // joined
  assigned_to_name?: string;
  confirmed_by_name?: string;
}

export interface OffboardingExitInterview {
  id: string;
  case_id: string;
  interviewer_id: string;
  interview_date: string;
  rating: number;
  feedback_text: string;
  rehire_eligible: boolean;
  created_at: string;
  // joined
  interviewer_name?: string;
}

export interface OffboardingSettlement {
  final_salary: number;
  unused_annual_leave_days: number;
  annual_leave_compensation: number;
  service_years: number;
  monthly_salary: number;
  n_plus_one: number;
  compensation_amount: number;
  total_settlement: number;
}

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
