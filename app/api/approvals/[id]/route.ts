import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { emitEvent } from '@/lib/workflow/engine'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()
  
  const updateData: Record<string, unknown> = { ...body }
  
  if (body.status === 'approved' || body.status === 'rejected') {
    updateData.decided_at = new Date().toISOString()
  }
  
  const { data: approval, error } = await supabase
    .from('approval_requests')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      candidate:candidates(id, first_name, last_name, email, organization_id),
      position:positions(id, title, department)
    `)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Emit approval_completed event through workflow engine
  if (body.status === 'approved' || body.status === 'rejected') {
    const organizationId = (approval.candidate as { organization_id: string })?.organization_id
    
    // Update candidate status
    const newStatus = body.status === 'approved' ? 'hired' : 'rejected'
    await supabase
      .from('candidates')
      .update({ status: newStatus })
      .eq('id', approval.candidate_id)
    
    await emitEvent(
      'approval_completed',
      'approval_request',
      approval.id,
      { approval, decision: body.status },
      organizationId
    )
  }
  
  return NextResponse.json(approval)
}
