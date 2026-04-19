-- HR SaaS Platform Complete Database Schema
-- All tables, RLS policies, triggers, and seed data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ORGANIZATIONS (Multi-tenant support)
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROFILES (User profiles with org membership)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'hr', 'manager', 'employee')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POSITIONS (Job positions/openings)
-- ============================================
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  department TEXT,
  description TEXT,
  requirements JSONB DEFAULT '[]',
  salary_range_min DECIMAL(12,2),
  salary_range_max DECIMAL(12,2),
  status TEXT DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'on_hold')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CANDIDATES (Recruitment pipeline)
-- ============================================
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cv_url TEXT,
  cv_parsed_data JSONB DEFAULT '{}',
  ai_score DECIMAL(3,2),
  ai_recommendation TEXT,
  source TEXT DEFAULT 'direct',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'screening', 'chatbot_pending', 'chatbot_completed', 'interview_scheduled', 'interviewed', 'evaluation_pending', 'evaluated', 'approval_pending', 'approved', 'rejected', 'hired', 'withdrawn')),
  chatbot_completed BOOLEAN DEFAULT FALSE,
  chatbot_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHATBOT SESSIONS (Pre-qualification conversations)
-- ============================================
CREATE TABLE IF NOT EXISTS chatbot_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  messages JSONB DEFAULT '[]',
  qualification_score DECIMAL(3,2),
  summary TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- INTERVIEWS (Interview scheduling)
-- ============================================
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  interviewer_id UUID REFERENCES profiles(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  type TEXT DEFAULT 'technical' CHECK (type IN ('screening', 'technical', 'behavioral', 'final', 'hr')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  meeting_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVALUATIONS (Interview evaluations)
-- ============================================
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
  evaluator_id UUID NOT NULL REFERENCES profiles(id),
  criteria_scores JSONB DEFAULT '{}',
  global_score DECIMAL(3,2),
  strengths TEXT,
  weaknesses TEXT,
  recommendation TEXT CHECK (recommendation IN ('strong_hire', 'hire', 'maybe', 'no_hire', 'strong_no_hire')),
  comments TEXT,
  ai_analysis JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APPROVAL REQUESTS (HR decision workflow)
-- ============================================
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  proposed_salary DECIMAL(12,2),
  proposed_start_date DATE,
  proposed_bonuses JSONB DEFAULT '[]',
  proposed_benefits JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  decision_notes TEXT,
  ai_recommendation TEXT,
  document_url TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMPLOYEES (Onboarded employees)
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  candidate_id UUID REFERENCES candidates(id),
  employee_number TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  position TEXT,
  manager_id UUID REFERENCES employees(id),
  hire_date DATE NOT NULL,
  salary DECIMAL(12,2),
  employment_type TEXT DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated')),
  onboarding_status TEXT DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'in_progress', 'completed')),
  onboarding_tasks JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TALENT ASSESSMENTS (9-Box Matrix)
-- ============================================
CREATE TABLE IF NOT EXISTS talent_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assessor_id UUID REFERENCES profiles(id),
  period TEXT NOT NULL,
  performance_score INTEGER CHECK (performance_score BETWEEN 1 AND 3),
  potential_score INTEGER CHECK (potential_score BETWEEN 1 AND 3),
  nine_box_position TEXT,
  development_plan TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TURNOVER PREDICTIONS (AI-powered risk assessment)
-- ============================================
CREATE TABLE IF NOT EXISTS turnover_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  risk_score DECIMAL(3,2) CHECK (risk_score BETWEEN 0 AND 1),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_factors JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ
);

-- ============================================
-- EVENTS (Event bus for module communication)
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS (Multi-channel alerts)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCUMENTS (Generated HR documents)
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('interview_report', 'approval_request', 'offer_letter', 'contract', 'onboarding_checklist')),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  generated_data JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKFLOW STATES (State machine tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  current_state TEXT NOT NULL,
  state_history JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANALYTICS SNAPSHOTS (KPI tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  module TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their organization" ON organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Allow insert for new orgs" ON organizations FOR INSERT WITH CHECK (true);

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view profiles in their org" ON profiles FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) OR id = auth.uid());
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE
  USING (id = auth.uid());
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Positions
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view positions in their org" ON positions FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "HR/Admin can insert positions" ON positions FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));
CREATE POLICY "HR/Admin can update positions" ON positions FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));
CREATE POLICY "HR/Admin can delete positions" ON positions FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));

-- Candidates
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view candidates in their org" ON candidates FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "HR can insert candidates" ON candidates FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')));
CREATE POLICY "HR can update candidates" ON candidates FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')));
CREATE POLICY "HR can delete candidates" ON candidates FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));

-- Chatbot Sessions
ALTER TABLE chatbot_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view chatbot sessions in their org" ON chatbot_sessions FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "HR can manage chatbot sessions" ON chatbot_sessions FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));
CREATE POLICY "HR can update chatbot sessions" ON chatbot_sessions FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));

-- Interviews
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view interviews in their org" ON interviews FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "HR/Manager can insert interviews" ON interviews FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')));
CREATE POLICY "HR/Manager can update interviews" ON interviews FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')));

-- Evaluations
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view evaluations in their org" ON evaluations FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Evaluators can insert evaluations" ON evaluations FOR INSERT
  WITH CHECK (evaluator_id = auth.uid() OR organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));
CREATE POLICY "Evaluators can update evaluations" ON evaluations FOR UPDATE
  USING (evaluator_id = auth.uid() OR organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));

-- Approval Requests
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view approval requests in their org" ON approval_requests FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "HR/Admin can insert approval requests" ON approval_requests FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));
CREATE POLICY "HR/Admin can update approval requests" ON approval_requests FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));

-- Employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view employees in their org" ON employees FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "HR/Admin can insert employees" ON employees FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));
CREATE POLICY "HR/Admin can update employees" ON employees FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));

-- Talent Assessments
ALTER TABLE talent_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view talent assessments in their org" ON talent_assessments FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "HR/Manager can insert talent assessments" ON talent_assessments FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')));
CREATE POLICY "HR/Manager can update talent assessments" ON talent_assessments FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')));

-- Turnover Predictions
ALTER TABLE turnover_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR/Admin can view turnover predictions" ON turnover_predictions FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')));
CREATE POLICY "System can insert turnover predictions" ON turnover_predictions FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view events in their org" ON events FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert events" ON events FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT
  WITH CHECK (true);

-- Documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view documents in their org" ON documents FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "HR/Admin can insert documents" ON documents FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')));

-- Workflow States
ALTER TABLE workflow_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view workflow states in their org" ON workflow_states FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert workflow states" ON workflow_states FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update workflow states" ON workflow_states FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Analytics Snapshots
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR/Admin can view analytics" ON analytics_snapshots FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')));
CREATE POLICY "System can insert analytics" ON analytics_snapshots FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_organizations_updated_at') THEN
    CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_positions_updated_at') THEN
    CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_candidates_updated_at') THEN
    CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_interviews_updated_at') THEN
    CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_evaluations_updated_at') THEN
    CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_approval_requests_updated_at') THEN
    CREATE TRIGGER update_approval_requests_updated_at BEFORE UPDATE ON approval_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_employees_updated_at') THEN
    CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_talent_assessments_updated_at') THEN
    CREATE TRIGGER update_talent_assessments_updated_at BEFORE UPDATE ON talent_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_workflow_states_updated_at') THEN
    CREATE TRIGGER update_workflow_states_updated_at BEFORE UPDATE ON workflow_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- AUTO-CREATE PROFILE TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Get or create default organization
  SELECT id INTO default_org_id FROM organizations WHERE slug = 'demo-company' LIMIT 1;
  
  IF default_org_id IS NULL THEN
    INSERT INTO organizations (name, slug) VALUES ('Demo Company', 'demo-company')
    RETURNING id INTO default_org_id;
  END IF;

  INSERT INTO profiles (id, organization_id, email, full_name, role)
  VALUES (
    NEW.id,
    default_org_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'hr')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SEED DATA FOR DEMO
-- ============================================

-- Create demo organization
INSERT INTO organizations (id, name, slug, settings)
VALUES ('00000000-0000-0000-0000-000000000001', 'TechCorp Inc.', 'techcorp', '{"industry": "Technology", "size": "100-500"}')
ON CONFLICT (slug) DO NOTHING;

-- Create sample positions
INSERT INTO positions (id, organization_id, title, department, description, requirements, salary_range_min, salary_range_max, status)
VALUES 
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Senior Software Engineer', 'Engineering', 'We are looking for a senior software engineer to join our growing team.', '["5+ years experience", "React/Node.js", "Cloud experience"]', 80000, 120000, 'open'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Product Manager', 'Product', 'Lead product strategy and roadmap for our core platform.', '["3+ years PM experience", "Technical background", "Agile experience"]', 90000, 130000, 'open'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'UX Designer', 'Design', 'Create beautiful and intuitive user experiences.', '["Portfolio required", "Figma expertise", "User research skills"]', 70000, 100000, 'open')
ON CONFLICT DO NOTHING;

-- Create sample candidates
INSERT INTO candidates (id, organization_id, position_id, first_name, last_name, email, phone, status, ai_score, source)
VALUES
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Alice', 'Johnson', 'alice.johnson@email.com', '+1-555-0101', 'new', 0.85, 'linkedin'),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Bob', 'Smith', 'bob.smith@email.com', '+1-555-0102', 'chatbot_completed', 0.72, 'referral'),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Carol', 'Williams', 'carol.williams@email.com', '+1-555-0103', 'evaluated', 0.91, 'direct'),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'David', 'Brown', 'david.brown@email.com', '+1-555-0104', 'approval_pending', 0.88, 'linkedin'),
  ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Emma', 'Davis', 'emma.davis@email.com', '+1-555-0105', 'interview_scheduled', 0.79, 'job_board')
ON CONFLICT DO NOTHING;

-- Create sample employees
INSERT INTO employees (id, organization_id, first_name, last_name, email, department, position, hire_date, salary, status, onboarding_status)
VALUES
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'John', 'Manager', 'john.manager@techcorp.com', 'Engineering', 'Engineering Manager', '2022-01-15', 150000, 'active', 'completed'),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 'Sarah', 'Developer', 'sarah.dev@techcorp.com', 'Engineering', 'Software Engineer', '2023-03-01', 95000, 'active', 'completed'),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', 'Mike', 'Designer', 'mike.design@techcorp.com', 'Design', 'Senior Designer', '2022-06-15', 85000, 'active', 'completed'),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', 'Lisa', 'PM', 'lisa.pm@techcorp.com', 'Product', 'Senior PM', '2021-09-01', 120000, 'active', 'completed'),
  ('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', 'Tom', 'Newbie', 'tom.new@techcorp.com', 'Engineering', 'Junior Developer', '2024-01-02', 65000, 'active', 'in_progress')
ON CONFLICT DO NOTHING;

-- Create sample talent assessments (9-box data)
INSERT INTO talent_assessments (organization_id, employee_id, period, performance_score, potential_score, nine_box_position)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000030', '2024-Q1', 3, 3, 'star'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000031', '2024-Q1', 2, 3, 'high_potential'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000032', '2024-Q1', 3, 2, 'solid_performer'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000033', '2024-Q1', 3, 3, 'star'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000034', '2024-Q1', 1, 2, 'developing')
ON CONFLICT DO NOTHING;

-- Create sample turnover predictions
INSERT INTO turnover_predictions (organization_id, employee_id, risk_score, risk_level, risk_factors, recommendations)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000031', 0.25, 'low', '["tenure < 2 years"]', '["Regular 1:1s", "Career development plan"]'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000032', 0.65, 'high', '["No promotion in 2 years", "Market salary gap"]', '["Salary review", "Promotion discussion", "New project assignment"]'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000034', 0.45, 'medium', '["New hire", "Onboarding incomplete"]', '["Complete onboarding", "Assign mentor", "Weekly check-ins"]')
ON CONFLICT DO NOTHING;
