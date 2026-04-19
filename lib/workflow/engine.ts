'use server'

import { createClient } from '@/lib/supabase/server'

// Event types in the HR workflow
export type EventType =
  | 'candidate_created'
  | 'ai_parsing_completed'
  | 'ai_scoring_completed'
  | 'chatbot_started'
  | 'chatbot_completed'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'evaluation_submitted'
  | 'ai_recommendation_generated'
  | 'approval_requested'
  | 'approval_completed'
  | 'document_generated'
  | 'employee_created'
  | 'turnover_prediction_generated'

// Workflow state transitions
const CANDIDATE_STATUS_FLOW: Record<string, string[]> = {
  new: ['screening'],
  screening: ['chatbot', 'rejected'],
  chatbot: ['interview', 'rejected'],
  interview: ['evaluation', 'rejected'],
  evaluation: ['approval', 'rejected'],
  approval: ['approved', 'rejected'],
  approved: ['hired'],
  hired: [],
  rejected: [],
  withdrawn: [],
}

// Emit an event to the event bus
export async function emitEvent(
  eventType: EventType,
  entityType: string,
  entityId: string,
  payload: Record<string, unknown>,
  organizationId?: string
) {
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      organization_id: organizationId,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      payload,
      processed: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to emit event:', error)
    return null
  }

  // Process the event immediately (synchronous processing for demo)
  await processEvent(event)

  return event
}

// Process a single event and trigger appropriate actions
export async function processEvent(event: {
  id: string
  event_type: string
  entity_type: string
  entity_id: string
  payload: Record<string, unknown>
  organization_id?: string
}) {
  const supabase = await createClient()

  try {
    switch (event.event_type) {
      case 'candidate_created':
        await handleCandidateCreated(event)
        break

      case 'ai_parsing_completed':
        await handleAIParsingCompleted(event)
        break

      case 'ai_scoring_completed':
        await handleAIScoringCompleted(event)
        break

      case 'chatbot_completed':
        await handleChatbotCompleted(event)
        break

      case 'interview_completed':
        await handleInterviewCompleted(event)
        break

      case 'evaluation_submitted':
        await handleEvaluationSubmitted(event)
        break

      case 'ai_recommendation_generated':
        await handleAIRecommendationGenerated(event)
        break

      case 'approval_completed':
        await handleApprovalCompleted(event)
        break

      case 'employee_created':
        await handleEmployeeCreated(event)
        break
    }

    // Mark event as processed
    await supabase
      .from('events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('id', event.id)
  } catch (error) {
    console.error('Error processing event:', error)
    await supabase
      .from('events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', event.id)
  }
}

// Handler: Candidate Created -> Trigger AI parsing
async function handleCandidateCreated(event: {
  entity_id: string
  organization_id?: string
  payload: Record<string, unknown>
}) {
  const supabase = await createClient()
  const candidateId = event.entity_id

  // Update candidate status to screening
  await supabase.from('candidates').update({ status: 'screening' }).eq('id', candidateId)

  // Log workflow state
  await logWorkflowState(event.organization_id, 'recruitment', 'candidate', candidateId, 'screening', 'new')

  // Create notification
  await createNotification(
    event.organization_id,
    'New Candidate Added',
    `A new candidate has been added and is ready for screening.`,
    'info',
    'candidate',
    candidateId
  )
}

// Handler: AI Parsing Completed -> Trigger AI scoring
async function handleAIParsingCompleted(event: {
  entity_id: string
  organization_id?: string
  payload: Record<string, unknown>
}) {
  const supabase = await createClient()
  const candidateId = event.entity_id

  // Update parsed data
  if (event.payload.parsed_data) {
    await supabase
      .from('candidates')
      .update({ cv_parsed: event.payload.parsed_data })
      .eq('id', candidateId)
  }

  // Emit scoring event
  await emitEvent('ai_scoring_completed', 'candidate', candidateId, event.payload, event.organization_id)
}

// Handler: AI Scoring Completed -> Move to chatbot stage
async function handleAIScoringCompleted(event: {
  entity_id: string
  organization_id?: string
  payload: Record<string, unknown>
}) {
  const supabase = await createClient()
  const candidateId = event.entity_id

  // Update AI score
  if (event.payload.score) {
    await supabase
      .from('candidates')
      .update({
        ai_score: event.payload.score as number,
        ai_analysis: event.payload.analysis || {},
        status: 'chatbot',
      })
      .eq('id', candidateId)
  }

  // Create chatbot session
  await supabase.from('chatbot_sessions').insert({
    candidate_id: candidateId,
    messages: [],
    status: 'pending',
  })

  await logWorkflowState(event.organization_id, 'recruitment', 'candidate', candidateId, 'chatbot', 'screening')

  await createNotification(
    event.organization_id,
    'AI Scoring Complete',
    `Candidate has been scored (${event.payload.score}/100) and is ready for chatbot screening.`,
    'success',
    'candidate',
    candidateId
  )
}

// Handler: Chatbot Completed -> Move to interview stage
async function handleChatbotCompleted(event: {
  entity_id: string
  organization_id?: string
  payload: Record<string, unknown>
}) {
  const supabase = await createClient()
  const sessionId = event.entity_id

  // Get candidate from session
  const { data: session } = await supabase
    .from('chatbot_sessions')
    .select('candidate_id, qualification_score')
    .eq('id', sessionId)
    .single()

  if (!session) return

  // Update candidate status
  await supabase.from('candidates').update({ status: 'interview' }).eq('id', session.candidate_id)

  await logWorkflowState(
    event.organization_id,
    'recruitment',
    'candidate',
    session.candidate_id,
    'interview',
    'chatbot'
  )

  await createNotification(
    event.organization_id,
    'Chatbot Screening Complete',
    `Candidate has completed chatbot screening with score ${session.qualification_score || 'N/A'}. Ready for interview scheduling.`,
    'success',
    'candidate',
    session.candidate_id
  )
}

// Handler: Interview Completed -> Move to evaluation stage
async function handleInterviewCompleted(event: {
  entity_id: string
  organization_id?: string
  payload: Record<string, unknown>
}) {
  const supabase = await createClient()
  const interviewId = event.entity_id

  // Get candidate from interview
  const { data: interview } = await supabase
    .from('interviews')
    .select('candidate_id')
    .eq('id', interviewId)
    .single()

  if (!interview) return

  // Update candidate status
  await supabase.from('candidates').update({ status: 'evaluation' }).eq('id', interview.candidate_id)

  await logWorkflowState(
    event.organization_id,
    'recruitment',
    'candidate',
    interview.candidate_id,
    'evaluation',
    'interview'
  )

  await createNotification(
    event.organization_id,
    'Interview Completed',
    `Interview has been completed. Please submit your evaluation.`,
    'info',
    'interview',
    interviewId
  )
}

// Handler: Evaluation Submitted -> Generate AI recommendation
async function handleEvaluationSubmitted(event: {
  entity_id: string
  organization_id?: string
  payload: Record<string, unknown>
}) {
  const supabase = await createClient()
  const evaluationId = event.entity_id

  // Get evaluation details
  const { data: evaluation } = await supabase
    .from('evaluations')
    .select('*, candidate:candidates(*)')
    .eq('id', evaluationId)
    .single()

  if (!evaluation) return

  await createNotification(
    event.organization_id,
    'Evaluation Submitted',
    `Evaluation submitted with recommendation: ${evaluation.recommendation}. AI recommendation will be generated.`,
    'success',
    'evaluation',
    evaluationId
  )

  // Emit AI recommendation event
  await emitEvent(
    'ai_recommendation_generated',
    'evaluation',
    evaluationId,
    { evaluation, candidate: evaluation.candidate },
    event.organization_id
  )
}

// Handler: AI Recommendation Generated -> Move to approval stage
async function handleAIRecommendationGenerated(event: {
  entity_id: string
  organization_id?: string
  payload: Record<string, unknown>
}) {
  const supabase = await createClient()
  const evaluationId = event.entity_id
  const evaluation = event.payload.evaluation as Record<string, unknown>

  if (!evaluation) return

  const candidateId = evaluation.candidate_id as string

  // Update candidate status to approval
  await supabase.from('candidates').update({ status: 'approval' }).eq('id', candidateId)

  await logWorkflowState(event.organization_id, 'recruitment', 'candidate', candidateId, 'approval', 'evaluation')

  await createNotification(
    event.organization_id,
    'Ready for Approval',
    `Candidate is ready for HR approval decision.`,
    'warning',
    'candidate',
    candidateId
  )
}

// Handler: Approval Completed -> Create employee or reject
async function handleApprovalCompleted(event: {
  entity_id: string
  organization_id?: string
  payload: Record<string, unknown>
}) {
  const supabase = await createClient()
  const approvalId = event.entity_id
  const decision = event.payload.decision as string

  // Get approval details
  const { data: approval } = await supabase
    .from('approval_requests')
    .select('*, candidate:candidates(*), position:positions(*)')
    .eq('id', approvalId)
    .single()

  if (!approval) return

  if (decision === 'approved') {
    // Create employee
    const { data: employee } = await supabase
      .from('employees')
      .insert({
        organization_id: event.organization_id,
        candidate_id: approval.candidate_id,
        first_name: approval.candidate.first_name,
        last_name: approval.candidate.last_name,
        email: approval.candidate.email,
        position: approval.position?.title,
        department: approval.position?.department,
        hire_date: approval.proposed_start_date,
        salary: approval.proposed_salary,
        status: 'active',
      })
      .select()
      .single()

    if (employee) {
      // Emit employee_created event
      await emitEvent('employee_created', 'employee', employee.id, { employee, approval }, event.organization_id)

      // Generate offer letter document
      await supabase.from('documents').insert({
        organization_id: event.organization_id,
        document_type: 'offer_letter',
        title: `Offer Letter - ${approval.candidate.first_name} ${approval.candidate.last_name}`,
        entity_type: 'employee',
        entity_id: employee.id,
        content: {
          employee,
          approval,
          generated_at: new Date().toISOString(),
        },
        status: 'final',
      })
    }

    await logWorkflowState(
      event.organization_id,
      'recruitment',
      'candidate',
      approval.candidate_id,
      'hired',
      'approved'
    )

    await createNotification(
      event.organization_id,
      'Candidate Approved',
      `${approval.candidate.first_name} ${approval.candidate.last_name} has been approved and converted to employee.`,
      'success',
      'employee',
      employee?.id || approval.candidate_id
    )
  } else {
    await logWorkflowState(
      event.organization_id,
      'recruitment',
      'candidate',
      approval.candidate_id,
      'rejected',
      'approval'
    )

    await createNotification(
      event.organization_id,
      'Candidate Rejected',
      `${approval.candidate.first_name} ${approval.candidate.last_name} has been rejected.`,
      'error',
      'candidate',
      approval.candidate_id
    )
  }
}

// Handler: Employee Created -> Schedule turnover prediction
async function handleEmployeeCreated(event: {
  entity_id: string
  organization_id?: string
  payload: Record<string, unknown>
}) {
  const supabase = await createClient()
  const employeeId = event.entity_id

  // Create initial turnover prediction (low risk for new hires)
  await supabase.from('turnover_predictions').insert({
    employee_id: employeeId,
    risk_score: 15,
    risk_level: 'low',
    risk_factors: ['New hire - baseline assessment'],
    recommendations: ['Schedule 30-day check-in', 'Ensure onboarding completion', 'Assign mentor'],
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
  })

  await createNotification(
    event.organization_id,
    'New Employee Onboarded',
    `New employee has been created and initial turnover risk assessment completed.`,
    'success',
    'employee',
    employeeId
  )
}

// Helper: Log workflow state transition
async function logWorkflowState(
  organizationId: string | undefined,
  workflowType: string,
  entityType: string,
  entityId: string,
  currentState: string,
  previousState: string
) {
  const supabase = await createClient()

  await supabase.from('workflow_states').insert({
    organization_id: organizationId,
    workflow_type: workflowType,
    entity_type: entityType,
    entity_id: entityId,
    current_state: currentState,
    previous_state: previousState,
    transitioned_at: new Date().toISOString(),
  })
}

// Helper: Create notification
async function createNotification(
  organizationId: string | undefined,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error',
  entityType?: string,
  entityId?: string
) {
  const supabase = await createClient()

  // Get admin users to notify
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('organization_id', organizationId)
    .in('role', ['admin', 'hr'])
    .limit(5)

  if (!admins || admins.length === 0) return

  // Create notifications for each admin
  const notifications = admins.map((admin) => ({
    organization_id: organizationId,
    user_id: admin.id,
    title,
    message,
    type,
    entity_type: entityType,
    entity_id: entityId,
    read: false,
  }))

  await supabase.from('notifications').insert(notifications)
}

// Transition candidate to next status
export async function transitionCandidate(candidateId: string, targetStatus: string) {
  const supabase = await createClient()

  // Get current status
  const { data: candidate } = await supabase.from('candidates').select('status, organization_id').eq('id', candidateId).single()

  if (!candidate) throw new Error('Candidate not found')

  const currentStatus = candidate.status
  const allowedTransitions = CANDIDATE_STATUS_FLOW[currentStatus] || []

  if (!allowedTransitions.includes(targetStatus)) {
    throw new Error(`Cannot transition from ${currentStatus} to ${targetStatus}`)
  }

  // Update status
  await supabase.from('candidates').update({ status: targetStatus }).eq('id', candidateId)

  // Log the transition
  await logWorkflowState(candidate.organization_id, 'recruitment', 'candidate', candidateId, targetStatus, currentStatus)

  return { previousStatus: currentStatus, newStatus: targetStatus }
}

// Complete chatbot session
export async function completeChatbotSession(sessionId: string, qualificationScore: number, qualificationData: Record<string, unknown>) {
  const supabase = await createClient()

  // Update session
  const { data: session, error } = await supabase
    .from('chatbot_sessions')
    .update({
      status: 'completed',
      qualification_score: qualificationScore,
      qualification_data: qualificationData,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select('candidate_id, candidate:candidates(organization_id)')
    .single()

  if (error || !session) throw new Error('Failed to complete chatbot session')

  // Emit event
  await emitEvent(
    'chatbot_completed',
    'chatbot_session',
    sessionId,
    { session, qualificationScore, qualificationData },
    (session.candidate as { organization_id: string })?.organization_id
  )

  return session
}

// Complete interview
export async function completeInterview(interviewId: string, notes?: string) {
  const supabase = await createClient()

  // Update interview
  const { data: interview, error } = await supabase
    .from('interviews')
    .update({
      status: 'completed',
      notes,
    })
    .eq('id', interviewId)
    .select('candidate_id, candidate:candidates(organization_id)')
    .single()

  if (error || !interview) throw new Error('Failed to complete interview')

  // Emit event
  await emitEvent(
    'interview_completed',
    'interview',
    interviewId,
    { interview },
    (interview.candidate as { organization_id: string })?.organization_id
  )

  return interview
}

// Generate document
export async function generateDocument(
  documentType: 'interview_report' | 'approval_request' | 'offer_letter' | 'contract' | 'evaluation_summary',
  entityType: string,
  entityId: string,
  content: Record<string, unknown>,
  organizationId?: string
) {
  const supabase = await createClient()

  const titles: Record<string, string> = {
    interview_report: 'Interview Report',
    approval_request: 'HR Approval Request',
    offer_letter: 'Offer Letter',
    contract: 'Employment Contract',
    evaluation_summary: 'Evaluation Summary',
  }

  const { data: document, error } = await supabase
    .from('documents')
    .insert({
      organization_id: organizationId,
      document_type: documentType,
      title: `${titles[documentType]} - ${new Date().toLocaleDateString()}`,
      entity_type: entityType,
      entity_id: entityId,
      content,
      status: 'final',
    })
    .select()
    .single()

  if (error) throw new Error('Failed to generate document')

  // Emit event
  await emitEvent('document_generated', 'document', document.id, { document, documentType }, organizationId)

  return document
}
