import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { emitEvent } from '@/lib/workflow/engine'

export async function GET() {
  const supabase = await createClient()
  
  const { data: approvals, error } = await supabase
    .from('approval_requests')
    .select(`
      *,
      candidate:candidates(id, first_name, last_name, email, ai_score, organization_id),
      position:positions(id, title, department, salary_min, salary_max),
      requested_by_user:profiles!requested_by(id, full_name, email),
      approver:profiles!approver_id(id, full_name, email)
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(approvals)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { data: approval, error } = await supabase
    .from('approval_requests')
    .insert(body)
    .select(`
      *,
      candidate:candidates(organization_id)
    `)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Emit approval_requested event through workflow engine
  const organizationId = (approval.candidate as { organization_id: string })?.organization_id
  
  await emitEvent(
    'approval_requested',
    'approval_request',
    approval.id,
    { approval },
    organizationId
  )
  
  // Update candidate status to approval
  await supabase
    .from('candidates')
    .update({ status: 'approval' })
    .eq('id', body.candidate_id)
  
  return NextResponse.json(approval)
}
