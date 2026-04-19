export interface Organization {
  id: string
  name: string
  slug: string
  logo_url?: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  organization_id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: 'admin' | 'hr' | 'manager' | 'employee'
  created_at: string
  updated_at: string
}

export interface Position {
  id: string
  organization_id: string
  title: string
  department?: string
  description?: string
  requirements: string[]
  salary_range_min?: number
  salary_range_max?: number
  status: 'draft' | 'open' | 'closed' | 'on_hold'
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Candidate {
  id: string
  organization_id: string
  position_id?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  cv_url?: string
  cv_parsed_data: Record<string, unknown>
  ai_score?: number
  ai_recommendation?: string
  source: string
  status: CandidateStatus
  chatbot_completed: boolean
  chatbot_data: Record<string, unknown>
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  position?: Position
}

export type CandidateStatus = 
  | 'new' 
  | 'screening' 
  | 'chatbot_pending' 
  | 'chatbot_completed' 
  | 'interview_scheduled' 
  | 'interviewed' 
  | 'evaluation_pending' 
  | 'evaluated' 
  | 'approval_pending' 
  | 'approved' 
  | 'rejected' 
  | 'hired' 
  | 'withdrawn'

export interface ChatbotSession {
  id: string
  organization_id: string
  candidate_id: string
  status: 'in_progress' | 'completed' | 'abandoned'
  messages: ChatMessage[]
  qualification_score?: number
  summary?: string
  started_at: string
  completed_at?: string
  candidate?: Candidate
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface Interview {
  id: string
  organization_id: string
  candidate_id: string
  position_id?: string
  interviewer_id?: string
  scheduled_at: string
  duration_minutes: number
  type: 'screening' | 'technical' | 'behavioral' | 'final' | 'hr'
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  meeting_link?: string
  created_at: string
  updated_at: string
  candidate?: Candidate
  interviewer?: Profile
}

export interface Evaluation {
  id: string
  organization_id: string
  candidate_id: string
  interview_id?: string
  evaluator_id: string
  criteria_scores: Record<string, number>
  global_score?: number
  strengths?: string
  weaknesses?: string
  recommendation?: 'strong_hire' | 'hire' | 'maybe' | 'no_hire' | 'strong_no_hire'
  comments?: string
  ai_analysis: Record<string, unknown>
  status: 'draft' | 'submitted'
  submitted_at?: string
  created_at: string
  updated_at: string
  candidate?: Candidate
  evaluator?: Profile
}

export interface ApprovalRequest {
  id: string
  organization_id: string
  candidate_id: string
  position_id?: string
  requested_by: string
  approved_by?: string
  proposed_salary?: number
  proposed_start_date?: string
  proposed_bonuses: Array<{ name: string; amount: number }>
  proposed_benefits: string[]
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested'
  decision_notes?: string
  ai_recommendation?: string
  document_url?: string
  decided_at?: string
  created_at: string
  updated_at: string
  candidate?: Candidate
  position?: Position
  requester?: Profile
}

export interface Employee {
  id: string
  organization_id: string
  profile_id?: string
  candidate_id?: string
  employee_number?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  department?: string
  position?: string
  manager_id?: string
  hire_date: string
  salary?: number
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern'
  status: 'active' | 'on_leave' | 'terminated'
  onboarding_status: 'pending' | 'in_progress' | 'completed'
  onboarding_tasks: OnboardingTask[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  manager?: Employee
}

export interface OnboardingTask {
  id: string
  title: string
  completed: boolean
  completed_at?: string
}

export interface TalentAssessment {
  id: string
  organization_id: string
  employee_id: string
  assessor_id?: string
  period: string
  performance_score: 1 | 2 | 3
  potential_score: 1 | 2 | 3
  nine_box_position?: string
  development_plan?: string
  notes?: string
  created_at: string
  updated_at: string
  employee?: Employee
}

export interface TurnoverPrediction {
  id: string
  organization_id: string
  employee_id: string
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  risk_factors: string[]
  recommendations: string[]
  predicted_at: string
  valid_until?: string
  employee?: Employee
}

export interface Event {
  id: string
  organization_id?: string
  event_type: string
  entity_type: string
  entity_id: string
  payload: Record<string, unknown>
  processed: boolean
  processed_at?: string
  created_at: string
}

export interface Notification {
  id: string
  organization_id: string
  user_id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  read_at?: string
  created_at: string
}

export interface Document {
  id: string
  organization_id: string
  type: 'interview_report' | 'approval_request' | 'offer_letter' | 'contract' | 'onboarding_checklist'
  entity_type: string
  entity_id: string
  title: string
  file_url?: string
  generated_data: Record<string, unknown>
  created_by?: string
  created_at: string
}

export interface WorkflowState {
  id: string
  organization_id: string
  workflow_type: string
  entity_type: string
  entity_id: string
  current_state: string
  state_history: Array<{ state: string; timestamp: string; actor_id?: string }>
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AnalyticsSnapshot {
  id: string
  organization_id: string
  snapshot_date: string
  module: string
  metrics: Record<string, unknown>
  created_at: string
}

// Dashboard metrics
export interface DashboardMetrics {
  totalCandidates: number
  activeCandidates: number
  openPositions: number
  totalEmployees: number
  pendingApprovals: number
  highRiskEmployees: number
  recentEvents: Event[]
}

// Recruitment pipeline metrics
export interface RecruitmentMetrics {
  byStatus: Record<CandidateStatus, number>
  conversionRate: number
  avgProcessingTime: number
  sourceBreakdown: Record<string, number>
}
